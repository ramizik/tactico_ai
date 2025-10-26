"""
New Analysis Processor for TacticoAI
Integrates the new_analysis ML algorithm with Supabase backend
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
from datetime import datetime
import json

# Add ml_analysis to Python path
ML_ANALYSIS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml_analysis'))
sys.path.insert(0, ML_ANALYSIS_PATH)

# Import ml_analysis modules
from utils import read_video, save_video
from trackers import Tracker
from team_assigner import TeamAssigner
from player_ball_assigner import PlayerBallAssigner
from camera_movement_estimator import CameraMovementEstimator
from view_transformer import ViewTransformer
from speed_and_distance_estimator import SpeedAndDistance_Estimator
import cv2
import numpy as np

# Supabase integration
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class MLAnalysisProcessor:
    """
    Wrapper for ml_analysis algorithm with Supabase integration

    Note: YOLO automatically detects and uses GPU if available, no manual configuration needed.
    """

    def __init__(self):
        """
        Initialize the processor

        YOLO will automatically use GPU (CUDA/MPS) if available, otherwise falls back to CPU.
        """
        self.model_path = os.path.join(ML_ANALYSIS_PATH, 'models', 'best.pt')

        # Verify model exists
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"YOLO model not found at {self.model_path}")

        # Initialize Supabase client
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )

        logger.info(f"MLAnalysisProcessor initialized (YOLO will auto-detect GPU)")
        logger.info(f"Model path: {self.model_path}")

    def process_video(self, video_path: str, match_id: str) -> Tuple[str, Dict]:
        """
        Process video using ml_analysis algorithm

        Args:
            video_path: Path to input video
            match_id: Match ID from Supabase

        Returns:
            Tuple of (output_video_path, analysis_data)
        """
        try:
            logger.info(f"Starting new analysis for match {match_id}")
            logger.info(f"Input video: {video_path}")

            # Validate video file exists
            if not os.path.exists(video_path):
                error_msg = f"Video file not found: {video_path}"
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)

            # Step 1: Read video
            logger.info("📹 Reading video file...")
            video_frames = read_video(video_path)

            # Check if video was read successfully
            if video_frames is None or len(video_frames) == 0:
                error_msg = f"Failed to read video or video is empty: {video_path}"
                logger.error(error_msg)
                raise ValueError(error_msg)

            logger.info(f"✅ Loaded {len(video_frames)} frames")

            # Step 2: Initialize tracker
            logger.info("🤖 Initializing YOLO tracker...")
            tracker = Tracker(self.model_path)
            logger.info("✅ Tracker ready")

            # Step 3: Object detection & tracking
            logger.info("🎯 Detecting and tracking objects...")
            tracks = tracker.get_object_tracks(video_frames, read_from_stub=False, stub_path=None)
            logger.info("✅ Object tracking complete")

            # Step 4: Add positions
            logger.info("📍 Calculating object positions...")
            tracker.add_position_to_tracks(tracks)
            logger.info("✅ Positions calculated")

            # Step 5: Camera movement estimation
            logger.info("📷 Estimating camera movement...")
            camera_movement_estimator = CameraMovementEstimator(video_frames[0])
            camera_movement_per_frame = camera_movement_estimator.get_camera_movement(
                video_frames, read_from_stub=False, stub_path=None
            )
            camera_movement_estimator.add_adjust_positions_to_tracks(tracks, camera_movement_per_frame)
            logger.info("✅ Camera movement estimated")

            # Step 6: View transformation
            logger.info("🔄 Applying perspective transformation...")
            view_transformer = ViewTransformer(video_frames[0])
            view_transformer.add_transformed_position_to_tracks(tracks)
            logger.info("✅ Perspective transformation complete")

            # Step 7: Ball position interpolation
            logger.info("⚽ Interpolating ball positions...")
            tracks["ball"] = tracker.interpolate_ball_positions(tracks["ball"])
            logger.info("✅ Ball interpolation complete")

            # Step 8: Speed and distance calculation
            logger.info("📊 Calculating speed and distance...")
            speed_and_distance_estimator = SpeedAndDistance_Estimator()
            speed_and_distance_estimator.add_speed_and_distance_to_tracks(tracks)
            logger.info("✅ Speed and distance calculated")

            # Step 9: Team assignment
            logger.info("👥 Assigning player teams...")
            team_assigner = TeamAssigner()
            team_assigner.assign_team_color(video_frames[0], tracks['players'][0])

            for frame_num, player_track in enumerate(tracks['players']):
                for player_id, track in player_track.items():
                    team = team_assigner.get_player_team(
                        video_frames[frame_num],
                        track['bbox'],
                        player_id
                    )
                    tracks['players'][frame_num][player_id]['team'] = team
                    tracks['players'][frame_num][player_id]['team_color'] = team_assigner.team_colors[team]

            logger.info("✅ Team assignment complete")

            # Step 10: Ball assignment
            logger.info("🎾 Assigning ball possession...")
            player_assigner = PlayerBallAssigner()
            team_ball_control = []

            for frame_num, player_track in enumerate(tracks['players']):
                ball_bbox = tracks['ball'][frame_num][1]['bbox']
                assigned_player = player_assigner.assign_ball_to_player(player_track, ball_bbox)

                if assigned_player != -1:
                    tracks['players'][frame_num][assigned_player]['has_ball'] = True
                    team_ball_control.append(tracks['players'][frame_num][assigned_player]['team'])
                else:
                    team_ball_control.append(team_ball_control[-1] if team_ball_control else 1)

            team_ball_control = np.array(team_ball_control)
            logger.info("✅ Ball assignment complete")

            # Step 11: Render output video
            logger.info("🎨 Rendering output video...")
            output_video_frames = tracker.draw_annotations(video_frames, tracks, team_ball_control)
            output_video_frames = camera_movement_estimator.draw_camera_movement(
                output_video_frames, camera_movement_per_frame
            )
            speed_and_distance_estimator.draw_speed_and_distance(output_video_frames, tracks)
            logger.info("✅ Video rendering complete")

            # Step 12: Save output video
            output_dir = os.path.join('video_outputs')
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f'processed_{match_id}.avi')

            logger.info("💾 Saving output video...")
            save_video(output_video_frames, output_path)
            logger.info(f"✅ Video saved: {output_path}")

            # Step 13: Save tracking data to Supabase
            logger.info("💾 Saving tracking data to Supabase...")
            self._save_tracking_data(match_id, tracks, team_ball_control)
            logger.info("✅ Tracking data saved")

            # Step 14: Create analysis summary
            logger.info("📊 Creating analysis summary...")
            analysis_data = self._create_analysis_summary(tracks, team_ball_control)
            self._save_analysis_summary(match_id, analysis_data)
            logger.info("✅ Analysis summary saved")

            logger.info("🎉 Analysis complete!")
            return output_path, analysis_data

        except Exception as e:
            logger.error(f"Error processing video: {e}")
            raise

    def _save_tracking_data(self, match_id: str, tracks: Dict, team_ball_control: np.ndarray):
        """
        Save tracking data to Supabase tracked_positions table

        Args:
            match_id: Match ID
            tracks: Tracking data from algorithm
            team_ball_control: Ball control array
        """
        try:
            batch_size = 100
            positions_batch = []

            # Process each frame
            for frame_num in range(len(tracks['players'])):
                timestamp = frame_num / 24.0  # Assuming 24 fps

                # Save player positions
                for player_id, player_data in tracks['players'][frame_num].items():
                    if 'position' not in player_data:
                        continue

                    position = player_data['position']
                    transformed_position = player_data.get('position_transformed', position)

                    position_record = {
                        'match_id': match_id,
                        'frame_number': frame_num,
                        'timestamp': timestamp,
                        'object_type': 'player',
                        'tracker_id': int(player_id),
                        'team_id': int(player_data.get('team', 0)),
                        'x': float(position[0]),
                        'y': float(position[1]),
                        'x_transformed': float(transformed_position[0]) if len(transformed_position) > 0 else None,
                        'y_transformed': float(transformed_position[1]) if len(transformed_position) > 1 else None,
                        'speed': float(player_data.get('speed', 0.0)),
                        'distance': float(player_data.get('distance', 0.0)),
                        'has_ball': player_data.get('has_ball', False)
                    }
                    positions_batch.append(position_record)

                # Save ball position
                if 1 in tracks['ball'][frame_num]:
                    ball_data = tracks['ball'][frame_num][1]
                    if 'position' in ball_data:
                        position = ball_data['position']
                        transformed_position = ball_data.get('position_transformed', position)

                        ball_record = {
                            'match_id': match_id,
                            'frame_number': frame_num,
                            'timestamp': timestamp,
                            'object_type': 'ball',
                            'tracker_id': -1,
                            'team_id': None,
                            'x': float(position[0]),
                            'y': float(position[1]),
                            'x_transformed': float(transformed_position[0]) if len(transformed_position) > 0 else None,
                            'y_transformed': float(transformed_position[1]) if len(transformed_position) > 1 else None,
                            'speed': None,
                            'distance': None,
                            'has_ball': False
                        }
                        positions_batch.append(ball_record)

                # Insert batch when it reaches size limit
                if len(positions_batch) >= batch_size:
                    self.supabase.table("tracked_positions").insert(positions_batch).execute()
                    logger.info(f"Saved {len(positions_batch)} position records (frame {frame_num})")
                    positions_batch = []

            # Insert remaining records
            if positions_batch:
                self.supabase.table("tracked_positions").insert(positions_batch).execute()
                logger.info(f"Saved final {len(positions_batch)} position records")

        except Exception as e:
            logger.error(f"Error saving tracking data: {e}")
            raise

    def _create_analysis_summary(self, tracks: Dict, team_ball_control: np.ndarray) -> Dict:
        """
        Create analysis summary from tracking data

        Args:
            tracks: Tracking data
            team_ball_control: Ball control array

        Returns:
            Analysis summary dictionary
        """
        try:
            # Calculate team ball control percentages
            total_frames = len(team_ball_control)
            team_1_control = np.sum(team_ball_control == 1)
            team_2_control = np.sum(team_ball_control == 2)

            team_1_percent = (team_1_control / total_frames * 100) if total_frames > 0 else 0
            team_2_percent = (team_2_control / total_frames * 100) if total_frames > 0 else 0

            # Calculate average speeds and distances
            total_distance = {}
            total_speed = {}
            player_counts = {}

            for frame_players in tracks['players']:
                for player_id, player_data in frame_players.items():
                    if player_id not in total_distance:
                        total_distance[player_id] = 0
                        total_speed[player_id] = 0
                        player_counts[player_id] = 0

                    total_distance[player_id] += player_data.get('distance', 0)
                    total_speed[player_id] += player_data.get('speed', 0)
                    player_counts[player_id] += 1

            # Calculate averages
            avg_speeds = {pid: total_speed[pid] / player_counts[pid]
                         for pid in player_counts if player_counts[pid] > 0}

            analysis_data = {
                "analysis_type": "full_analysis",
                "video_duration_analyzed": len(tracks['players']) / 24.0,  # Assuming 24 fps
                "summary": f"Match analysis complete. Team 1 possession: {team_1_percent:.1f}%, Team 2: {team_2_percent:.1f}%",
                "tactical_insights": "Comprehensive match analysis with player tracking, team assignments, and ball possession analysis.",
                "metrics": {
                    "team_1_possession": round(team_1_percent, 2),
                    "team_2_possession": round(team_2_percent, 2),
                    "total_players_tracked": len(player_counts),
                    "total_frames": total_frames,
                    "avg_speed": round(np.mean(list(avg_speeds.values())), 2) if avg_speeds else 0
                },
                "formation": {
                    "team_1": "Unknown",
                    "team_2": "Unknown"
                },
                "events": []
            }

            return analysis_data

        except Exception as e:
            logger.error(f"Error creating analysis summary: {e}")
            return {
                "analysis_type": "full_analysis",
                "summary": "Analysis completed with errors",
                "error": str(e)
            }

    def _save_analysis_summary(self, match_id: str, analysis_data: Dict):
        """
        Save analysis summary to Supabase analyses table

        Args:
            match_id: Match ID
            analysis_data: Analysis summary
        """
        try:
            # Check if analysis already exists
            existing = self.supabase.table("analyses").select("id").eq("match_id", match_id).execute()

            summary_record = {
                "match_id": match_id,
                "summary": analysis_data.get("summary", ""),
                "tactical_insights": analysis_data.get("tactical_insights", ""),
                "metrics": analysis_data.get("metrics", {}),
                "events": analysis_data.get("events", []),
                "formation": analysis_data.get("formation", {}),
                "updated_at": datetime.utcnow().isoformat()
            }

            if existing.data:
                # Update existing analysis
                self.supabase.table("analyses").update(summary_record).eq("match_id", match_id).execute()
                logger.info(f"Updated analysis for match {match_id}")
            else:
                # Create new analysis
                summary_record["created_at"] = datetime.utcnow().isoformat()
                self.supabase.table("analyses").insert(summary_record).execute()
                logger.info(f"Created analysis for match {match_id}")

        except Exception as e:
            logger.error(f"Error saving analysis summary: {e}")
            raise


def process_video_with_ml_analysis(
    video_path: str,
    match_id: str
) -> Tuple[str, Dict]:
    """
    Convenience function to process video with ml analysis algorithm

    Args:
        video_path: Path to input video
        match_id: Match ID from Supabase

    Returns:
        Tuple of (output_video_path, analysis_data)

    Note: YOLO automatically detects and uses GPU if available
    """
    processor = MLAnalysisProcessor()
    return processor.process_video(video_path, match_id)


if __name__ == "__main__":
    # Test the processor
    import argparse

    parser = argparse.ArgumentParser(description='Test ML Analysis Processor')
    parser.add_argument('--video_path', type=str, required=True, help='Path to video file')
    parser.add_argument('--match_id', type=str, required=True, help='Match ID')

    args = parser.parse_args()

    output_path, analysis_data = process_video_with_ml_analysis(
        args.video_path,
        args.match_id
    )

    print(f"\n✅ Output video: {output_path}")
    print(f"✅ Analysis: {json.dumps(analysis_data, indent=2)}")
