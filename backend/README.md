# TacticoAI Backend API

FastAPI backend for TacticoAI sports tactical analysis platform with AI-powered video analysis capabilities.

## 📁 Project Structure

```
backend/
├── main.py                           # FastAPI application & all endpoints
├── job_processor.py                  # Background job processor for AI analysis
├── video_processor.py                # Video processing and AI analysis wrapper
├── seed_data.py                      # Database seeding script
├── supabase_schema.sql               # Database schema SQL
├── requirements.txt                  # Python dependencies
├── .env.example                      # Example environment variables
├── video_storage/                    # Local video storage (chunks & combined videos)
│   └── {team_id}/{match_id}/         # Team and match-specific storage
├── video_analysis/                   # AI Analysis Module
│   ├── sports/                       # Core sports analysis package
│   │   ├── annotators/              # Video annotation tools
│   │   ├── common/                  # Shared utilities (ball, team, view)
│   │   └── configs/                 # Sport-specific configurations
│   └── examples/soccer/             # Soccer analysis implementation
│       ├── main.py                  # Main analysis script
│       ├── data/                    # AI models and sample videos
│       │   ├── football-ball-detection.pt      # Ball detection model (137MB)
│       │   ├── football-player-detection.pt   # Player detection model (137MB)
│       │   ├── football-pitch-detection.pt    # Pitch detection model (140MB)
│       │   └── *.mp4                # Sample videos
│       ├── setup.sh                 # Model download script
│       └── requirements.txt         # Additional AI dependencies
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.12** (REQUIRED - see why below)
- **FFmpeg** installed and in PATH
- **Supabase account** with project
- **4GB+ RAM** for AI processing
- **~2GB disk space** for AI models
- **NVIDIA GPU** (optional, but highly recommended for fast video analysis)

> ⚠️ **Important**: Python 3.12 is required for PyTorch CUDA support. Python 3.13 does not yet have CUDA-enabled PyTorch wheels.

### 1. Install Python 3.12

**Why Python 3.12?**
- PyTorch with CUDA (GPU acceleration) doesn't support Python 3.13 yet
- Python 3.12 has full compatibility with all AI/ML dependencies
- Video analysis is 10-50x faster with GPU acceleration

**Windows:**
1. Download Python 3.12 from: https://www.python.org/downloads/release/python-3120/
2. Run the installer
3. ✅ Check "Add Python to PATH"
4. Click "Customize installation"
5. Install to: `C:\Python312\`

**macOS:**
```bash
brew install python@3.12
```

**Linux:**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv
```

**Verify Installation:**
```bash
# Check Python 3.12 is available
py -3.12 --version        # Windows
python3.12 --version      # macOS/Linux
```

### 2. Create Virtual Environment with Python 3.12

```bash
# Windows (PowerShell)
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux
python3.12 -m venv venv
source venv/bin/activate

# Verify you're using Python 3.12
python --version
# Should output: Python 3.12.x
```

### 3. Install PyTorch with CUDA Support

**If you have an NVIDIA GPU:**

```bash
# Install PyTorch with CUDA 12.4 support (recommended)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Verify CUDA is working
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}')"

# Expected output:
# CUDA available: True
# GPU: NVIDIA GeForce RTX xxxx
```

**If you DON'T have an NVIDIA GPU (CPU only):**

```bash
# PyTorch will be installed with other dependencies
# Video analysis will work but be slower (10-50x slower)
```

> 💡 **Tip**: If `nvidia-smi` shows CUDA 13.0, that's fine! PyTorch built with CUDA 12.4 will work perfectly with CUDA 13.0 drivers due to backward compatibility.

### 4. Install Other Dependencies

```bash
# Install all other packages
pip install -r requirements.txt

# Verify critical imports work
python -c "import ultralytics; import transformers; import cv2; print('✅ All dependencies installed!')"
```

### 5. Install FFmpeg

**Windows:**
```bash
# Option 1: Using winget (Windows 10/11)
winget install ffmpeg

# Option 2: Download from https://ffmpeg.org/download.html
# Extract to C:\ffmpeg\ and add C:\ffmpeg\bin to PATH
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
# or
sudo yum install ffmpeg
```

### 6. Download AI Models

Navigate to the soccer analysis directory and download the required AI models:

