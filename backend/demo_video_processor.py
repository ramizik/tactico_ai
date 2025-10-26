"""
Demo Video Processor for Hackathon
Processes complete video files without chunking
"""
import os
import sys
import uuid
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from video_processor import VideoProcessor
from ml_analysis_processor import process_video_with_ml_analysis
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def process_demo_video(video_path: str, team_id: str, opponent_name: str = "Opponent Team"):
    """
    Process a demo video directly without chunking

    Args:
        video_path: Path to the complete video file
        team_id: Your team ID from Supabase
        opponent_name: Name of the opponent team

    Returns:
        match_id: The created match ID
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        return None

    video_size = os.path.getsize(video_path)
    print(f"Processing video: {video_path}")
    print(f"Video size: {video_size / (1024*1024):.2f} MB")

    # Create match record in database
    match_id = str(uuid.uuid4())
    match_data = {
        "id": match_id,
        "team_id": team_id,
        "opponent_name": opponent_name,
        "upload_status": "uploaded",
        "video_chunks_uploaded": 1,
        "video_chunks_total": 1
    }

    print(f"Creating match record: {match_id}")
    result = supabase.table("matches").insert(match_data).execute()

    if not result.data:
        print("Error creating match record")
        return None

    print(f"Match created successfully: {match_id}")

    # Run ML analysis directly on the video
    print("Starting ML analysis...")
    output_video_path, analysis_data = process_video_with_ml_analysis(video_path, match_id)

    if output_video_path and os.path.exists(output_video_path):
        print(f"✅ Analysis complete!")
        print(f"Output video: {output_video_path}")
        print(f"Analysis data keys: {list(analysis_data.keys())}")

        # Update match status
        supabase.table("matches").update({
            "upload_status": "analyzed"
        }).eq("id", match_id).execute()

        return match_id
    else:
        print(f"❌ Analysis failed: {analysis_data.get('error', 'Unknown error')}")
        return None


def batch_process_demo_videos(video_folder: str, team_id: str):
    """
    Process multiple demo videos from a folder

    Args:
        video_folder: Path to folder containing video files
        team_id: Your team ID from Supabase
    """
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv']
    video_files = []

    for ext in video_extensions:
        video_files.extend(Path(video_folder).glob(f"*{ext}"))

    if not video_files:
        print(f"No video files found in {video_folder}")
        return

    print(f"Found {len(video_files)} videos to process")

    processed = []
    for i, video_file in enumerate(video_files, 1):
        print(f"\n{'='*60}")
        print(f"Processing video {i}/{len(video_files)}: {video_file.name}")
        print(f"{'='*60}")

        # Use filename as opponent name
        opponent_name = video_file.stem.replace('_', ' ').replace('-', ' ')

        match_id = process_demo_video(str(video_file), team_id, opponent_name)

        if match_id:
            processed.append({
                "file": video_file.name,
                "match_id": match_id
            })
            print(f"✅ Success: {video_file.name} -> Match ID: {match_id}")
        else:
            print(f"❌ Failed: {video_file.name}")

    print(f"\n{'='*60}")
    print(f"Batch processing complete!")
    print(f"Successfully processed: {len(processed)}/{len(video_files)}")
    print(f"{'='*60}")

    if processed:
        print("\nProcessed matches:")
        for item in processed:
            print(f"  - {item['file']}: {item['match_id']}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Process demo videos for hackathon")
    parser.add_argument("--video", type=str, help="Path to single video file")
    parser.add_argument("--folder", type=str, help="Path to folder with multiple videos")
    parser.add_argument("--team-id", type=str, required=True, help="Your team ID from Supabase")
    parser.add_argument("--opponent", type=str, default="Demo Opponent", help="Opponent team name")

    args = parser.parse_args()

    if args.video:
        match_id = process_demo_video(args.video, args.team_id, args.opponent)
        if match_id:
            print(f"\n✅ Video processed! Match ID: {match_id}")
            print(f"View at: http://localhost:3000/matches/{match_id}")
    elif args.folder:
        batch_process_demo_videos(args.folder, args.team_id)
    else:
        print("Error: Please provide either --video or --folder")
        parser.print_help()
