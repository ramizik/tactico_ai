import cv2
import os

def read_video(video_path):
    """
    Read video frames from a file

    Args:
        video_path: Path to the video file

    Returns:
        List of frames or empty list if video cannot be read
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        return []

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Error: Cannot open video file: {video_path}")
        return []

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()

    if len(frames) == 0:
        print(f"Warning: No frames read from video: {video_path}")

    return frames

def save_video(ouput_video_frames,output_video_path):
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_video_path, fourcc, 24, (ouput_video_frames[0].shape[1], ouput_video_frames[0].shape[0]))
    for frame in ouput_video_frames:
        out.write(frame)
    out.release()
