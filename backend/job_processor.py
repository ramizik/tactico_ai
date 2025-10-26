"""
Background Job Processor for TacticoAI
Handles video analysis jobs in the background
"""

import os
import time
import threading
import logging
from typing import Dict, Optional, List
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from video_processor import run_ml_analysis_from_chunks

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobProcessor:
    """
    Background job processor for video analysis with parallel execution support
    """

    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
        self.running = False
        self.thread = None

        # Parallel processing configuration
        self.active_jobs = {}  # job_id -> thread mapping
        # Single job processing (no preview/full split)
        self.max_concurrent_jobs = int(os.getenv("MAX_CONCURRENT_JOBS", "1"))
        self.job_lock = threading.Lock()  # Thread safety for active_jobs dictionary

        logger.info(f"Job processor initialized with max_concurrent_jobs={self.max_concurrent_jobs} (YOLO will auto-detect GPU)")

    def start(self):
        """Start the background job processor"""
        if self.running:
            logger.warning("Job processor is already running")
            return

        self.running = True
        self.thread = threading.Thread(target=self._process_jobs, daemon=True)
        self.thread.start()
        logger.info("Job processor started")

    def stop(self):
        """Stop the background job processor and wait for active jobs to complete"""
        logger.info("Stopping job processor...")
        self.running = False

        # Wait for all active jobs to complete (with timeout)
        if self.active_jobs:
            logger.info(f"Waiting for {len(self.active_jobs)} active jobs to complete...")
            with self.job_lock:
                for job_id, thread in list(self.active_jobs.items()):
                    logger.info(f"Waiting for job {job_id} to complete...")
                    thread.join(timeout=30)  # Wait max 30 seconds per job
                    if thread.is_alive():
                        logger.warning(f"Job {job_id} did not complete within timeout")

        if self.thread:
            self.thread.join()

        logger.info("Job processor stopped")

    def _process_jobs(self):
        """Main job processing loop with parallel execution support"""
        while self.running:
            try:
                # Get queued jobs (preview jobs prioritized)
                queued_jobs = self._get_queued_jobs()

                # Clean up finished threads
                self._cleanup_finished_jobs()

                # Start new jobs if we have capacity
                for job in queued_jobs:
                    if not self.running:
                        break

                    job_id = job["id"]

                    # Check if we can start a new job
                    with self.job_lock:
                        if len(self.active_jobs) < self.max_concurrent_jobs and job_id not in self.active_jobs:
                            # Start job in a new thread for parallel execution
                            thread = threading.Thread(
                                target=self._process_job_wrapper,
                                args=(job,),
                                daemon=True,
                                name=f"Job-{job_id[:8]}"
                            )
                            thread.start()
                            self.active_jobs[job_id] = thread
                            logger.info(f"Started job {job_id} (type: {job.get('job_type', 'enhanced_analysis')}, active jobs: {len(self.active_jobs)})")

                # Sleep before next check
                time.sleep(5)  # Check every 5 seconds

            except Exception as e:
                logger.error(f"Error in job processing loop: {e}")
                time.sleep(10)  # Wait longer on error

    def _cleanup_finished_jobs(self):
        """Remove completed threads from active jobs tracking"""
        with self.job_lock:
            finished_jobs = [
                job_id for job_id, thread in self.active_jobs.items()
                if not thread.is_alive()
            ]
            for job_id in finished_jobs:
                del self.active_jobs[job_id]
                logger.info(f"Cleaned up finished job {job_id} (remaining active: {len(self.active_jobs)})")

    def _process_job_wrapper(self, job: Dict):
        """Wrapper for processing job with error handling and cleanup"""
        job_id = job["id"]
        try:
            self._process_job(job)
        except Exception as e:
            logger.error(f"Job {job_id} failed with exception: {e}")
            self._update_job_status(job_id, "failed", 0, str(e))
        finally:
            # Ensure job is removed from active jobs
            with self.job_lock:
                if job_id in self.active_jobs:
                    del self.active_jobs[job_id]

    def _get_queued_jobs(self) -> list:
        """Get all queued jobs from database"""
        try:
            result = self.supabase.table("jobs") \
                .select("*") \
                .eq("status", "queued") \
                .order("created_at") \
                .execute()

            if result.data:
                logger.debug(f"Found {len(result.data)} jobs queued")

            return result.data
        except Exception as e:
            logger.error(f"Error fetching queued jobs: {e}")
            return []

    def _process_job(self, job: Dict):
        """Process a single job"""
        job_id = job["id"]
        match_id = job["match_id"]
        job_type = job.get("job_type", "enhanced_analysis")

        logger.info(f"Processing job {job_id} for match {match_id} (type: {job_type})")

        try:
            # Update job status to running
            self._update_job_status(job_id, "running", 0)

            # Get match details
            match = self._get_match_details(match_id)
            if not match:
                raise Exception("Match not found")

            # Check if video fully uploaded
            upload_status = match.get("upload_status", "pending")
            if upload_status != "uploaded":
                logger.warning(
                    f"Job {job_id} skipped: Match {match_id} video not uploaded yet "
                    f"(upload_status={upload_status}). This job will be cancelled."
                )
                self._update_job_status(
                    job_id, "cancelled", 0,
                    "Job cancelled: Video not uploaded. Job was likely created prematurely."
                )
                return

            # Process enhanced_analysis only
            if job_type == "enhanced_analysis":
                result = self._process_ml_analysis(job_id, match_id, match)
            else:
                raise Exception(f"Unsupported job type: {job_type}. Only 'enhanced_analysis' is supported.")

            # Update job as completed
            self._update_job_status(job_id, "completed", 100)
            logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            self._update_job_status(job_id, "failed", 0, str(e))

    def _process_ml_analysis(self, job_id: str, match_id: str, match: Dict) -> Dict:
        """Process ML analysis algorithm with player tracking and team assignment"""
        try:
            # Get video path
            team_id = match["team_id"]
            total_chunks = match.get("video_chunks_total", 0)

            # Retry logic to handle potential database replication lag
            if total_chunks == 0:
                logger.warning(f"No chunks found initially for match {match_id}, retrying after delay...")
                import time
                time.sleep(2)  # Wait 2 seconds for database replication

                # Retry fetching match details
                match = self._get_match_details(match_id)
                if match:
                    total_chunks = match.get("video_chunks_total", 0)
                    logger.info(f"After retry: found {total_chunks} chunks for match {match_id}")

                # If still no chunks, this is a real error
                if total_chunks == 0:
                    raise Exception(
                        f"No video chunks found for analysis. "
                        f"Match {match_id} has video_chunks_total=0. "
                        f"Please ensure video upload completed successfully."
                    )

            logger.info(f"Starting ML analysis for match {match_id} with {total_chunks} chunks")
            logger.info(f"DEBUG: team_id={team_id}, match_id={match_id}, total_chunks={total_chunks}")

            # Update progress
            self._update_job_status(job_id, "running", 10)

            # Run ML analysis from chunks
            logger.info(f"DEBUG: Calling run_ml_analysis_from_chunks...")
            video_path, analysis_results = run_ml_analysis_from_chunks(
                team_id, match_id, total_chunks
            )
            logger.info(f"DEBUG: run_ml_analysis_from_chunks returned - video_path={video_path}, analysis_results keys={list(analysis_results.keys()) if analysis_results else None}")

            if video_path is None or "error" in analysis_results:
                error_detail = analysis_results.get('error', 'Unknown error') if analysis_results else 'No analysis results returned'
                logger.error(f"DEBUG: ML analysis failed - video_path is None: {video_path is None}, error in results: {'error' in analysis_results if analysis_results else 'N/A'}")
                raise Exception(f"ML analysis failed: {error_detail}")

            # Update progress
            self._update_job_status(job_id, "running", 95)

            # Analysis data already saved to Supabase by ml_analysis_processor
            # Tracking positions already saved to tracked_positions table
            # Video saved locally to video_outputs/

            # Log local video path for manual inspection
            logger.info(f"Analysis video saved locally: {video_path}")
            logger.info(f"Analysis complete for match {match_id}")

            return analysis_results

        except Exception as e:
            logger.error(f"ML analysis failed: {e}")
            raise

    def _get_match_details(self, match_id: str) -> Optional[Dict]:
        """Get match details from database"""
        try:
            result = self.supabase.table("matches").select("*").eq("id", match_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching match details: {e}")
            return None

    def _update_job_status(self, job_id: str, status: str, progress: int, error_message: str = None):
        """Update job status in database"""
        try:
            update_data = {
                "status": status,
                "progress": progress,
                "updated_at": datetime.utcnow().isoformat()
            }

            if status == "running" and progress == 0:
                update_data["started_at"] = datetime.utcnow().isoformat()
            elif status in ["completed", "failed"]:
                update_data["completed_at"] = datetime.utcnow().isoformat()

            if error_message:
                update_data["error_message"] = error_message

            self.supabase.table("jobs").update(update_data).eq("id", job_id).execute()

        except Exception as e:
            logger.error(f"Error updating job status: {e}")

    def _save_analysis_results(self, match_id: str, results: Dict):
        """Save analysis results to database"""
        try:
            # Check if analysis already exists
            existing = self.supabase.table("analyses").select("id").eq("match_id", match_id).execute()

            analysis_data = {
                "match_id": match_id,
                "summary": results.get("summary", ""),
                "tactical_insights": results.get("tactical_insights", ""),
                "metrics": results.get("metrics", {}),
                "events": results.get("events", []),
                "formation": results.get("formation", {}),
                "updated_at": datetime.utcnow().isoformat()
            }

            if existing.data:
                # Update existing analysis
                self.supabase.table("analyses").update(analysis_data).eq("match_id", match_id).execute()
            else:
                # Create new analysis
                analysis_data["created_at"] = datetime.utcnow().isoformat()
                self.supabase.table("analyses").insert(analysis_data).execute()

            logger.info(f"Analysis results saved for match {match_id}")

        except Exception as e:
            logger.error(f"Error saving analysis results: {e}")


# Global job processor instance
_job_processor = None

def start_job_processor():
    """Start the background job processor"""
    global _job_processor

    if _job_processor is None:
        _job_processor = JobProcessor()

    _job_processor.start()
    return _job_processor

def stop_job_processor():
    """Stop the background job processor"""
    global _job_processor

    if _job_processor:
        _job_processor.stop()
        _job_processor = None

if __name__ == "__main__":
    # Test the job processor
    processor = JobProcessor()

    try:
        processor.start()
        logger.info("Job processor running. Press Ctrl+C to stop.")

        # Keep running until interrupted
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        logger.info("Stopping job processor...")
        processor.stop()
