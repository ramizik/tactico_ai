# Football Analysis Project ⚽

> **Based on**: [abdullahtarek/football_analysis](https://github.com/abdullahtarek/football_analysis) - Enhanced with dynamic field detection, multi-resolution support, progress tracking, and robust error handling.

## Introduction
This project provides a comprehensive football analysis system that detects and tracks players, referees, and footballs in video footage using state-of-the-art computer vision techniques. The system automatically assigns players to teams based on jersey colors, tracks ball possession, measures player speeds and distances, and compensates for camera movement to provide accurate real-world measurements.

![Screenshot](output_videos/screenshot.png)

## 🚀 Key Features

### Core Functionality
- **Player Detection & Tracking**: YOLO-based object detection with ByteTrack tracking
- **Team Assignment**: Automatic team classification using K-means color clustering
- **Ball Possession Tracking**: Real-time ball assignment to players
- **Speed & Distance Calculation**: Player movement analysis in real-world units
- **Camera Movement Compensation**: Optical flow-based camera stabilization
- **Perspective Transformation**: Convert pixel coordinates to real-world measurements

### 🆕 Recent Improvements
- **Dynamic Field Detection**: Automatically adapts to different camera angles and field sizes
- **Multi-Resolution Support**: Works with 720p, 1080p, 4K, and custom resolutions
- **Robust Error Handling**: Graceful handling of invalid bounding boxes and edge cases
- **Progress Tracking**: Real-time progress indicators with emojis and percentages
- **Smart Stub Caching**: Fast reprocessing using cached detection data

## 🏗️ Architecture

### Processing Pipeline
1. **📹 Video Input**: Load and validate video frames
2. **🤖 Object Detection**: YOLO-based detection with batch processing
3. **🎯 Tracking**: ByteTrack algorithm for consistent object tracking
4. **📍 Position Calculation**: Extract player and ball positions
5. **📷 Camera Movement**: Optical flow analysis for camera stabilization
6. **🔄 Perspective Transform**: Convert to real-world coordinates
7. **⚽ Ball Interpolation**: Fill missing ball detections
8. **📊 Speed/Distance**: Calculate player statistics
9. **👥 Team Assignment**: Color-based team classification
10. **🎾 Ball Possession**: Assign ball ownership to players
11. **🎨 Rendering**: Generate output video with overlays

### Dynamic Adaptations
- **Field Corner Detection**: Computer vision-based field boundary detection
- **Responsive UI**: Dynamic positioning and scaling for different video sizes
- **Adaptive Masks**: Camera movement masks that scale with video dimensions
- **Smart Fallbacks**: Proportional positioning when detection fails

## 📦 Modules Used

### Core Dependencies
- **YOLO (Ultralytics)**: AI object detection model
- **Supervision**: Object tracking and annotation
- **OpenCV**: Computer vision and video processing
- **NumPy**: Numerical computations
- **scikit-learn**: K-means clustering for team assignment

### Analysis Modules
- **K-means**: Pixel segmentation and clustering for team color detection
- **Optical Flow**: Camera movement estimation between frames
- **Perspective Transformation**: Real-world coordinate conversion
- **Speed/Distance Calculator**: Player movement analysis

## 🛠️ Installation & Setup

### Requirements
```bash
Python 3.8+
ultralytics
supervision
opencv-python
numpy
scikit-learn
pandas
matplotlib
```

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd football_analysis
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download the trained model**
   - Place `best.pt` in the `models/` directory
   - [Download YOLO v5 model](https://drive.google.com/file/d/1DC2kCygbBWUKheQ_9cFziCsYVSRw6axK/view?usp=sharing)

4. **Add your video**
   - Place your video file in `input_videos/`
   - Update the path in `main.py` if needed

5. **Run the analysis**
   ```bash
   python main.py
   ```

## 🎯 Usage

### Basic Usage
```python
python main.py
```

### Expected Output
The system will process your video and display:
- **Real-time progress** with emojis and percentages
- **Step-by-step status** updates
- **Processing statistics** (frames processed, time taken)
- **Output video** saved to `output_videos/output_video.avi`

### Progress Tracking
```
🚀 Starting Football Analysis Pipeline...
============================================================
📹 Reading video file [██████████████████████████████] 10.0% (1/10)
 ✅ Loaded 120 frames
🤖 Initializing YOLO tracker [██████████████████████████████] 20.0% (2/10)
 ✅ Tracker ready
🎯 Detecting and tracking objects [██████████████████████████████] 30.0% (3/10)
    🔍 Processing 120 frames in 6 batches...
    🎯 Detecting objects: Batch 6/6 (100.0%)
 ✅ Object tracking complete
...
```

## 🔧 Configuration

### Video Compatibility
The system automatically adapts to:
- **Different resolutions**: 720p, 1080p, 4K, custom sizes
- **Various aspect ratios**: 16:9, 4:3, custom ratios
- **Different camera angles**: Wide shots, close-ups, angled views
- **Moving cameras**: Handheld, drone, or stabilized footage

### Performance Optimization
- **Stub Caching**: First run generates cache files for faster subsequent runs
- **Batch Processing**: YOLO processes frames in batches for efficiency
- **Memory Management**: Optimized for large video files
- **Progress Tracking**: Real-time feedback on processing status

## 📊 Output Features

### Visual Overlays
- **Player Tracking**: Colored ellipses around players
- **Team Identification**: Color-coded team assignments
- **Ball Possession**: Triangle indicators for ball carriers
- **Speed/Distance**: Real-time player statistics
- **Team Control**: Ball possession percentage display
- **Camera Movement**: Movement compensation indicators

### Data Analysis
- **Player Statistics**: Speed, distance, team assignment
- **Ball Possession**: Team control percentages
- **Movement Patterns**: Camera-compensated trajectories
- **Real-world Measurements**: Converted from pixel coordinates

## 🚨 Troubleshooting

### Common Issues
1. **Invalid Bounding Boxes**: System automatically handles and skips invalid detections
2. **Field Detection Failures**: Falls back to proportional positioning
3. **Memory Issues**: Reduce batch size or video resolution
4. **Slow Processing**: Enable stub caching for repeated runs

### Error Handling
- **Graceful Degradation**: System continues processing even with partial failures
- **Informative Messages**: Clear error reporting and progress updates
- **Fallback Mechanisms**: Alternative approaches when primary methods fail

## 🎨 Demo & Hackathon Features

### For Live Demos
- **Pre-processed Videos**: Include sample videos for instant demonstration
- **Progress Indicators**: Visual feedback keeps audience engaged
- **Error Recovery**: Robust handling prevents demo failures
- **Scalable UI**: Works with any video size or resolution

### API Integration Ready
The modular design makes it easy to integrate into web applications:
- **Separate Processing**: Core analysis logic is modular
- **Configurable Output**: Customizable overlay options
- **Batch Processing**: Support for multiple video processing
- **Status Tracking**: Real-time progress for web interfaces

## 📈 Performance Metrics

### Processing Times (Approximate)
| Video Length | Resolution | First Run | Cached Run |
|--------------|------------|-----------|------------|
| 1 minute     | 1080p      | 2-5 min   | 10-30 sec  |
| 5 minutes    | 1080p      | 10-25 min | 30-60 sec  |
| 15 minutes   | 1080p      | 30-75 min | 2-5 min    |

### System Requirements
- **Minimum**: 8GB RAM, CPU processing
- **Recommended**: 16GB RAM, GPU acceleration
- **Storage**: 2-3x video size for processing cache

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with different video types
5. Submit a pull request

### Testing
- Test with various video formats and resolutions
- Verify field detection with different camera angles
- Check performance with long videos
- Validate output accuracy

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

### Original Work
This project is based on the excellent work by [**abdullahtarek**](https://github.com/abdullahtarek/football_analysis) who created the original football analysis system. The foundational codebase provided the core computer vision pipeline for player detection, tracking, and team assignment.

**Original Repository**: [abdullahtarek/football_analysis](https://github.com/abdullahtarek/football_analysis/tree/main)

### Enhanced Features
This enhanced version builds upon the original work with significant improvements:
- Dynamic field detection and multi-resolution support
- Robust error handling and progress tracking
- Enhanced UI positioning and responsive design
- Comprehensive documentation and demo-ready features

### Dependencies & Libraries
- **Ultralytics**: For the YOLO implementation
- **Supervision**: For object tracking utilities
- **OpenCV**: For computer vision capabilities
- **scikit-learn**: For K-means clustering
- **NumPy & Pandas**: For numerical computations

---

**Ready to analyze football videos like a pro?** 🚀⚽

For questions or support, please open an issue in the repository.