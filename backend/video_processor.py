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

    def __init__(self, device: str = 'cpu'):
        self.device = device
        self._validate_device_configuration()
        self.temp_dir = tempfile.mkdtemp(prefix='tactico_video_')
        self.ffmpeg_path = self._find_ffmpeg()
        logger.info(f"VideoProcessor initialized with device: {device}")
        logger.info(f"Temp directory: {self.temp_dir}")
        logger.info(f"FFmpeg path: {self.ffmpeg_path}")

    def _validate_device_configuration(self):
        """
        Validate that the requested device is available and properly configured.
        Provides helpful error messages if configuration is incorrect.
        """
        try:
            import torch

            if self.device == 'cuda':
                if not torch.cuda.is_available():
                    error_msg = (
                        "\n" + "="*80 + "\n"
                        "❌ CUDA GPU REQUESTED BUT NOT AVAILABLE\n"
                        "="*80 + "\n"
                        "You have ANALYSIS_DEVICE=cuda in your .env file, but CUDA is not available.\n"
                        "\n"
                        "Common causes:\n"
                        "1. PyTorch was installed without CUDA support (CPU-only version)\n"
                        "2. NVIDIA drivers are not installed or outdated\n"
                        "3. No NVIDIA GPU is present in the system\n"
                        "\n"
                        "To fix this issue:\n"
                        "\n"
                        "Option 1: Install CUDA-enabled PyTorch (RECOMMENDED if you have NVIDIA GPU)\n"
                        "  pip uninstall torch torchvision torchaudio -y\n"
                        "  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124\n"
                        "\n"
                        "Option 2: Use CPU instead (slower, but works without GPU)\n"
                        "  Change ANALYSIS_DEVICE=cpu in your .env file\n"
                        "\n"
                        "To verify CUDA availability:\n"
                        "  python -c \"import torch; print(f'CUDA: {torch.cuda.is_available()}')\"\n"
                        "\n"
                        f"Current PyTorch version: {torch.__version__}\n"
                        "="*80 + "\n"
                    )
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)
                else:
                    logger.info(f"✓ CUDA is available: {torch.cuda.get_device_name(0)}")
                    logger.info(f"✓ CUDA version: {torch.version.cuda}")

            elif self.device == 'mps':
                if not (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
                    error_msg = (
                        "\n" + "="*80 + "\n"
                        "❌ MPS (Apple Silicon GPU) REQUESTED BUT NOT AVAILABLE\n"
                        "="*80 + "\n"
                        "You have ANALYSIS_DEVICE=mps in your .env file, but MPS is not available.\n"
                        "\n"
                        "This can happen if:\n"
                        "1. You're not on a Mac with Apple Silicon (M1/M2/M3)\n"
                        "2. Your macOS version is too old (need macOS 12.3+)\n"
                        "3. PyTorch version doesn't support MPS\n"
                        "\n"
                        "To fix: Change ANALYSIS_DEVICE=cpu in your .env file\n"
                        "="*80 + "\n"
                    )
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)
                else:
                    logger.info(f"✓ MPS (Apple Silicon GPU) is available")

            elif self.device == 'cpu':
                logger.info("✓ Using CPU for analysis (will be slower than GPU)")
                if torch.cuda.is_available():
                    logger.warning(
                        "⚠️  Note: CUDA GPU is available but not being used. "
                        "Set ANALYSIS_DEVICE=cuda in .env for 10-50x speedup!"
                    )
            else:
                logger.warning(f"Unknown device '{self.device}', falling back to CPU")
                self.device = 'cpu'

        except ImportError:
            error_msg = (
                "\n" + "="*80 + "\n"
                "❌ PYTORCH NOT INSTALLED\n"
                "="*80 + "\n"
                "PyTorch is required for video analysis.\n"
                "\n"
                "Install PyTorch:\n"
                "  # For NVIDIA GPU:\n"
                "  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124\n"
                "\n"
                "  # For CPU-only:\n"
                "  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu\n"
                "\n"
                "Then install other requirements:\n"
                "  pip install -r requirements.txt\n"
                "="*80 + "\n"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg)

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
        Combine locally stored video chunks into a single video file using binary concatenation + FFmpeg remuxing

        Args:
            team_id: Team ID for the video
            match_id: Match ID for the video
            total_chunks: Total number of chunks to combine

        Returns:
            str: Path to the combined video file, or None if failed
        """
        try:
            # Step 1: Concatenate raw chunks into single binary file
            raw_path = os.path.join("video_storage", team_id, match_id, "raw_concat.mp4")
            raw_path = self._normalize_path(raw_path)
            os.makedirs(os.path.dirname(raw_path), exist_ok=True)

            logger.info(f"Concatenating {total_chunks} raw chunks into {raw_path}")

            with open(raw_path, 'wb') as outfile:
                for i in range(total_chunks):
                    chunk_path = os.path.join("video_storage", team_id, match_id, "chunks", f"chunk_{i:03d}.mp4")
                    chunk_path = self._normalize_path(chunk_path)

                    if not os.path.exists(chunk_path):
                        logger.error(f"Failed to read video chunks: Chunk {i} not found at {chunk_path}")
                        return None

                    chunk_size = os.path.getsize(chunk_path)
                    logger.info(f"Reading chunk {i}: {chunk_path} ({chunk_size} bytes)")

                    with open(chunk_path, 'rb') as infile:
                        outfile.write(infile.read())

            # Verify raw concatenation
            raw_size = os.path.getsize(raw_path)
            logger.info(f"Raw concatenated file size: {raw_size} bytes")

            # Step 2: Use FFmpeg to remux into valid MP4
            output_path = os.path.join("video_storage", team_id, match_id, "combined_video.mp4")
            output_path = self._normalize_path(output_path)

            logger.info(f"Remuxing raw file into valid MP4: {output_path}")

            cmd = [
                self.ffmpeg_path,
                '-i', raw_path,
                '-c', 'copy',  # Copy streams without re-encoding
                '-movflags', '+faststart',  # Optimize for streaming
                '-y',  # Overwrite output file
                output_path
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info("Video chunks combined successfully using binary concatenation + remuxing")
                if os.path.exists(output_path):
                    file_size = os.path.getsize(output_path)
                    logger.info(f"Combined video size: {file_size} bytes")

                # Clean up raw file
                try:
                    os.remove(raw_path)
                    logger.info("Cleaned up raw concatenated file")
                except Exception as e:
                    logger.warning(f"Could not remove raw file: {e}")

                return output_path
            else:
                logger.error(f"Failed to create valid MP4 from uploaded chunks: FFmpeg remux failed with return code {result.returncode}")
                logger.error(f"FFmpeg stderr: {result.stderr}")
                logger.error(f"FFmpeg stdout: {result.stdout}")

                # Try re-encoding approach for corrupted chunks
                logger.info("Attempting re-encoding approach for corrupted chunks...")
                cmd_reencode = [
                    self.ffmpeg_path,
                    '-i', raw_path,
                    '-c:v', 'libx264',  # Re-encode video
                    '-c:a', 'aac',      # Re-encode audio
                    '-preset', 'fast',   # Faster encoding
                    '-movflags', '+faststart',
                    '-y',  # Overwrite output file
                    output_path
                ]

                result_reencode = subprocess.run(cmd_reencode, capture_output=True, text=True)

                if result_reencode.returncode == 0:
                    logger.info("Video chunks combined successfully with re-encoding")
                    if os.path.exists(output_path):
                        file_size = os.path.getsize(output_path)
                        logger.info(f"Combined video size: {file_size} bytes")

                    # Clean up raw file
                    try:
                        os.remove(raw_path)
                        logger.info("Cleaned up raw concatenated file")
                    except Exception as e:
                        logger.warning(f"Could not remove raw file: {e}")

                    return output_path
                else:
                    logger.error(f"Failed to create valid MP4 from uploaded chunks: Both copy and re-encode approaches failed")
                    logger.error(f"FFmpeg re-encode failed with return code: {result_reencode.returncode}")
                    logger.error(f"FFmpeg re-encode stderr: {result_reencode.stderr}")
                    logger.error(f"FFmpeg re-encode stdout: {result_reencode.stdout}")
                    return None

        except Exception as e:
            logger.error(f"Failed to combine video chunks: Unexpected error during chunk processing: {e}")
            return None


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

    def run_enhanced_analysis(self, video_path: str, match_id: str) -> tuple:
        """
        Run enhanced split-screen analysis with ball tracking

        Args:
            video_path: Path to the video file
            match_id: Match ID from Supabase

        Returns:
            tuple: (local_video_path, analysis_dict)
        """
        try:
            logger.info("Starting enhanced analysis with split-screen output")
            logger.info("Live preview window will open automatically")

            # Set up environment and run enhanced analysis
            env = os.environ.copy()

            # Add video_analysis directory to PYTHONPATH
            if 'PYTHONPATH' in env:
                if os.name == 'nt':  # Windows
                    env['PYTHONPATH'] = f"{VIDEO_ANALYSIS_PATH};{env['PYTHONPATH']}"
                else:  # Unix-like
                    env['PYTHONPATH'] = f"{VIDEO_ANALYSIS_PATH}:{env['PYTHONPATH']}"
            else:
                env['PYTHONPATH'] = VIDEO_ANALYSIS_PATH

            # Output path for enhanced video
            output_dir = os.path.join('backend', 'video_outputs')
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f'enhanced_{match_id}.mp4')

            cmd = [
                sys.executable,
                os.path.join(VIDEO_ANALYSIS_PATH, 'examples', 'soccer', 'enhanced_supabase_analysis.py'),
                '--source_video_path', video_path,
                '--match_id', match_id,
                '--device', self.device,
                '--export_local',
                '--show_preview'  # Always show live preview window
            ]

            logger.info(f"Running enhanced analysis with command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, env=env)

            if result.returncode == 0:
                logger.info(f"Enhanced analysis completed successfully")

                # Find the generated CSV file
                csv_path = self._find_latest_csv_file(match_id)

                # Return the expected output path and a basic analysis dict
                analysis_data = {
                    "analysis_type": "enhanced_analysis",
                    "summary": "Enhanced split-screen analysis completed",
                    "video_path": output_path,
                    "csv_path": csv_path
                }
                return output_path, analysis_data
            else:
                logger.error(f"Enhanced analysis failed: {result.stderr}")
                return None, {"error": result.stderr}

        except Exception as e:
            logger.error(f"Error running enhanced analysis: {e}")
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

    def run_preview_analysis(self, team_id: str, match_id: str) -> dict:
        """
        Run quick preview analysis on first chunk only

        This method processes only the first chunk (chunk_000.mp4) to provide
        immediate insights while the full video upload continues in the background.

        Args:
            team_id: Team ID for the video
            match_id: Match ID for the video

        Returns:
            dict: Analysis results with CSV path
        """
        try:
            # Get path to first chunk
            chunk_path = os.path.join("video_storage", team_id, match_id, "chunks", "chunk_000.mp4")
            chunk_path = self._normalize_path(chunk_path)

            if not os.path.exists(chunk_path):
                logger.error(f"First chunk not found: {chunk_path}")
                return {"error": "First chunk not found"}

            logger.info(f"Running preview analysis on first chunk: {chunk_path}")

            # Create output directory for preview results
            output_dir = os.path.join("tracking_data")
            os.makedirs(output_dir, exist_ok=True)

            # Generate timestamp for unique filenames
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Set up output paths with preview suffix
            csv_filename = f"positions_preview_{match_id}_{timestamp}.csv"
            stats_filename = f"stats_preview_{match_id}_{timestamp}.txt"
            summary_filename = f"summary_preview_{match_id}_{timestamp}.json"

            csv_path = os.path.join(output_dir, csv_filename)
            stats_path = os.path.join(output_dir, stats_filename)
            summary_path = os.path.join(output_dir, summary_filename)

            # Run enhanced analysis script in preview mode
            script_path = os.path.join(VIDEO_ANALYSIS_PATH, "examples", "soccer", "enhanced_supabase_analysis.py")

            cmd = [
                sys.executable,  # Use current Python interpreter
                script_path,
                "--input-video", chunk_path,
                "--output-csv", csv_path,
                "--output-stats", stats_path,
                "--output-summary", summary_path,
                "--preview-mode",  # Enable preview mode for speed
                "--device", self.device
            ]

            logger.info(f"Running preview analysis command: {' '.join(cmd)}")

            # Run the analysis
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=VIDEO_ANALYSIS_PATH)

            if result.returncode == 0:
                logger.info("Preview analysis completed successfully")

                # Verify output files exist
                if os.path.exists(csv_path):
                    file_size = os.path.getsize(csv_path)
                    logger.info(f"Preview CSV generated: {csv_path} ({file_size} bytes)")

                    return {
                        "csv_path": csv_path,
                        "stats_path": stats_path,
                        "summary_path": summary_path,
                        "file_size": file_size,
                        "message": "Preview analysis completed successfully"
                    }
                else:
                    logger.error("Preview analysis completed but CSV file not found")
                    return {"error": "CSV file not generated"}
            else:
                logger.error(f"Preview analysis failed with return code {result.returncode}")
                logger.error(f"stderr: {result.stderr}")
                logger.error(f"stdout: {result.stdout}")
                return {"error": f"Analysis failed: {result.stderr}"}

        except Exception as e:
            logger.error(f"Preview analysis error: {e}")
            return {"error": str(e)}

    def _find_latest_csv_file(self, match_id: str) -> str:
        """
        Find the latest CSV file generated for a match

        Args:
            match_id: Match ID to search for

        Returns:
            str: Path to the latest CSV file, or None if not found
        """
        try:
            import glob
            from pathlib import Path

            # Look for CSV files in tracking_data directory
            tracking_dir = Path("tracking_data")
            if not tracking_dir.exists():
                return None

            # Search for CSV files (both regular and preview)
            csv_patterns = [
                f"positions_{match_id}_*.csv",
                f"positions_preview_{match_id}_*.csv",
                f"positions_*.csv"  # Fallback to any positions CSV
            ]

            latest_file = None
            latest_time = 0

            for pattern in csv_patterns:
                csv_files = list(tracking_dir.glob(pattern))
                for csv_file in csv_files:
                    if csv_file.is_file():
                        file_time = csv_file.stat().st_mtime
                        if file_time > latest_time:
                            latest_time = file_time
                            latest_file = str(csv_file)

            if latest_file:
                logger.info(f"Found latest CSV file: {latest_file}")
                return latest_file
            else:
                logger.warning(f"No CSV file found for match {match_id}")
                return None

        except Exception as e:
            logger.error(f"Error finding CSV file: {e}")
            return None

    def cleanup(self):
        """Clean up temporary files and directories"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            logger.error(f"Error cleaning up: {e}")


