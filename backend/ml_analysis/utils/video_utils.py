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

def save_video(ouput_video_frames, output_video_path):
    """
    Save video frames to file with browser-compatible codec

    Uses a two-step process:
    1. Save with XVID codec (reliable in OpenCV)
    2. Convert to H.264 MP4 using FFmpeg for browser compatibility
    """
    import subprocess

    # Step 1: Save with XVID to temporary file
    temp_path = output_video_path.replace('.mp4', '_temp.avi')
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(temp_path, fourcc, 24, (ouput_video_frames[0].shape[1], ouput_video_frames[0].shape[0]))
    for frame in ouput_video_frames:
        out.write(frame)
    out.release()

    # Step 2: Convert to H.264 MP4 using FFmpeg
    try:
        # Use FFmpeg to convert to browser-compatible H.264
        subprocess.run([
            'ffmpeg', '-y',  # -y to overwrite
            '-i', temp_path,  # Input file
            '-c:v', 'libx264',  # H.264 codec
            '-preset', 'fast',  # Encoding speed
            '-crf', '23',  # Quality (lower = better, 23 is good)
            '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
            output_video_path  # Output file
        ], check=True, capture_output=True)

        # Remove temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

    except subprocess.CalledProcessError as e:
        print(f"Warning: FFmpeg conversion failed: {e}")
        print(f"FFmpeg stderr: {e.stderr.decode() if e.stderr else 'N/A'}")
        # If FFmpeg fails, rename temp file to output (fallback to XVID)
        if os.path.exists(temp_path):
            os.rename(temp_path, output_video_path)
    except FileNotFoundError:
        print("Warning: FFmpeg not found. Saving as XVID AVI instead of H.264 MP4")
        # If FFmpeg not installed, rename temp file to output
        if os.path.exists(temp_path):
            os.rename(temp_path, output_video_path)
