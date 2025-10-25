"""
TacticoAI Backend API
FastAPI application for managing sports tactical analysis
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
import uuid
import shutil
from pathlib import Path

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="TacticoAI API",
    version="1.0.0",
    description="AI-powered tactical analysis for college sports teams"
)

# CORS Configuration - Allow frontend access
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client with service role key (backend only)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Import and start job processor
try:
    from job_processor import start_job_processor
    start_job_processor()
except ImportError:
    print("Warning: job_processor not available. Background jobs will not run.")

# Import Letta client
try:
    from tactico_letta_client import letta_client
    print("Letta client loaded successfully")
except ImportError as e:
    print(f"Letta client import failed: {e}")
    letta_client = None
except Exception as e:
    print(f"Letta client initialization failed: {e}")
    letta_client = None

import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Clean up stale queued jobs from previous sessions (demo-friendly)
try:
    logger.info("Cleaning up stale jobs from previous sessions...")

    # For demo purposes, clean up jobs older than 5 minutes
    # This ensures fresh testing without old jobs interfering
    thirty_minutes_ago = (datetime.utcnow() - timedelta(minutes=5)).isoformat()

    # Find stale queued jobs
    stale_jobs = supabase.table("jobs").select("id, match_id, job_type, created_at").eq("status", "queued").lt("created_at", thirty_minutes_ago).execute()

    if stale_jobs.data:
        logger.info(f"Found {len(stale_jobs.data)} stale queued jobs, marking as cancelled")
        for job in stale_jobs.data:
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": "Job cancelled - backend restarted (demo cleanup)",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", job["id"]).execute()
            logger.info(f"Cancelled stale job {job['id']} (type: {job.get('job_type', 'unknown')}, created: {job.get('created_at')})")
    else:
        logger.info("No stale jobs found")

    # Also clean up any running jobs that might be stuck
    running_jobs = supabase.table("jobs").select("id, match_id, job_type, started_at").eq("status", "running").lt("started_at", thirty_minutes_ago).execute()

    if running_jobs.data:
        logger.info(f"Found {len(running_jobs.data)} stuck running jobs, marking as failed")
        for job in running_jobs.data:
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": "Job timeout - backend restarted (demo cleanup)",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", job["id"]).execute()
            logger.info(f"Failed stuck job {job['id']} (type: {job.get('job_type', 'unknown')}, started: {job.get('started_at')})")

except Exception as e:
    logger.warning(f"Could not clean up stale jobs: {e}")
    # Don't crash the API if cleanup fails

# Local storage configuration for video chunks
LOCAL_VIDEO_STORAGE = Path("video_storage")
LOCAL_VIDEO_STORAGE.mkdir(exist_ok=True)

def get_video_chunk_path(team_id: str, match_id: str, chunk_index: int) -> Path:
    """
    Get the local file path for a video chunk.

    Creates the directory structure and returns the path where a specific chunk
    should be stored. Directory structure: video_storage/{team_id}/{match_id}/chunks/

    Args:
        team_id: UUID of the team uploading the video
        match_id: UUID of the match this video belongs to
        chunk_index: Zero-based index of the chunk (0, 1, 2, ...)

    Returns:
        Path: Full path to the chunk file (e.g., chunk_000.mp4)
    """
    chunk_dir = LOCAL_VIDEO_STORAGE / team_id / match_id / "chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)
    return chunk_dir / f"chunk_{chunk_index:03d}.mp4"

def get_combined_video_path(team_id: str, match_id: str) -> Path:
    """
    Get the local file path for the combined video.

    Creates the directory structure and returns the path where the merged video
    should be stored. Directory structure: video_storage/{team_id}/{match_id}/

    Args:
        team_id: UUID of the team uploading the video
        match_id: UUID of the match this video belongs to

    Returns:
        Path: Full path to the combined video file
    """
    video_dir = LOCAL_VIDEO_STORAGE / team_id / match_id
    video_dir.mkdir(parents=True, exist_ok=True)
    return video_dir / "combined_video.mp4"


# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    from job_processor import _job_processor

    job_processor_status = "not_started"
    if _job_processor:
        job_processor_status = "running" if _job_processor.running else "stopped"

    return {
        "status": "healthy",
        "service": "TacticoAI API",
        "version": "1.0.0",
        "job_processor": job_processor_status
    }


@app.get("/api/debug/jobs")
async def debug_jobs():
    """Debug endpoint to check job status (demo-friendly)"""
    try:
        from job_processor import _job_processor

        # Get all jobs with their status
        all_jobs = supabase.table("jobs").select("id, status, job_type, match_id, created_at, started_at, error_message").order("created_at", desc=True).limit(20).execute()

        # Count by status
        status_counts = {}
        for job in all_jobs.data:
            status = job.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            "total_jobs": len(all_jobs.data),
            "status_counts": status_counts,
            "recent_jobs": all_jobs.data[:10],  # Last 10 jobs
            "job_processor_running": _job_processor.running if _job_processor else False
        }
    except Exception as e:
        return {"error": str(e)}


# ==================== Teams Endpoints ====================

@app.get("/api/teams")
async def get_teams():
    """Get all teams (demo: UOP and UC California)"""
    try:
        result = supabase.table("teams").select("*").execute()
        return {"teams": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/teams/{team_id}")
async def get_team(team_id: str):
    """Get a specific team by ID"""
    try:
        result = supabase.table("teams").select("*").eq("id", team_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Team not found")

        return {"team": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== Players Endpoints ====================

@app.get("/api/teams/{team_id}/players")
async def get_team_players(team_id: str):
    """Get all players for a specific team"""
    try:
        result = supabase.table("players").select("*").eq("team_id", team_id).execute()
        return {"players": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/teams/{team_id}/players")
async def create_player(
    team_id: str,
    name: str = Form(...),
    position: str = Form(...),
    number: int = Form(...),
    avatar_url: Optional[str] = Form(None)
):
    """Create a new player for a team"""
    try:
        player_data = {
            "team_id": team_id,
            "name": name,
            "position": position,
            "number": number,
            "avatar_url": avatar_url,
            "stats": {
                "goals": 0,
                "assists": 0,
                "rating": 0.0
            }
        }

        result = supabase.table("players").insert(player_data).execute()
        return {"player": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== Matches Endpoints ====================

@app.get("/api/teams/{team_id}/matches")
async def get_team_matches(team_id: str, limit: int = 10):
    """Get all matches for a team with their analysis status"""
    try:
        result = (
            supabase.table("matches")
            .select("*, jobs(*), analyses(*)")
            .eq("team_id", team_id)
            .order("match_date", desc=True)
            .limit(limit)
            .execute()
        )
        return {"matches": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/matches/{match_id}")
async def get_match(match_id: str):
    """Get a specific match with its analysis"""
    try:
        result = (
            supabase.table("matches")
            .select("*, jobs(*), analyses(*), teams(*)")
            .eq("id", match_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Match not found")

        return {"match": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/teams/{team_id}/matches")
async def create_match(
    team_id: str,
    opponent: str = Form(...),
    sport: str = Form(...),
    match_date: str = Form(...)
):
    """
    Create a new match record.
    Job will be created later after video upload is complete.
    """
    try:
        # Validate sport (soccer only)
        if sport != "soccer":
            raise HTTPException(status_code=400, detail="Sport must be 'soccer'")

        # Create match record
        match_data = {
            "team_id": team_id,
            "opponent": opponent,
            "sport": sport,
            "match_date": match_date,
            "status": "new"
        }

        match_result = supabase.table("matches").insert(match_data).execute()
        match_id = match_result.data[0]["id"]
        
        logger.info(f"Match created: {match_id} - {opponent} on {match_date}")

        # Note: Job creation happens AFTER video upload (in upload_video_chunk endpoint)
        # This prevents processing jobs from starting before video is available

        return {
            "match_id": match_id,
            "job_id": None,  # No job yet - will be created after video upload
            "status": "created"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== Job Status Endpoints ====================

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a processing job"""
    try:
        result = supabase.table("jobs").select("*").eq("id", job_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = result.data[0]
        return {
            "job_id": job["id"],
            "match_id": job["match_id"],
            "status": job["status"],
            "progress": job["progress"],
            "error": job.get("error_message"),
            "updated_at": job["updated_at"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/matches/{match_id}/job")
async def get_match_job_status(match_id: str):
    """Get the processing job status for a specific match"""
    try:
        result = supabase.table("jobs").select("*").eq("match_id", match_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No job found for this match")

        job = result.data[0]
        return {
            "job_id": job["id"],
            "match_id": job["match_id"],
            "status": job["status"],
            "progress": job["progress"],
            "error": job.get("error_message"),
            "updated_at": job["updated_at"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== Analysis Endpoints ====================

@app.get("/api/matches/{match_id}/analysis")
async def get_match_analysis(match_id: str):
    """Get the AI analysis for a match"""
    try:
        result = supabase.table("analyses").select("*").eq("match_id", match_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No analysis found for this match")

        return {"analysis": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== Storage Endpoints ====================

@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    team_id: str = Form(...),
    match_id: Optional[str] = Form(None)
):
    """
    Upload a match video to Supabase Storage
    Returns a signed URL for the video
    """
    try:
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{team_id}/{uuid.uuid4()}.{file_extension}"

        # Read file content
        file_content = await file.read()

        # Upload to Supabase Storage
        result = supabase.storage.from_("videos").upload(
            unique_filename,
            file_content,
            {"content-type": file.content_type}
        )

        # Generate signed URL (valid for 1 hour)
        signed_url_result = supabase.storage.from_("videos").create_signed_url(
            unique_filename,
            3600  # 1 hour expiry
        )

        return {
            "path": unique_filename,
            "url": signed_url_result["signedURL"],
            "message": "Video uploaded successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


# ==================== Chunked Upload Endpoints ====================

@app.post("/api/upload/video-chunk")
async def upload_video_chunk(
    file: UploadFile = File(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    match_id: str = Form(...),
    team_id: str = Form(...)
):
    """
    Upload a video chunk for chunked video upload system.

    This endpoint handles progressive video uploads by accepting individual chunks
    of a larger video file. It provides real-time progress tracking and automatically
    triggers analysis jobs based on upload progress.

    Args:
        file: The video chunk file (typically 10MB)
        chunk_index: Zero-based index of current chunk (0, 1, 2, ...)
        total_chunks: Total number of chunks for the complete video
        match_id: UUID of the match this video belongs to
        team_id: UUID of the team uploading the video

    Returns:
        dict: Upload status with progress information

    Triggers:
        - Quick Brief Analysis: After 3rd chunk (chunk_index == 2)
        - Full Analysis: After last chunk (chunk_index == total_chunks - 1)

    Storage:
        - Chunks stored locally under: video_storage/{team_id}/{match_id}/chunks/
        - Database tracks progress in matches table
    """
    try:
        # Validate chunk parameters
        if chunk_index < 0 or chunk_index >= total_chunks:
            raise HTTPException(status_code=400, detail="Invalid chunk index")

        if total_chunks <= 0 or total_chunks > 100:  # Increased to 100 chunks (1GB max)
            raise HTTPException(status_code=400, detail="Invalid total chunks (1-100 allowed, max 1GB)")

        # Get local file path for this chunk
        chunk_path = get_video_chunk_path(team_id, match_id, chunk_index)

        # Read chunk content
        chunk_content = await file.read()

        # Save chunk to local storage
        try:
            with open(chunk_path, "wb") as f:
                f.write(chunk_content)
            print(f"Chunk saved locally: {chunk_path}")
        except Exception as storage_error:
            print(f"Local storage error: {storage_error}")
            raise HTTPException(status_code=500, detail=f"Local storage failed: {str(storage_error)}")

        # Update match record with chunk progress
        update_result = supabase.table("matches").update({
            "video_chunks_uploaded": chunk_index + 1,
            "video_chunks_total": total_chunks
        }).eq("id", match_id).execute()

        if not update_result.data:
            raise HTTPException(status_code=404, detail="Match not found")

        # Note: Quick Brief analysis removed - only Enhanced Analysis is supported
        # Enhanced Analysis job is created after all chunks are uploaded (see below)

        # Check if all chunks uploaded (trigger Enhanced Analysis)
        if chunk_index == total_chunks - 1:  # Last chunk
            # Update upload status and ensure chunk counts are finalized
            # Consolidate into single update to avoid race conditions
            final_update = supabase.table("matches").update({
                "upload_status": "uploaded",
                "video_chunks_uploaded": total_chunks,  # Ensure final count is set
                "video_chunks_total": total_chunks       # Ensure total is confirmed
            }).eq("id", match_id).execute()
            
            # Verify the update succeeded before creating job
            if not final_update.data:
                logger.error(f"Failed to finalize upload status for match {match_id}")
                raise HTTPException(status_code=500, detail="Failed to finalize upload status")
            
            logger.info(f"Upload finalized for match {match_id}: {total_chunks} chunks")
            
            # Small delay to ensure database consistency across replicas (Supabase)
            # This prevents race condition where job processor queries before update propagates
            import time
            time.sleep(0.3)  # 300ms delay for database propagation

            # Create Enhanced Analysis job (split-screen with ball tracking)
            # First check if a job already exists for this match to avoid duplicates
            existing_jobs = supabase.table("jobs").select("id, status").eq("match_id", match_id).eq("job_type", "enhanced_analysis").execute()
            
            if existing_jobs.data:
                # Job already exists, log it but don't fail
                existing_job = existing_jobs.data[0]
                logger.info(f"Enhanced analysis job already exists: {existing_job['id']} (status: {existing_job['status']})")
            else:
                # Create new job
                job_data = {
                    "match_id": match_id,
                    "status": "queued",
                    "progress": 0,
                    "job_type": "enhanced_analysis"  # Using new enhanced analysis
                }
                try:
                    job_result = supabase.table("jobs").insert(job_data).execute()
                    logger.info(f"Enhanced analysis job created: {job_result.data[0]['id']}")
                except Exception as job_error:
                    logger.error(f"Failed to create job for match {match_id}: {job_error}")
                    # Don't fail the upload, job can be created manually later
                    logger.warning("Upload succeeded but job creation failed. Job can be triggered manually.")

        return {
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
            "uploaded_chunks": chunk_index + 1,
            "progress_percent": round(((chunk_index + 1) / total_chunks) * 100, 2),
            "message": "Chunk uploaded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunk upload error: {str(e)}")


@app.get("/api/matches/{match_id}/upload-status")
async def get_upload_status(match_id: str):
    """
    Get the current upload status for a match.

    This endpoint provides real-time information about the progress of chunked
    video uploads. It's used by the frontend to display upload progress bars
    and status indicators.

    Args:
        match_id: UUID of the match to check upload status for

    Returns:
        dict: Upload status including:
            - total_chunks: Total number of chunks for the video
            - uploaded_chunks: Number of chunks successfully uploaded
            - upload_status: Current status ('uploading', 'uploaded', 'failed')
            - progress_percent: Upload completion percentage (0-100)

    Use Cases:
        - Real-time progress tracking in frontend
        - Polling for upload completion
        - Error handling and retry logic
    """
    try:
        result = supabase.table("matches").select(
            "id, video_chunks_total, video_chunks_uploaded, upload_status"
        ).eq("id", match_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Match not found")

        match = result.data[0]
        progress_percent = 0
        if match["video_chunks_total"] > 0:
            progress_percent = round((match["video_chunks_uploaded"] / match["video_chunks_total"]) * 100, 2)

        return {
            "match_id": match_id,
            "total_chunks": match["video_chunks_total"],
            "uploaded_chunks": match["video_chunks_uploaded"],
            "upload_status": match["upload_status"],
            "progress_percent": progress_percent
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting upload status: {str(e)}")


@app.post("/api/matches/{match_id}/analyze")
async def trigger_analysis(
    match_id: str,
    analysis_type: str = Form(...)
):
    """
    Manually trigger analysis for a match.

    This endpoint triggers enhanced video analysis jobs with AI-powered
    tactical insights, player tracking, and comprehensive match analytics.

    Args:
        match_id: UUID of the match to analyze
        analysis_type: Type of analysis to perform (must be 'enhanced_analysis')

    Returns:
        dict: Job creation confirmation with job details

    Analysis Type:
        - enhanced_analysis: Split-screen with ball tracking, tactical board, and local export

    Prerequisites:
        - Match must exist in database
        - Video must be fully uploaded (upload_status = 'uploaded')

    Job Creation:
        - Creates job record in jobs table
        - Queues job for background processing
    """
    try:
        # Validate analysis type (enhanced_analysis only)
        if analysis_type != "enhanced_analysis":
            raise HTTPException(status_code=400, detail="Analysis type must be 'enhanced_analysis'")

        # Check if match exists
        match_result = supabase.table("matches").select("id, upload_status").eq("id", match_id).execute()
        if not match_result.data:
            raise HTTPException(status_code=404, detail="Match not found")

        match = match_result.data[0]

        # Ensure video is uploaded
        if match["upload_status"] != "uploaded":
            raise HTTPException(status_code=400, detail="Video must be fully uploaded for enhanced_analysis")

        # Create analysis job
        job_data = {
            "match_id": match_id,
            "status": "queued",
            "progress": 0,
            "job_type": analysis_type
        }

        result = supabase.table("jobs").insert(job_data).execute()

        return {
            "job_id": result.data[0]["id"],
            "match_id": match_id,
            "analysis_type": analysis_type,
            "status": "queued",
            "message": f"{analysis_type} analysis job created"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating analysis job: {str(e)}")


# ==================== Demo/Seed Endpoints ====================

@app.post("/api/demo/seed")
async def seed_demo_data():
    """
    Seed database with demo data for hackathon
    Creates UOP and UC California teams with sample data
    """
    try:
        # This endpoint would call the seed_data.py functions
        # For now, return a message
        return {
            "message": "Demo data seeding should be done via seed_data.py script",
            "instructions": "Run: python backend/seed_data.py"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding error: {str(e)}")

# ==================== Letta AI Endpoints ====================

@app.get("/api/letta/status")
async def get_letta_status():
    """Get Letta AI client status"""
    if not letta_client:
        return {
            "available": False,
            "message": "Letta client not initialized"
        }

    status = letta_client.get_status()
    return {
        "available": status["available"],
        "api_key_set": status["api_key_set"],
        "agent_id_set": status["agent_id_set"],
        "client_initialized": status["client_initialized"],
        "message": "Letta AI is ready" if status["available"] else "Letta AI not configured"
    }

@app.post("/api/letta/ask")
async def ask_letta(request: dict):
    """Ask Letta AI a question"""
    if not letta_client or not letta_client.is_available():
        raise HTTPException(status_code=503, detail="Letta AI not available")

    question = request.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        # Optional context data
        context = request.get("context", {})

        # Ask Letta AI
        response = letta_client.ask_question(question, context)

        if response:
            return {
                "question": question,
                "response": response,
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to get response from Letta AI")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Letta AI error: {str(e)}")

@app.post("/api/letta/test")
async def test_letta():
    """Test Letta AI with a dummy question"""
    if not letta_client or not letta_client.is_available():
        raise HTTPException(status_code=503, detail="Letta AI not available")

    # Dummy coaching question
    test_question = "What are the key tactical improvements a college soccer team should focus on?"

    try:
        response = letta_client.ask_question(test_question)

        if response:
            return {
                "test_question": test_question,
                "response": response,
                "status": "success",
                "message": "Letta AI is working correctly"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to get response from Letta AI")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Letta AI test failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
