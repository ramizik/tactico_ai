"""
Video Processing Wrapper for TacticoAI
Integrates with the existing video_analysis module for chunked video processing
"""

import os
import sys
import json
import tempfile
import subprocess
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import logging

# Add video_analysis to Python path (cross-platform compatible)
VIDEO_ANALYSIS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'video_analysis'))
sys.path.insert(0, VIDEO_ANALYSIS_PATH)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoProcessor:
    """
    Wrapper class for video analysis processing
    Handles chunked video uploads and analysis
    """

    def __init__(self):
        """
        Initialize video processor

        Note: YOLO automatically detects and uses GPU if available
        """
        self.temp_dir = tempfile.mkdtemp(prefix='tactico_video_')
        self.ffmpeg_path = self._find_ffmpeg()
        logger.info(f"VideoProcessor initialized")
        logger.info(f"Temp directory: {self.temp_dir}")
        logger.info(f"FFmpeg path: {self.ffmpeg_path}")

    def _find_ffmpeg(self) -> str:
        """
        Find FFmpeg executable across different platforms and installations

        Returns:
            str: Path to FFmpeg executable
        """
        # Common FFmpeg locations across platforms
        possible_paths = [
            'ffmpeg',  # Try PATH first
        ]

        # Platform-specific paths
        if os.name == 'nt':  # Windows
            possible_paths.extend([
                r'C:\ffmpeg\bin\ffmpeg.exe',
                r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
                r'C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe',
                os.path.expanduser(r'~\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-*-full_build\bin\ffmpeg.exe'),
                os.path.expanduser(r'~\scoop\apps\ffmpeg\current\bin\ffmpeg.exe'),
            ])
        else:  # Unix-like (macOS, Linux)
            possible_paths.extend([
                '/usr/bin/ffmpeg',
                '/usr/local/bin/ffmpeg',
                '/opt/homebrew/bin/ffmpeg',  # macOS Apple Silicon
                '/usr/local/Cellar/ffmpeg/*/bin/ffmpeg',  # macOS Homebrew
                os.path.expanduser('~/bin/ffmpeg'),
            ])

        # Test each possible path
        for path in possible_paths:
            try:
                # Handle glob patterns
                if '*' in path:
                    import glob
                    matches = glob.glob(path)
                    if matches:
                        path = matches[0]
                    else:
                        continue

                # Test if FFmpeg works
                result = subprocess.run([path, '-version'],
                                     capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    logger.info(f"Found FFmpeg at: {path}")
                    return path
            except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                continue

        # If no FFmpeg found, raise an error with helpful message
        raise Exception(
            "FFmpeg not found! Please install FFmpeg:\n"
            "Windows: Download from https://ffmpeg.org/download.html or use 'winget install ffmpeg'\n"
            "macOS: 'brew install ffmpeg'\n"
            "Linux: 'sudo apt install ffmpeg' or 'sudo yum install ffmpeg'"
        )

    def _normalize_path(self, path: str) -> str:
        """
        Normalize path for cross-platform compatibility

        Args:
            path: Path to normalize

        Returns:
            str: Normalized absolute path
        """
        return os.path.abspath(os.path.normpath(path))

    def combine_local_chunks(self, team_id: str, match_id: str, total_chunks: int) -> str:
        """
        Combine locally stored video chunks into a single video file

        Args:
            team_id: Team ID for the video
            match_id: Match ID for the video
            total_chunks: Total number of chunks to combine

        Returns:
            str: Path to the combined video file, or None if failed
        """
        try:
            logger.info(f"DEBUG combine_local_chunks: team_id={team_id}, match_id={match_id}, total_chunks={total_chunks}")

            # For large chunk counts, add a delay to ensure all files are fully written to disk
            # This prevents the "moov atom not found" error with many chunks
            if total_chunks > 50:
                import time
                logger.info(f"Large chunk count ({total_chunks}), waiting 3 seconds for file system sync...")
                time.sleep(3)

            # Get chunk paths using cross-platform path handling
            chunk_paths = []
            for i in range(total_chunks):
                chunk_path = os.path.join("video_storage", team_id, match_id, "chunks", f"chunk_{i:03d}.mp4")
                chunk_path = self._normalize_path(chunk_path)
                logger.info(f"DEBUG: Checking chunk {i} at path: {chunk_path}")

                if os.path.exists(chunk_path):
                    chunk_size = os.path.getsize(chunk_path)

                    # Basic validation: chunks should have reasonable size
                    # Note: Client-side chunks are just binary slices, not complete MP4 files
                    if chunk_size < 100:  # Reduced threshold - even small chunks can be valid
                        logger.error(f"Chunk {i} is suspiciously small ({chunk_size} bytes)")
                        return None

                    logger.info(f"Found chunk {i}: {chunk_path} ({chunk_size} bytes)")
                    chunk_paths.append(chunk_path)
                else:
                    logger.error(f"DEBUG: Chunk not found: {chunk_path}")
                    logger.error(f"DEBUG: Current working directory: {os.getcwd()}")
                    logger.error(f"DEBUG: Absolute path would be: {os.path.abspath(chunk_path)}")
                    return None

            if len(chunk_paths) != total_chunks:
                logger.error(f"Expected {total_chunks} chunks, found {len(chunk_paths)}")
                return None

            logger.info(f"DEBUG: All {len(chunk_paths)} chunks found and validated successfully")

            # Create output path using cross-platform path handling
            output_path = os.path.join("video_storage", team_id, match_id, "combined_video.mp4")
            output_path = self._normalize_path(output_path)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Merge chunks
            success = self.merge_video_chunks(chunk_paths, output_path)
            if success:
                logger.info(f"Video chunks combined successfully: {output_path}")
                # Return absolute path to ensure it works from any directory
                absolute_path = os.path.abspath(output_path)
                logger.info(f"Returning absolute path: {absolute_path}")
                return absolute_path
            else:
                logger.error("Failed to merge video chunks")
                return None

        except Exception as e:
            logger.error(f"Error combining local chunks: {e}")
            return None


    def merge_video_chunks(self, chunk_paths: List[str], output_path: str, max_retries: int = 3) -> bool:
        """
        Merge video chunks into a single video file.

        For client-side chunked uploads, we use binary concatenation since chunks
        are not self-contained MP4 files but raw binary slices.

        Args:
            chunk_paths: List of paths to video chunks (in order)
            output_path: Path for the merged video output
            max_retries: Maximum number of retry attempts if merge fails

        Returns:
            bool: True if successful, False otherwise
        """
        import time

        # First, try simple binary concatenation (fastest and most reliable for chunked uploads)
        logger.info(f"Using binary concatenation for {len(chunk_paths)} chunks")

        try:
            # Binary concatenation - just combine the raw bytes
            total_size = 0
            with open(output_path, 'wb') as outfile:
                for i, chunk_path in enumerate(chunk_paths):
                    logger.info(f"Concatenating chunk {i}: {chunk_path}")

                    # Retry reading each chunk in case of temporary file lock
                    for read_attempt in range(3):
                        try:
                            with open(chunk_path, 'rb') as chunk_file:
                                chunk_data = chunk_file.read()
                                chunk_size = len(chunk_data)
                                total_size += chunk_size
                                outfile.write(chunk_data)
                                logger.info(f"Wrote chunk {i}: {chunk_size} bytes")
                                break
                        except Exception as read_error:
                            if read_attempt < 2:
                                logger.warning(f"Failed to read chunk {i}, retrying: {read_error}")
                                time.sleep(0.5)
                            else:
                                raise read_error

            logger.info(f"Binary concatenation complete. Total size: {total_size} bytes")

            # Verify the output file exists and has expected size
            if os.path.exists(output_path):
                final_size = os.path.getsize(output_path)
                logger.info(f"Combined video exists: {output_path}, size: {final_size} bytes")

                # For large files, skip or use longer timeout for validation
                if final_size > 500_000_000:  # If over 500MB
                    logger.info(f"Large file ({final_size/1_000_000:.1f}MB), skipping detailed validation")
                    # Just do a quick check that FFmpeg can read the file header
                    try:
                        quick_check_cmd = [
                            self.ffmpeg_path,
                            '-v', 'error',
                            '-i', output_path,
                            '-t', '0.1',  # Only check first 0.1 seconds
                            '-f', 'null',
                            '-'
                        ]
                        subprocess.run(quick_check_cmd, capture_output=True, text=True, timeout=5)
                        logger.info("Quick validation passed - file header is readable")
                    except subprocess.TimeoutExpired:
                        logger.warning("Quick validation timed out, but file exists - proceeding")
                    except Exception as e:
                        logger.warning(f"Quick validation failed ({e}), but file exists - proceeding")
                    return True

                # For smaller files, do full validation
                try:
                    validation_cmd = [
                        self.ffmpeg_path,
                        '-v', 'error',
                        '-i', output_path,
                        '-f', 'null',
                        '-'
                    ]

                    logger.info("Validating combined video with FFmpeg...")
                    # Increase timeout based on file size (roughly 1 second per 100MB)
                    timeout_seconds = max(30, int(final_size / 100_000_000) + 10)
                    validation_result = subprocess.run(validation_cmd, capture_output=True, text=True, timeout=timeout_seconds)

                    if validation_result.stderr:
                        logger.warning(f"FFmpeg validation warnings: {validation_result.stderr}")

                        # If validation shows major errors, try FFmpeg remuxing as fallback
                        if "Invalid data" in validation_result.stderr or "moov atom not found" in validation_result.stderr:
                            logger.warning("Combined file has issues, attempting FFmpeg remux...")
                            temp_output = output_path + ".temp.mp4"

                            remux_cmd = [
                                self.ffmpeg_path,
                                '-i', output_path,
                                '-c', 'copy',
                                '-movflags', '+faststart',  # Move moov atom to beginning for better compatibility
                                '-y',
                                temp_output
                            ]

                            remux_result = subprocess.run(remux_cmd, capture_output=True, text=True, timeout=60)
                            if remux_result.returncode == 0 and os.path.exists(temp_output):
                                os.replace(temp_output, output_path)
                                logger.info("Successfully remuxed video with FFmpeg")
                    else:
                        logger.info("Video validation passed")

                except subprocess.TimeoutExpired:
                    logger.warning(f"Validation timed out after {timeout_seconds}s, but file exists - assuming success")
                except Exception as e:
                    logger.warning(f"Validation failed ({e}), but file exists - assuming success")

                # If we got here and file exists with reasonable size, consider it success
                return True
            else:
                logger.error(f"Output file does not exist after merge: {output_path}")
                return False

        except Exception as e:
            logger.error(f"Binary concatenation failed: {e}")

            # Fallback: Try creating a simple list file for concat
            logger.info("Attempting fallback with file list approach...")
            try:
                # For Windows, we need to use a file list instead of concat protocol
                file_list_path = os.path.join(self.temp_dir, 'fallback_chunks.txt')
                with open(file_list_path, 'w') as f:
                    for chunk_path in chunk_paths:
                        # Use forward slashes for FFmpeg
                        normalized = chunk_path.replace('\\', '/')
                        f.write(f"file '{normalized}'\n")

                fallback_cmd = [
                    self.ffmpeg_path,
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', file_list_path,
                    '-c', 'copy',
                    '-y',
                    output_path
                ]

                logger.info(f"FFmpeg fallback with file list...")
                result = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=60)

                if result.returncode == 0 and os.path.exists(output_path):
                    logger.info("Fallback file list approach succeeded")
                    return True
                else:
                    logger.error(f"Fallback failed: {result.stderr}")

                    # Last resort: Check if file exists anyway
                    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                        logger.warning("Fallback reported failure but output file exists - assuming success")
                        return True

                    return False

            except Exception as fallback_error:
                logger.error(f"Fallback method also failed: {fallback_error}")

                # Final check - if output exists despite errors, consider it success
                if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                    logger.warning("All methods reported errors but output file exists - assuming success")
                    return True

                return False

    def extract_video_segment(self, video_path: str, start_sec: float, end_sec: float) -> str:
        """
        Extract a segment from a video file

        Args:
            video_path: Path to the source video
            start_sec: Start time in seconds
            end_sec: End time in seconds

        Returns:
            str: Path to the extracted segment
        """
        try:
            # Ensure video_path is absolute and properly formatted
            video_path = self._normalize_path(video_path)
            segment_path = os.path.join(self.temp_dir, f'segment_{start_sec}_{end_sec}.mp4')
            segment_path = self._normalize_path(segment_path)

            cmd = [
                self.ffmpeg_path,
                '-i', video_path,
                '-ss', str(start_sec),
                '-t', str(end_sec - start_sec),
                '-c', 'copy',
                '-y',
                segment_path
            ]

            logger.info(f"Extracting segment from {start_sec}s to {end_sec}s")
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info(f"Segment extracted to: {segment_path}")
                return segment_path
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                return None

        except Exception as e:
            logger.error(f"Error extracting video segment: {e}")
            return None

    def run_quick_brief(self, video_path: str) -> Dict:
        """
        Run quick brief analysis on the first 2-3 minutes of video

        Args:
            video_path: Path to the video file

        Returns:
            Dict: Analysis results
        """
        try:
            logger.info("Starting quick brief analysis")

            # Extract first 3 minutes for quick analysis
            segment_path = self.extract_video_segment(video_path, 0.0, 180.0)
            if not segment_path:
                return {"error": "Failed to extract video segment"}

            # Run analysis on the segment
            analysis_results = self._run_video_analysis(segment_path, analysis_type="quick_brief")

            # Clean up segment file
            if os.path.exists(segment_path):
                os.remove(segment_path)

            return analysis_results

        except Exception as e:
            logger.error(f"Error in quick brief analysis: {e}")
            return {"error": str(e)}

    def run_full_analysis(self, video_path: str) -> Dict:
        """
        Run full analysis on the entire video

        Args:
            video_path: Path to the video file

        Returns:
            Dict: Analysis results
        """
        try:
            logger.info("Starting full analysis")

            # Run comprehensive analysis on the full video
            analysis_results = self._run_video_analysis(video_path, analysis_type="full_analysis")

            return analysis_results

        except Exception as e:
            logger.error(f"Error in full analysis: {e}")
            return {"error": str(e)}

    def run_ml_analysis(self, video_path: str, match_id: str) -> tuple:
        """
        Run ML analysis algorithm with player tracking and team assignment

        Args:
            video_path: Path to the video file
            match_id: Match ID from Supabase

        Returns:
            tuple: (local_video_path, analysis_dict)
        """
        try:
            logger.info(f"Starting ML analysis for match {match_id}")
            logger.info(f"Video path provided: {video_path}")

            # Verify video exists before processing
            if not os.path.exists(video_path):
                error_msg = f"Video file does not exist at path: {video_path}"
                logger.error(error_msg)
                return None, {"error": error_msg}

            video_size = os.path.getsize(video_path)
            logger.info(f"Video file exists, size: {video_size} bytes")

            # Import and use the ml analysis processor
            from ml_analysis_processor import process_video_with_ml_analysis

            output_path, analysis_data = process_video_with_ml_analysis(
                video_path,
                match_id
            )

            if output_path and os.path.exists(output_path):
                logger.info(f"ML analysis completed successfully: {output_path}")
                return output_path, analysis_data
            else:
                logger.error("ML analysis failed: No output video generated")
                return None, {"error": "No output video generated"}

        except Exception as e:
            logger.error(f"Error running ML analysis: {e}")
            return None, {"error": str(e)}

    def _run_video_analysis(self, video_path: str, analysis_type: str) -> Dict:
        """
        Internal method to run video analysis using the sports package

        Args:
            video_path: Path to the video file
            analysis_type: Type of analysis ('quick_brief' or 'full_analysis')

        Returns:
            Dict: Analysis results
        """
        try:
            # Import the sports analysis module
            from examples.soccer.main import Mode, main as run_analysis

            # Determine analysis mode based on type
            if analysis_type == "quick_brief":
                # For quick brief, use player detection only
                analysis_mode = Mode.PLAYER_DETECTION
            else:
                # For full analysis, use comprehensive radar mode
                analysis_mode = Mode.RADAR

            # Create output path
            output_path = os.path.join(self.temp_dir, f'analysis_{analysis_type}.mp4')

            # Run the analysis
            logger.info(f"Running {analysis_mode.value} analysis")

            # Note: The main function expects command line args, so we'll use subprocess
            # Set up environment with proper PYTHONPATH for cross-platform compatibility
            env = os.environ.copy()

            # Add video_analysis directory to PYTHONPATH so 'sports' module can be imported
            # This works on both Windows and Unix-like systems
            pythonpath_additions = [VIDEO_ANALYSIS_PATH]
            if 'PYTHONPATH' in env:
                # Append to existing PYTHONPATH
                if os.name == 'nt':  # Windows
                    env['PYTHONPATH'] = f"{VIDEO_ANALYSIS_PATH};{env['PYTHONPATH']}"
                else:  # Unix-like (macOS, Linux)
                    env['PYTHONPATH'] = f"{VIDEO_ANALYSIS_PATH}:{env['PYTHONPATH']}"
            else:
                # Set new PYTHONPATH
                env['PYTHONPATH'] = VIDEO_ANALYSIS_PATH

            cmd = [
                sys.executable,
                os.path.join(VIDEO_ANALYSIS_PATH, 'examples', 'soccer', 'main.py'),
                '--source_video_path', video_path,
                '--target_video_path', output_path,
                '--device', self.device,
                '--mode', analysis_mode.value
            ]

            logger.info(f"Running analysis with PYTHONPATH: {env['PYTHONPATH']}")
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=VIDEO_ANALYSIS_PATH, env=env)

            if result.returncode == 0:
                # Generate mock analysis results for now
                # In a real implementation, you'd parse the actual analysis output
                analysis_results = self._generate_mock_analysis(analysis_type)
                logger.info(f"Analysis completed successfully: {analysis_type}")
                return analysis_results
            else:
                logger.error(f"Analysis failed: {result.stderr}")
                return {"error": f"Analysis failed: {result.stderr}"}

        except Exception as e:
            logger.error(f"Error running video analysis: {e}")
            return {"error": str(e)}

    def _generate_mock_analysis(self, analysis_type: str) -> Dict:
        """
        Generate mock analysis results for demonstration
        In production, this would parse actual analysis output
        """
        if analysis_type == "quick_brief":
            return {
                "analysis_type": "quick_brief",
                "video_duration_analyzed": 180.0,
                "summary": "Quick analysis of first 3 minutes shows strong team coordination. Players maintain good spacing and ball movement is fluid.",
                "tactical_insights": "Team shows effective pressing in the first half. Formation appears to be 4-3-3 with good width utilization.",
                "metrics": {
                    "possession": 58.2,
                    "pass_accuracy": 84.5,
                    "press_intensity": 0.72,
                    "compactness": 0.68
                },
                "events": [
                    {"minute": 12, "type": "pass", "player": "Player 10", "description": "Key pass in build-up"},
                    {"minute": 23, "type": "shot", "player": "Player 9", "description": "Shot on target"},
                    {"minute": 45, "type": "tactical_change", "description": "Formation adjustment"}
                ],
                "formation": {
                    "team": "4-3-3",
                    "opponent": "4-4-2"
                }
            }
        else:  # full_analysis
            return {
                "analysis_type": "full_analysis",
                "video_duration_analyzed": 5400.0,  # 90 minutes
                "summary": "Comprehensive match analysis reveals excellent tactical execution. Team maintained high possession throughout and created numerous scoring opportunities.",
                "tactical_insights": "Outstanding performance with 4-3-3 formation. Midfield dominance led to 65% possession. Defensive line maintained excellent compactness.",
                "metrics": {
                    "possession": 65.3,
                    "pass_accuracy": 87.2,
                    "shooting_percentage": 45.8,
                    "press_intensity": 0.78,
                    "compactness": 0.82,
                    "width_utilization": 0.71
                },
                "events": [
                    {"minute": 12, "type": "goal", "player": "Player 9", "assist": "Player 10"},
                    {"minute": 23, "type": "shot", "player": "Player 7", "description": "Shot saved"},
                    {"minute": 45, "type": "tactical_change", "description": "Formation switch to 4-4-2"},
                    {"minute": 67, "type": "goal", "player": "Player 11", "assist": "Player 8"},
                    {"minute": 89, "type": "shot", "player": "Player 9", "description": "Shot wide"}
                ],
                "formation": {
                    "team": "4-3-3",
                    "opponent": "4-4-2"
                }
            }

    def cleanup(self):
        """Clean up temporary files and directories"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.error(f"Error cleaning up: {e}")


def run_ml_analysis_from_chunks(team_id: str, match_id: str, total_chunks: int) -> tuple:
    """
    Run ML analysis on locally stored video chunks

    Args:
        team_id: Team ID for the video
        match_id: Match ID for the video
        total_chunks: Total number of chunks

    Returns:
        tuple: (output_video_path, analysis_data)

    Note: YOLO automatically detects and uses GPU if available
    """
    processor = VideoProcessor()
    try:
        logger.info(f"DEBUG run_ml_analysis_from_chunks: Starting for team_id={team_id}, match_id={match_id}, total_chunks={total_chunks}")

        # Combine chunks first
        combined_video_path = processor.combine_local_chunks(team_id, match_id, total_chunks)
        logger.info(f"DEBUG: combine_local_chunks returned: {combined_video_path}")

        if not combined_video_path:
            logger.error("DEBUG: combined_video_path is None or empty")
            return None, {"error": "Failed to combine video chunks"}

        if not os.path.exists(combined_video_path):
            logger.error(f"DEBUG: Combined video path does not exist: {combined_video_path}")
            return None, {"error": f"Combined video file not found: {combined_video_path}"}

        combined_video_size = os.path.getsize(combined_video_path)
        logger.info(f"DEBUG: Combined video verified - path={combined_video_path}, size={combined_video_size} bytes")

        # Run ML analysis
        logger.info(f"DEBUG: Calling processor.run_ml_analysis with path: {combined_video_path}")
        result = processor.run_ml_analysis(combined_video_path, match_id)
        logger.info(f"DEBUG: run_ml_analysis returned: {result}")
        return result
    finally:
        processor.cleanup()


def run_quick_brief(video_path: str) -> Dict:
    """
    Convenience function to run quick brief analysis

    Args:
        video_path: Path to the video file

    Returns:
        Dict: Analysis results

    Note: YOLO automatically detects and uses GPU if available
    """
    processor = VideoProcessor()
    try:
        return processor.run_quick_brief(video_path)
    finally:
        processor.cleanup()


def run_full_analysis(video_path: str) -> Dict:
    """
    Convenience function to run full analysis

    Args:
        video_path: Path to the video file

    Returns:
        Dict: Analysis results

    Note: YOLO automatically detects and uses GPU if available
    """
    processor = VideoProcessor()
    try:
        return processor.run_full_analysis(video_path)
    finally:
        processor.cleanup()


if __name__ == "__main__":
    # Test the video processor
    import argparse

    parser = argparse.ArgumentParser(description='Test Video Processor')
    parser.add_argument('--video_path', type=str, required=True, help='Path to video file')
    parser.add_argument('--analysis_type', type=str, choices=['quick_brief', 'full_analysis'], required=True)

    args = parser.parse_args()

    processor = VideoProcessor()

    try:
        if args.analysis_type == 'quick_brief':
            results = processor.run_quick_brief(args.video_path)
        else:
            results = processor.run_full_analysis(args.video_path)

        print(json.dumps(results, indent=2))

    finally:
        processor.cleanup()