```bash
# Navigate to soccer analysis directory
cd video_analysis/examples/soccer

# Install gdown for model downloads
pip install gdown

# Download AI models (414MB total)
gdown "https://drive.google.com/uc?id=1isw4wx-MK9h9LMr36VvIWlJD6ppUvw7V" -O "data/football-ball-detection.pt"
gdown "https://drive.google.com/uc?id=17PXFNlx-jI7VjVo_vQnB1sONjRyvoB-q" -O "data/football-player-detection.pt"
gdown "https://drive.google.com/uc?id=1Ma5Kt86tgpdjCTKfum79YMgNnSjcoOyf" -O "data/football-pitch-detection.pt"

# Verify models downloaded (should see 3 .pt files)
ls data/*.pt
```

### 7. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Video Processing
VIDEO_ANALYSIS_PATH=./video_analysis
TEMP_VIDEO_DIR=/tmp/tactico_videos

# Device Configuration (important!)
# Use 'cuda' if you have NVIDIA GPU, 'cpu' otherwise
ANALYSIS_DEVICE=cuda  # or 'cpu' if no GPU
```

### 8. Set Up Database

Run the SQL schema in Supabase Dashboard → SQL Editor:
```bash
# Copy contents of supabase_schema.sql and run in Supabase
```

### 9. Seed Demo Data

```bash
python seed_data.py
```

### 10. Start Server

```bash
uvicorn main:app --reload --port 8000
```

API will be available at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## 🤖 AI Video Analysis System

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

### AI Technology Stack

- **YOLOv8** - Object detection (players, ball, pitch)
- **SigLIP** - Visual feature extraction for team classification
- **UMAP** - Dimensionality reduction
- **KMeans** - Team clustering
- **Supervision** - Video processing and annotations
- **Ultralytics** - YOLOv8 implementation
- **Transformers** - SigLIP model
- **OpenCV** - Computer vision
- **PyTorch** - Deep learning framework

### Video Processing Pipeline

1. **Chunked Upload** - Large videos split into 10MB chunks
2. **Chunk Combination** - FFmpeg merges chunks into single video
3. **AI Analysis** - Sports analysis module processes video
4. **Result Storage** - Analysis results saved to database
5. **Progress Tracking** - Real-time job status updates

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/{team_id}` - Get specific team

### Players
- `GET /api/teams/{team_id}/players` - Get team players
- `POST /api/teams/{team_id}/players` - Create new player

### Matches
- `GET /api/teams/{team_id}/matches` - Get team matches
- `GET /api/matches/{match_id}` - Get specific match
- `POST /api/teams/{team_id}/matches` - Create new match
- `GET /api/matches/{match_id}/analysis` - Get match analysis
- `GET /api/matches/{match_id}/job` - Get match job status

### Video Upload (Chunked)
- `POST /api/upload/video-chunk` - Upload video chunk
- `GET /api/matches/{match_id}/upload-status` - Get upload progress
- `POST /api/matches/{match_id}/analyze` - Trigger analysis

### Jobs
- `GET /api/jobs/{job_id}` - Get job status

### Storage
- `POST /api/upload/video` - Upload match video (legacy)

## 🔧 Development

### Run with Auto-reload
```bash
uvicorn main:app --reload --port 8000
```

### Interactive API Documentation
Visit `http://localhost:8000/docs` for Swagger UI

### Database Queries
All database operations use Supabase Python client:

```python
from supabase import create_client
supabase = create_client(url, key)

# Query example
result = supabase.table("teams").select("*").execute()
```

## 🗄️ Database Schema

### Tables
- **teams** - Team information (UOP, UC California)
- **players** - Player roster with stats
- **matches** - Match records with metadata
- **jobs** - Processing job status tracking
- **analyses** - AI-generated tactical analyses

### Storage Buckets
- **videos** - Match video files (private)
- **thumbnails** - Video thumbnails (public)
- **logos** - Team logos (public)

## 🔐 Security

- Service role key is for **backend only** - never expose to frontend
- All API endpoints use CORS middleware for allowed origins
- RLS policies enforce data access rules in Supabase
- JWT verification for authenticated requests (future)

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### Test Teams Endpoint
```bash
curl http://localhost:8000/api/teams
```

### Test with Python
```python
import requests
response = requests.get("http://localhost:8000/api/teams")
print(response.json())
```

## 📦 Dependencies

- **fastapi** - Modern web framework
- **uvicorn** - ASGI server
- **supabase** - Database client
- **python-dotenv** - Environment variables
- **python-multipart** - File uploads
- **pydantic** - Data validation

## 🚨 Common Issues

### ModuleNotFoundError
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### Supabase Connection Error
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Test connection in Supabase dashboard

