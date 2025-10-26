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

    # Get video info first
    file_size = os.path.getsize(video_path)
    print(f"Reading video: {video_path}")
    print(f"File size: {file_size / (1024*1024):.2f} MB")

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Error: Cannot open video file: {video_path}")
        print(f"File exists: {os.path.exists(video_path)}, Size: {file_size} bytes")
        return []

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"Video properties: {width}x{height}, {fps} FPS, {total_frames} frames")
    print(f"Estimated duration: {total_frames/fps:.1f} seconds")

    frames = []
    frame_count = 0
    error_count = 0
    max_consecutive_errors = 10  # Stop if we hit 10 errors in a row
    consecutive_errors = 0

    try:
        while True:
            try:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame is None:
                    print(f"Warning: Frame {frame_count} is None, skipping")
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        print(f"Too many consecutive errors ({consecutive_errors}), stopping")
                        break
                    continue

                frames.append(frame)
                frame_count += 1
                consecutive_errors = 0  # Reset on successful read

                # Progress indicator for large videos
                if frame_count % 1000 == 0:
                    progress = (frame_count / total_frames * 100) if total_frames > 0 else 0
                    print(f"Reading frames: {frame_count}/{total_frames} ({progress:.1f}%)")

            except Exception as frame_error:
                error_count += 1
                consecutive_errors += 1

                if consecutive_errors >= max_consecutive_errors:
                    print(f"Too many consecutive errors ({consecutive_errors}), stopping read")
                    break

                # For isolated errors, just skip the frame
                if error_count <= 100:  # Allow up to 100 bad frames total
                    print(f"Warning: Error reading frame {frame_count}, skipping: {frame_error}")
                    continue
                else:
                    print(f"Too many total errors ({error_count}), stopping")
                    break

    except Exception as e:
        print(f"Fatal error during video read at frame {frame_count}: {type(e).__name__}: {str(e)}")

    finally:
        cap.release()

    # Evaluate what we got
    if len(frames) == 0:
        print(f"Error: No frames successfully read from video")
        if error_count > 0:
            raise Exception(f"Failed to read video: encountered {error_count} errors, no valid frames")
        return []
    elif len(frames) < 100:
        print(f"Error: Only {len(frames)} frames read, not enough for analysis")
        raise Exception(f"Insufficient frames: only {len(frames)} frames read from video")
    elif error_count > 0:
        print(f"⚠️  Video read completed with {error_count} errors")
        print(f"✅ Successfully read {len(frames)} frames ({len(frames) / fps:.1f} seconds)")
        print(f"Analysis will proceed with available frames")
    else:
        print(f"✅ Successfully read all {len(frames)} frames")

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
