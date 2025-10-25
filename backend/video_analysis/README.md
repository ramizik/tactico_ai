# Sports Analytics Project - Complete Context

## Project Overview

This is a **Roboflow Sports Analytics** project focused on computer vision applications in sports, particularly soccer. The project provides comprehensive tools for analyzing soccer videos using state-of-the-art AI models.

## Project Structure

```
/Users/ashok/Desktop/sports/sports/
├── README.md                           # Main project documentation
├── setup.py                           # Package configuration
├── .gitignore                         # Git ignore rules
├── sports/                            # Main package directory
│   ├── __init__.py                    # Package initialization
│   ├── annotators/                    # Annotation utilities
│   │   ├── __init__.py
│   │   └── soccer.py                  # Soccer-specific annotations
│   ├── common/                        # Common utilities
│   │   ├── __init__.py
│   │   ├── ball.py                   # Ball tracking and annotation
│   │   ├── team.py                   # Team classification
│   │   └── view.py                   # View transformation
│   └── configs/                       # Configuration files
│       ├── __init__.py
│       └── soccer.py                  # Soccer pitch configuration
└── examples/
    └── soccer/                        # Soccer analysis example
        ├── main.py                   # Main analysis script
        ├── README.md                 # Soccer-specific documentation
        ├── requirements.txt          # Additional dependencies
        ├── setup.sh                  # Setup script (bash)
        ├── data/                     # Models and sample videos
        │   ├── football-ball-detection.pt      # Ball detection model (137MB)
        │   ├── football-player-detection.pt   # Player detection model (137MB)
        │   ├── football-pitch-detection.pt    # Pitch detection model (140MB)
        │   ├── 0bfacc_0.mp4                   # Sample video (20MB)
        │   ├── 2e57b9_0.mp4                   # Sample video (21MB)
        │   ├── 08fd33_0.mp4                   # Sample video (20MB)
        │   ├── 573e61_0.mp4                   # Sample video (19MB)
        │   └── 121364_0.mp4                   # Sample video (17MB)
        └── notebooks/                 # Training notebooks
            ├── train_ball_detector.ipynb
            ├── train_pitch_keypoint_detector.ipynb
            └── train_player_detector.ipynb
```

## Key Features

### Core Capabilities
- **Ball tracking** - Detects and tracks soccer balls in videos
- **Player detection** - Identifies players, goalkeepers, and referees
- **Pitch detection** - Detects soccer field boundaries and key points
- **Player tracking** - Maintains consistent player identification across frames
- **Team classification** - Automatically classifies players into teams using visual features
- **Radar visualization** - Creates overhead view of player positions

### Analysis Modes

1. **`PITCH_DETECTION`** - Detects soccer field boundaries and key points
2. **`PLAYER_DETECTION`** - Detects players, goalkeepers, referees, and ball
3. **`BALL_DETECTION`** - Tracks ball movement with trajectory visualization
4. **`PLAYER_TRACKING`** - Maintains consistent player identification
5. **`TEAM_CLASSIFICATION`** - Classifies players into teams using visual features
6. **`RADAR`** - Creates comprehensive overhead radar view

## Technology Stack

### AI Models
- **YOLOv8** - Object detection (players, ball, pitch)
- **SigLIP** - Visual feature extraction for team classification
- **UMAP** - Dimensionality reduction
- **KMeans** - Team clustering

### Libraries
- **Supervision** - Video processing and annotations
- **Ultralytics** - YOLOv8 implementation
- **Transformers** - SigLIP model
- **OpenCV** - Computer vision
- **PyTorch** - Deep learning framework
- **NumPy, SciPy** - Numerical computing
- **Matplotlib** - Visualization

## Installation Status

### ✅ Completed Installations

**Main Package:**
```bash
pip3 install -e .
```

**Core Dependencies:**
- supervision (0.26.1)
- numpy (2.0.2)
- opencv-python (4.12.0.88)
- transformers (4.57.1)
- umap-learn (0.5.9.post2)
- scikit-learn (1.6.1)
- tqdm (4.67.1)
- sentencepiece (0.2.1)
- protobuf (6.33.0)

**Additional Dependencies:**
- ultralytics (8.3.217)
- gdown (5.2.0)
- torch (2.8.0)
- torchvision (0.23.0)
- matplotlib (3.9.4)
- pillow (11.3.0)

### ✅ Downloaded Assets

**Models (414MB total):**
- `football-ball-detection.pt` (137MB) - Ball detection model
- `football-player-detection.pt` (137MB) - Player detection model
- `football-pitch-detection.pt` (140MB) - Pitch detection model

**Sample Videos (98MB total):**
- `2e57b9_0.mp4` (21MB) - Main demo video
- `0bfacc_0.mp4` (20MB) - Sample video
- `08fd33_0.mp4` (20MB) - Sample video
- `573e61_0.mp4` (19MB) - Sample video
- `121364_0.mp4` (17MB) - Sample video

## Usage Examples

### Basic Command Structure
```bash
cd /Users/ashok/Desktop/sports/sports/examples/soccer
python3 main.py \
  --source_video_path data/2e57b9_0.mp4 \
  --target_video_path output.mp4 \
  --device cpu \
  --mode PLAYER_DETECTION
```

