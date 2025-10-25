"""
Background Job Processor for TacticoAI
Handles video analysis jobs in the background
"""

import os
import time
import threading
import logging
from typing import Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from video_processor import run_full_analysis_from_chunks

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobProcessor:
    """
    Background job processor for video analysis
    """

    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
        self.running = False
        self.thread = None
        self.device = os.getenv("ANALYSIS_DEVICE", "cpu")

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
        """Stop the background job processor"""
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("Job processor stopped")

    def _process_jobs(self):
        """Main job processing loop"""
        while self.running:
            try:
                # Get queued jobs
                queued_jobs = self._get_queued_jobs()

                for job in queued_jobs:
                    if not self.running:
                        break

                    self._process_job(job)

                # Sleep before next check
                time.sleep(5)  # Check every 5 seconds

            except Exception as e:
                logger.error(f"Error in job processing loop: {e}")
                time.sleep(10)  # Wait longer on error

    def _get_queued_jobs(self) -> list:
        """Get all queued jobs from database"""
        try:
            result = self.supabase.table("jobs").select("*").eq("status", "queued").execute()
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

            # Safety check: Skip jobs for matches without video
            # This handles any legacy jobs created before video upload
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
                result = self._process_enhanced_analysis(job_id, match_id, match)
            else:
                raise Exception(f"Unsupported job type: {job_type}. Only 'enhanced_analysis' is supported.")

            # Update job as completed
            self._update_job_status(job_id, "completed", 100)
            logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            self._update_job_status(job_id, "failed", 0, str(e))

    def _process_enhanced_analysis(self, job_id: str, match_id: str, match: Dict) -> Dict:
        """Process enhanced split-screen analysis job with ball tracking"""
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
                        f"No video chunks found for enhanced analysis. "
                        f"Match {match_id} has video_chunks_total=0. "
                        f"Please ensure video upload completed successfully."
                    )

            # Update progress
            self._update_job_status(job_id, "running", 10)

            # Combine chunks
            from video_processor import VideoProcessor
            processor = VideoProcessor(device=self.device)
            combined_video_path = processor.combine_local_chunks(team_id, match_id, total_chunks)

            if not combined_video_path:
                raise Exception("Failed to combine video chunks")

            # Update progress
            self._update_job_status(job_id, "running", 20)

            # Run enhanced analysis
            video_path, analysis_results = processor.run_enhanced_analysis(combined_video_path, match_id)

            if video_path is None or "error" in analysis_results:
                raise Exception(f"Enhanced analysis failed: {analysis_results.get('error', 'Unknown error')}")

            # Update progress
            self._update_job_status(job_id, "running", 85)

            # Analysis data already saved to Supabase by enhanced script
            # Tracking positions already saved to tracked_positions table
            # Video saved locally to backend/video_outputs/

            # Log local video path for manual inspection
            logger.info(f"Enhanced video saved locally: {video_path}")
            logger.info(f"Tracking data exported to: backend/tracking_data/")

            # Update progress
            self._update_job_status(job_id, "running", 95)

            return analysis_results

        except Exception as e:
            logger.error(f"Enhanced analysis failed: {e}")
            raise
        finally:
            if 'processor' in locals():
                processor.cleanup()

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