def run_quick_brief_from_chunks(team_id: str, match_id: str, total_chunks: int, device: str = 'cpu') -> Dict:
    """
    Run quick brief analysis on locally stored video chunks

    Args:
        team_id: Team ID for the video
        match_id: Match ID for the video
        total_chunks: Total number of chunks
        device: Device to use for processing ('cpu', 'cuda', 'mps')

    Returns:
        Dict: Analysis results
    """
    processor = VideoProcessor(device=device)
    try:
        # Combine chunks first
        combined_video_path = processor.combine_local_chunks(team_id, match_id, total_chunks)
        if not combined_video_path:
            return {"error": "Failed to combine video chunks"}

        # Run quick brief analysis
        return processor.run_quick_brief(combined_video_path)
    finally:
        processor.cleanup()


def run_full_analysis_from_chunks(team_id: str, match_id: str, total_chunks: int, device: str = 'cpu') -> Dict:
    """
    Run full analysis on locally stored video chunks

    Args:
        team_id: Team ID for the video
        match_id: Match ID for the video
        total_chunks: Total number of chunks
        device: Device to use for processing ('cpu', 'cuda', 'mps')

    Returns:
        Dict: Analysis results
    """
    processor = VideoProcessor(device=device)
    try:
        # Combine chunks first
        combined_video_path = processor.combine_local_chunks(team_id, match_id, total_chunks)
        if not combined_video_path:
            return {"error": "Failed to combine video chunks"}

        # Run full analysis
        return processor.run_full_analysis(combined_video_path)
    finally:
        processor.cleanup()


def run_quick_brief(video_path: str, device: str = 'cpu') -> Dict:
    """
    Convenience function to run quick brief analysis

    Args:
        video_path: Path to the video file
        device: Device to use for processing ('cpu', 'cuda', 'mps')

    Returns:
        Dict: Analysis results
    """
    processor = VideoProcessor(device=device)
    try:
        return processor.run_quick_brief(video_path)
    finally:
        processor.cleanup()


def run_full_analysis(video_path: str, device: str = 'cpu') -> Dict:
    """
    Convenience function to run full analysis

    Args:
        video_path: Path to the video file
        device: Device to use for processing ('cpu', 'cuda', 'mps')

    Returns:
        Dict: Analysis results
    """
    processor = VideoProcessor(device=device)
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
    parser.add_argument('--device', type=str, default='cpu', help='Device to use')

    args = parser.parse_args()

    processor = VideoProcessor(device=args.device)

    try:
        if args.analysis_type == 'quick_brief':
            results = processor.run_quick_brief(args.video_path)
        else:
            results = processor.run_full_analysis(args.video_path)

        print(json.dumps(results, indent=2))

    finally:
        processor.cleanup()