### Available Devices
- `cpu` - CPU processing
- `cuda` - NVIDIA GPU (if available)
- `mps` - Apple Silicon GPU (if available)

### Mode-Specific Examples

**Pitch Detection:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-pitch-detection.mp4 \
  --device mps --mode PITCH_DETECTION
```

**Player Detection:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-player-detection.mp4 \
  --device mps --mode PLAYER_DETECTION
```

**Ball Detection:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-ball-detection.mp4 \
  --device mps --mode BALL_DETECTION
```

**Player Tracking:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-player-tracking.mp4 \
  --device mps --mode PLAYER_TRACKING
```

**Team Classification:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-team-classification.mp4 \
  --device mps --mode TEAM_CLASSIFICATION
```

**Radar View:**
```bash
python3 main.py --source_video_path data/2e57b9_0.mp4 \
  --target_video_path data/2e57b9_0-radar.mp4 \
  --device mps --mode RADAR
```

## Technical Details

### Class IDs
- `BALL_CLASS_ID = 0`
- `GOALKEEPER_CLASS_ID = 1`
- `PLAYER_CLASS_ID = 2`
- `REFEREE_CLASS_ID = 3`

### Key Components

**BallTracker** (`sports/common/ball.py`):
- Maintains buffer of recent ball positions
- Uses centroid-based prediction for tracking

**TeamClassifier** (`sports/common/team.py`):
- Uses SigLIP for feature extraction
- UMAP for dimensionality reduction
- KMeans for team clustering

**ViewTransformer** (`sports/common/view.py`):
- Handles homography transformations
- Converts between camera view and pitch coordinates

**SoccerPitchConfiguration** (`sports/configs/soccer.py`):
- Defines standard soccer pitch dimensions
- Provides vertices, edges, and labels for pitch visualization

### Soccer Pitch Specifications
- Width: 7000 cm (70m)
- Length: 12000 cm (120m)
- Penalty box: 4100 x 2015 cm
- Goal box: 1832 x 550 cm
- Centre circle radius: 915 cm
- Penalty spot distance: 1100 cm

## System Requirements

### Python Version
- Python >= 3.8 (Current: Python 3.9.6)

### Hardware Requirements
- **CPU**: Any modern processor
- **GPU**: Optional but recommended for faster processing
  - NVIDIA CUDA-compatible GPU
  - Apple Silicon with MPS support
- **RAM**: Minimum 8GB recommended
- **Storage**: ~600MB for models and sample videos

### Operating System
- macOS (tested on macOS 14.0.0)
- Linux
- Windows

## Development Environment

### Current Setup
- **OS**: macOS 14.0.0 (darwin 25.0.0)
- **Shell**: /bin/zsh
- **Python**: 3.9.6 (/usr/bin/python3)
- **Pip**: 21.2.4 (/usr/bin/pip3)
- **Workspace**: /Users/ashok/Desktop/sports/sports

### Git Status
- Branch: main
- Status: Up to date with origin/main
- Changes: LICENSE file deleted (not staged)

## Available Datasets

The project references several datasets available on Roboflow Universe:

1. **Soccer Player Detection** - Football players detection
2. **Soccer Ball Detection** - Football ball detection
3. **Soccer Pitch Keypoint Detection** - Football field detection
4. **Basketball Court Keypoint Detection** - Basketball court detection
5. **Basketball Jersey Numbers OCR** - Jersey number recognition

## Training Notebooks

Located in `examples/soccer/notebooks/`:
- `train_ball_detector.ipynb` - Train ball detection model
- `train_pitch_keypoint_detector.ipynb` - Train pitch detection model
- `train_player_detector.ipynb` - Train player detection model

## Project Challenges Addressed

1. **Ball tracking** - Small size and rapid movements
2. **Reading jersey numbers** - Blurry videos and occlusions
3. **Player tracking** - Consistent identification across frames
4. **Player re-identification** - Players leaving and re-entering frame
5. **Camera calibration** - Accurate view transformation for statistics

## License Information

- **Ultralytics (YOLOv8)**: AGPL-3.0 license
- **Sports Analytics Code**: MIT license (based on Supervision library)
- **Project**: MIT license

## Next Steps

1. **Test the system** with sample videos
2. **Explore different modes** to understand capabilities
3. **Train custom models** using provided notebooks
4. **Integrate with your own videos** for analysis
5. **Extend functionality** for other sports or use cases

## Troubleshooting

### Common Issues
- **SSL Warning**: urllib3 OpenSSL compatibility warning (non-critical)
- **Device Selection**: Use `cpu` if GPU not available
- **Memory**: Large models may require sufficient RAM

### Verification Commands
```bash
# Test package import
python3 -c "import sports; print('Sports package imported successfully')"

# Test YOLO import
python3 -c "from ultralytics import YOLO; print('YOLO imported successfully')"

# Check help
python3 main.py --help
```

---

*This context file was generated on October 20, 2024, after successful installation and setup of the Sports Analytics project.*