### Port Already in Use
- Change port: `uvicorn main:app --reload --port 8001`
- Kill existing process on port 8000

### CORS Errors
- Update `ALLOWED_ORIGINS` in `.env`
- Check frontend URL matches allowed origins

### FFmpeg Not Found
- **Windows**: Install FFmpeg and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`
- Test: `ffmpeg -version`

### AI Models Missing
- Navigate to `video_analysis/examples/soccer/`
- Run: `pip install gdown`
- Download models using gdown commands (see step 3 above)
- Verify: `ls data/*.pt` shows 3 model files

### Video Analysis Fails
- Check models are downloaded (414MB total)
- Verify FFmpeg is working: `ffmpeg -version`
- Check video format (MP4 recommended)
- Monitor backend logs for specific errors

### GPU/CUDA Issues

**"Torch not compiled with CUDA enabled" error:**
- You're using CPU-only PyTorch
- Solution: Install PyTorch with CUDA support (see Step 3 above)
- Run: `pip uninstall torch torchvision torchaudio -y`
- Then: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124`

**CUDA version mismatch:**
- If `nvidia-smi` shows CUDA 13.0, you can still use PyTorch CUDA 12.4
- NVIDIA drivers are backward compatible
- PyTorch CUDA 12.4 will work perfectly with CUDA 13.0 drivers

**Python 3.13 Compatibility Issues:**
- ❌ Python 3.13 doesn't support PyTorch with CUDA yet
- ✅ Use Python 3.12 instead (see Step 1)
- Multiple Python versions can coexist safely

### Memory Issues
- AI analysis requires 4GB+ RAM
- For large videos, consider reducing video resolution
- Monitor system resources during analysis

## 📝 Adding New Endpoints

1. Define Pydantic models for request/response
2. Add endpoint function with proper decorators
3. Implement database logic with error handling
4. Test in Swagger UI (`/docs`)
5. Update frontend API client

Example:
```python
@app.get("/api/example")
async def example_endpoint():
    try:
        result = supabase.table("table").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🧪 Testing the AI Analysis

### Quick Test (50 frames - ~4 minutes)
```bash
cd video_analysis/examples/soccer
python main.py \
    --source_video_path "data/2e57b9_0.mp4" \
    --target_video_path "test_output_50frames.mp4" \
    --max_frames 50 \
    --device cpu
```

### Full Analysis (500 frames - ~40 minutes)
```bash
cd video_analysis/examples/soccer
python main.py \
    --source_video_path "data/2e57b9_0.mp4" \
    --target_video_path "test_output_500frames.mp4" \
    --max_frames 500 \
    --device cpu
```

### Expected Outputs
- 📹 **Video**: Split-screen analysis with tactical board
- 📊 **Data**: Player positions and tracking data
- 📈 **Stats**: Match statistics and insights
- 📋 **Report**: Comprehensive analysis report

## 🎯 Future Enhancements

- [ ] Authentication with Supabase Auth
- [ ] Letta AI integration for tactical analysis
- [ ] Vapi voice assistant endpoint
- [ ] Video processing worker integration
- [ ] WebSocket for real-time job updates
- [ ] Rate limiting and caching
- [ ] Comprehensive error logging
- [ ] Basketball analysis support
- [ ] Real-time video streaming analysis

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Uvicorn Deployment](https://www.uvicorn.org/deployment/)
- [Roboflow Sports Repository](https://github.com/roboflow/sports)
- [Ultralytics YOLOv8](https://docs.ultralytics.com/)
- [Supervision Library](https://roboflow.github.io/supervision/)

## 🏆 For Judges & Developers

### System Requirements
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB for models, additional for videos
- **Python**: 3.8+ (tested with 3.13)
- **FFmpeg**: Required for video processing

### Key Features Demonstrated
1. **Chunked Video Upload** - Handles large video files efficiently
2. **AI-Powered Analysis** - Advanced computer vision for sports
3. **Real-time Processing** - Background job system with progress tracking
4. **Cross-platform Compatibility** - Works on Windows, Mac, and Linux
5. **Scalable Architecture** - FastAPI + Supabase + AI models
6. **Production Ready** - Error handling, logging, and monitoring

### Performance Metrics
- **Upload Speed**: 10MB chunks with progress tracking
- **Analysis Time**: 2-5 minutes for quick brief, 10-30 minutes for full analysis
- **Model Accuracy**: State-of-the-art YOLOv8 for object detection
- **Scalability**: Handles multiple concurrent video analyses
