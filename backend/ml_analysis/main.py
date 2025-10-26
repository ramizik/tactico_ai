from utils import read_video, save_video
from trackers import Tracker
import cv2
import numpy as np
from team_assigner import TeamAssigner
from player_ball_assigner import PlayerBallAssigner
from camera_movement_estimator import CameraMovementEstimator
from view_transformer import ViewTransformer
from speed_and_distance_estimator import SpeedAndDistance_Estimator
import time
import sys


def print_progress(step, total_steps, message, emoji="🔄"):
    """Print progress with emoji and percentage"""
    percentage = (step / total_steps) * 100
    bar_length = 30
    filled_length = int(bar_length * step // total_steps)
    bar = '█' * filled_length + '-' * (bar_length - filled_length)
    print(f'\r{emoji} {message} [{bar}] {percentage:.1f}% ({step}/{total_steps})', end='', flush=True)
    if step == total_steps:
        print()  # New line when complete


def main():
    print("🚀 Starting Football Analysis Pipeline...")
    print("=" * 60)

    total_steps = 10
    current_step = 0

    # Step 1: Read Video
    current_step += 1
    print_progress(current_step, total_steps, "Reading video file", "📹")
    video_frames = read_video('input_videos/sample_3.mp4')
    print(f" ✅ Loaded {len(video_frames)} frames")

    # Step 2: Initialize Tracker
    current_step += 1
    print_progress(current_step, total_steps, "Initializing YOLO tracker", "🤖")
    tracker = Tracker('models/best.pt')
    print(" ✅ Tracker ready")

    # Step 3: Object Detection & Tracking
    current_step += 1
    print_progress(current_step, total_steps, "Detecting and tracking objects", "🎯")
    tracks = tracker.get_object_tracks(video_frames,
                                       read_from_stub=False,
                                       stub_path='stubs/track_stubs.pkl')
    print(" ✅ Object tracking complete")

    # Step 4: Add Positions
    current_step += 1
    print_progress(current_step, total_steps, "Calculating object positions", "📍")
    tracker.add_position_to_tracks(tracks)
    print(" ✅ Positions calculated")

    # Step 5: Camera Movement Estimation
    current_step += 1
    print_progress(current_step, total_steps, "Estimating camera movement", "📷")
    camera_movement_estimator = CameraMovementEstimator(video_frames[0])
    camera_movement_per_frame = camera_movement_estimator.get_camera_movement(video_frames,
                                                                                read_from_stub=False,
                                                                                stub_path='stubs/camera_movement_stub.pkl')
    camera_movement_estimator.add_adjust_positions_to_tracks(tracks,camera_movement_per_frame)
    print(" ✅ Camera movement estimated")

    # Step 6: View Transformation
    current_step += 1
    print_progress(current_step, total_steps, "Applying perspective transformation", "🔄")
    view_transformer = ViewTransformer(video_frames[0])
    view_transformer.add_transformed_position_to_tracks(tracks)
    print(" ✅ Perspective transformation complete")

    # Step 7: Ball Position Interpolation
    current_step += 1
    print_progress(current_step, total_steps, "Interpolating ball positions", "⚽")
    tracks["ball"] = tracker.interpolate_ball_positions(tracks["ball"])
    print(" ✅ Ball interpolation complete")

    # Step 8: Speed and Distance Calculation
    current_step += 1
    print_progress(current_step, total_steps, "Calculating speed and distance", "📊")
    speed_and_distance_estimator = SpeedAndDistance_Estimator()
    speed_and_distance_estimator.add_speed_and_distance_to_tracks(tracks)
    print(" ✅ Speed and distance calculated")

    # Step 9: Team Assignment
    current_step += 1
    print_progress(current_step, total_steps, "Assigning player teams", "👥")
    team_assigner = TeamAssigner()
    team_assigner.assign_team_color(video_frames[0],
                                    tracks['players'][0])

    total_frames = len(tracks['players'])
    for frame_num, player_track in enumerate(tracks['players']):
        # Show progress for team assignment
        progress = ((frame_num + 1) / total_frames) * 100
        print(f"\r    👥 Assigning teams: Frame {frame_num + 1}/{total_frames} ({progress:.1f}%)", end='', flush=True)

        for player_id, track in player_track.items():
            team = team_assigner.get_player_team(video_frames[frame_num],
                                                 track['bbox'],
                                                 player_id)
            tracks['players'][frame_num][player_id]['team'] = team
            tracks['players'][frame_num][player_id]['team_color'] = team_assigner.team_colors[team]

    print()  # New line after progress
    print(" ✅ Team assignment complete")

    # Step 10: Ball Assignment
    current_step += 1
    print_progress(current_step, total_steps, "Assigning ball possession", "🎾")
    player_assigner = PlayerBallAssigner()
    team_ball_control= []
    total_frames = len(tracks['players'])

    for frame_num, player_track in enumerate(tracks['players']):
        # Show progress for ball assignment
        progress = ((frame_num + 1) / total_frames) * 100
        print(f"\r    🎾 Assigning ball: Frame {frame_num + 1}/{total_frames} ({progress:.1f}%)", end='', flush=True)

        ball_bbox = tracks['ball'][frame_num][1]['bbox']
        assigned_player = player_assigner.assign_ball_to_player(player_track, ball_bbox)

        if assigned_player != -1:
            tracks['players'][frame_num][assigned_player]['has_ball'] = True
            team_ball_control.append(tracks['players'][frame_num][assigned_player]['team'])
        else:
            team_ball_control.append(team_ball_control[-1])

    print()  # New line after progress
    team_ball_control= np.array(team_ball_control)
    print(" ✅ Ball assignment complete")

    # Rendering Phase
    print("\n🎨 Starting Video Rendering...")
    print("=" * 60)

    rendering_steps = 4
    current_rendering_step = 0

    # Render 1: Object Tracks
    current_rendering_step += 1
    print_progress(current_rendering_step, rendering_steps, "Drawing object tracks", "🎯")
    output_video_frames = tracker.draw_annotations(video_frames, tracks,team_ball_control)
    print(" ✅ Object tracks drawn")

    # Render 2: Camera Movement
    current_rendering_step += 1
    print_progress(current_rendering_step, rendering_steps, "Drawing camera movement", "📷")
    output_video_frames = camera_movement_estimator.draw_camera_movement(output_video_frames,camera_movement_per_frame)
    print(" ✅ Camera movement drawn")

    # Render 3: Speed and Distance
    current_rendering_step += 1
    print_progress(current_rendering_step, rendering_steps, "Drawing speed and distance", "📊")
    speed_and_distance_estimator.draw_speed_and_distance(output_video_frames,tracks)
    print(" ✅ Speed and distance drawn")

    # Render 4: Save Video
    current_rendering_step += 1
    print_progress(current_rendering_step, rendering_steps, "Saving output video", "💾")
    save_video(output_video_frames, 'output_videos/output_video.avi')
    print(" ✅ Video saved successfully")

    print("\n🎉 Football Analysis Complete!")
    print("=" * 60)
    print(f"📁 Output saved to: output_videos/output_video.avi")
    print(f"📊 Processed {len(video_frames)} frames")
    print("=" * 60)

if __name__ == '__main__':
    main()