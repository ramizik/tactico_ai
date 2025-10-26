# TacticoAI

AI-powered tactical analysis for college sports teams. Upload game footage and get comprehensive player tracking, team analysis, and tactical insights.

## 🚀 Quick Start

See [documentation/QUICK_START.md](documentation/QUICK_START.md) for setup instructions.

## 📚 Documentation

- **[Quick Start Guide](documentation/QUICK_START.md)**: Setup and installation
- **[ML Analysis Integration](documentation/ML_ANALYSIS_INTEGRATION.md)**: Current ML algorithm details
- **[Integration Summary](documentation/INTEGRATION_SUMMARY.md)**: Recent changes and migration guide
- **[Data Structures](documentation/DATA_STRUCTURES.md)**: Database schema
- **[Frontend Integration](documentation/FRONTEND_INTEGRATION.md)**: API reference
- **[Supabase Structure](documentation/SUPABASE_STRUCTURE.md)**: Database setup

## 🎯 Features

### Current Implementation (New ML Algorithm)

- **Player Detection & Tracking**: YOLO-based object detection with ByteTrack
- **Team Assignment**: Automatic jersey color clustering (K-means)
- **Ball Possession**: Real-time ball ownership tracking
- **Speed & Distance**: Real-world metrics with camera compensation
- **Perspective Transformation**: Convert pixel to field coordinates
- **Comprehensive Data Export**: Per-frame tracking saved to database

### Output

- Annotated video with player tracking, team colors, ball possession
- Per-frame position data (players, ball, speeds, distances)
- Analysis summary with team statistics and metrics
- Local video files (.avi format)

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
Backend API (FastAPI)
    ↓
Job Processor (Background worker)
    ↓
ML Analysis Algorithm (ml_analysis/)
    ├── YOLO Detection
    ├── ByteTrack Tracking
    ├── Team Assignment
    ├── Ball Possession
    ├── Speed/Distance
    └── Camera Compensation
    ↓
Supabase (PostgreSQL + Storage)
```

## 🔧 Technology Stack

### Backend
- **FastAPI**: REST API server
- **PyTorch**: ML framework
- **YOLO**: Object detection
- **OpenCV**: Video processing
- **NumPy/Pandas**: Data processing
- **scikit-learn**: K-means clustering
- **Supabase**: Database and storage

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool

### ML Algorithm
- **YOLOv5/v8**: Player/ball detection
- **ByteTrack**: Multi-object tracking
- **K-means**: Team color clustering
- **Optical Flow**: Camera movement
- **Perspective Transform**: Field mapping

## 📦 Project Structure

```
tactico_ai/
├── backend/
│   ├── main.py                      # FastAPI server
│   ├── job_processor.py             # Background job processing
│   ├── video_processor.py           # Video handling
│   ├── ml_analysis_processor.py    # ML algorithm wrapper
│   ├── video_outputs/               # Processed videos (.avi)
│   └── tracking_data/               # Export data (optional)
│
├── ml_analysis/                    # ML algorithm
│   ├── main.py                      # Analysis pipeline
│   ├── models/best.pt               # YOLO model
│   ├── trackers/                    # Object tracking
│   ├── team_assigner/               # Team classification
│   ├── speed_and_distance_estimator/
│   └── utils/                       # Helper functions
│
├── frontend/
│   ├── components/                  # React components
│   ├── lib/api.ts                   # API client
│   └── types/                       # TypeScript types
│
├── documentation/                   # Guides and references
└── migrations/                      # Database migrations
```

## 🚦 Getting Started

### Prerequisites
- Python 3.12 (NOT 3.13)
- Node.js 16+
- NVIDIA GPU (optional, 10-50x faster)
- Supabase account

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd tactico_ai
   ```

2. **Backend setup**
   ```bash
   cd backend
   python3.12 -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows

   # Install PyTorch with GPU (optional)
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   # Set ANALYSIS_DEVICE=cuda (or cpu/mps)
   ```

4. **Frontend setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Run application**
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn main:app --reload

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

6. **Access application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📊 Usage

1. **Upload Video**: Upload match footage via web interface
2. **Processing**: Background job analyzes video (45-90 min for 90-min match on GPU)
3. **View Results**: See player tracking, team statistics, and tactical insights
4. **Download**: Export analysis data or annotated video

## 🔍 API Endpoints

- `POST /api/upload/video-chunk`: Upload video chunks
- `GET /api/matches/{match_id}/upload-status`: Check upload progress
- `GET /api/matches/{match_id}/analysis-status`: Check analysis status
- `GET /api/matches/{match_id}/analysis`: Get analysis results
- `GET /api/matches/{match_id}/job`: Get job status

See [documentation/FRONTEND_INTEGRATION.md](documentation/FRONTEND_INTEGRATION.md) for complete API reference.

## 🛠️ Development

### Running Tests
```bash
cd backend
pytest
```

### Linting
```bash
cd backend
flake8 .
```

### Database Migrations
```bash
psql -d your_database -f migrations/MAIN_SCHEMA.sql
```

## 📝 Recent Changes

**New ML Algorithm Integration** (Latest)
- Replaced `video_analysis` module with `ml_analysis` algorithm
- Enhanced player tracking and team assignment
- Simplified to single analysis job (removed preview)
- See [documentation/INTEGRATION_SUMMARY.md](documentation/INTEGRATION_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Based on [abdullahtarek/football_analysis](https://github.com/abdullahtarek/football_analysis)
- YOLO by Ultralytics
- Supervision library for tracking utilities
- OpenCV for computer vision

## 📧 Support

For issues or questions:
- Check documentation in `documentation/`
- Review logs in `backend/logs/`
- Open an issue on GitHub

---

**Ready to analyze your game footage?** 🚀⚽
