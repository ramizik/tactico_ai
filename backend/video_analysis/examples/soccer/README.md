# TacticoAI Soccer Analysis ⚽

## 🎯 Overview

This module is part of the **TacticoAI** sports analysis platform, providing AI-powered video analysis for soccer matches. The module integrates with the main FastAPI backend to process uploaded match videos and generate tactical insights.

## 🚀 Integration with TacticoAI

This soccer analysis module is automatically used by the TacticoAI backend when processing soccer match videos. No separate installation is required - all dependencies are managed through the main backend requirements.txt.

### **How it works:**
1. **Video Upload**: Users upload soccer match videos through the TacticoAI frontend
2. **Chunked Processing**: Videos are processed in chunks for efficient analysis
3. **AI Analysis**: This module performs comprehensive soccer analysis
4. **Results**: Tactical insights are returned to the frontend for display

## 🧠 Machine Learning Training

### **Pre-trained Models**
The TacticoAI system uses pre-trained models for immediate analysis:

- **Player Detection**: `football-player-detection.pt` (137MB)
- **Ball Detection**: `football-ball-detection.pt` (137MB)
- **Pitch Detection**: `football-pitch-detection.pt` (140MB)

### **Training Datasets**
Original data comes from the [DFL - Bundesliga Data Shootout](https://www.kaggle.com/competitions/dfl-bundesliga-data-shootout)
Kaggle competition, processed into specialized datasets:

| **Use Case** | **Dataset** | **Training Notebook** |
|:-------------|:------------|:---------------------|
| **Player Detection** | [Football Players Detection](https://universe.roboflow.com/roboflow-jvuqo/football-players-detection-3zvbc) | [Train Player Detector](notebooks/train_player_detector.ipynb) |
| **Ball Detection** | [Football Ball Detection](https://universe.roboflow.com/roboflow-jvuqo/football-ball-detection-rejhg) | [Train Ball Detector](notebooks/train_ball_detector.ipynb) |
| **Pitch Detection** | [Football Field Detection](https://universe.roboflow.com/roboflow-jvuqo/football-field-detection-f07vi) | [Train Pitch Detector](notebooks/train_pitch_keypoint_detector.ipynb) |

### **Custom Model Training**
To train custom models for specific use cases:

1. **Download datasets** from Roboflow Universe
2. **Use Jupyter notebooks** in the `notebooks/` directory
3. **Train models** with your specific data
4. **Replace model files** in the `data/` directory

## 🤖 AI Technology Stack

### **Computer Vision Models**
- **[YOLOv8](https://docs.ultralytics.com/models/yolov8/)** - Player Detection
  - Detects players, goalkeepers, referees, and the ball in video frames
  - Pre-trained on Bundesliga data for high accuracy
- **[YOLOv8](https://docs.ultralytics.com/models/yolov8/)** - Pitch Detection
  - Identifies soccer field boundaries and key points
  - Enables tactical analysis and formation visualization

### **Machine Learning Pipeline**
- **[SigLIP](https://huggingface.co/docs/transformers/en/model_doc/siglip)** - Feature Extraction
  - Extracts visual features from player image crops
  - Enables team classification based on visual appearance
- **[UMAP](https://umap-learn.readthedocs.io/en/latest/)** - Dimensionality Reduction
  - Reduces feature dimensions for efficient clustering
  - Maintains important visual relationships
- **[KMeans](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html)** - Team Classification
  - Clusters players into two teams based on visual features
  - Enables tactical analysis and team formation detection

## 🛠️ Analysis Modes

The TacticoAI soccer analysis supports multiple analysis modes, each providing different insights:

### **Core Detection Modes**
- **`PITCH_DETECTION`** - Identifies soccer field boundaries and key points
  - Enables tactical analysis and formation visualization
  - Essential for understanding field layout and player positioning

- **`PLAYER_DETECTION`** - Detects players, goalkeepers, referees, and the ball
  - Foundation for all other analysis modes
  - Provides object detection and bounding box coordinates

- **`BALL_DETECTION`** - Tracks ball position and movement
  - Enables possession analysis and ball trajectory tracking
  - Critical for understanding game flow and key moments

### **Advanced Analysis Modes**
- **`PLAYER_TRACKING`** - Maintains consistent player identification across frames
  - Enables movement analysis and player statistics
  - Tracks individual player performance throughout the match

- **`TEAM_CLASSIFICATION`** - Automatically classifies players into teams
  - Uses visual features (jersey colors, team kits) for classification
  - Enables team-specific analysis and formation detection

- **`RADAR`** - Comprehensive tactical visualization
  - Combines all detection modes for complete analysis
  - Generates radar-like visualization of player positions and movements
  - Provides tactical insights and formation analysis

### **Integration with TacticoAI**
These analysis modes are automatically executed by the TacticoAI backend when processing soccer match videos. The system intelligently selects the appropriate analysis level based on the user's requirements (quick brief vs. full analysis).

## 🗺️ Development Roadmap

- [ ] **Enhanced smoothing** for RADAR mode to eliminate flickering
- [ ] **Offline analysis notebooks** for data scientists and researchers
- [ ] **Custom model training** integration with TacticoAI backend
- [ ] **Multi-sport support** (basketball, tennis, etc.)
- [ ] **Real-time analysis** for live match streaming

## 📄 License & Attribution

This module integrates multiple open-source components:

- **YOLOv8 (Ultralytics)**: [AGPL-3.0 License](https://github.com/ultralytics/ultralytics/blob/main/LICENSE)
- **Supervision Library**: [MIT License](https://github.com/roboflow/supervision/blob/develop/LICENSE.md)
- **TacticoAI Integration**: Custom implementation for sports analysis platform

The sports analysis code is fully open source and freely usable in your projects under the MIT license.