# ML Analysis Algorithm Integration

## Overview

As of this integration, TacticoAI uses a comprehensive ML analysis algorithm from the `ml_analysis/` module. This algorithm provides comprehensive player tracking, team assignment, ball possession analysis, and speed/distance metrics.

## Key Changes

### Algorithm Switch

**Previous**: Split-screen enhanced analysis with Supabase integration (from `video_analysis` module)
**Current**: Comprehensive tracking algorithm (from `ml_analysis` module)

### Features

The new algorithm provides:

1. **Player Detection & Tracking**: YOLO-based object detection with ByteTrack tracking
2. **Team Assignment**: Automatic team classification using K-means color clustering
3. **Ball Possession Tracking**: Real-time ball assignment to players
4. **Speed & Distance Calculation**: Player movement analysis in real-world units
5. **Camera Movement Compensation**: Optical flow-based camera stabilization
6. **Perspective Transformation**: Convert pixel coordinates to real-world measurements

### Architecture Changes

#### Removed Features
- **Preview Analysis**: No longer generating quick 5-minute preview
- **Dual Progress Tracking**: Single job processing instead of preview + full
- **Split-screen Output**: Now generates single annotated video

#### New Components

**`backend/ml_analysis_processor.py`**: Wrapper that integrates the ML algorithm with Supabase
- Processes video using `ml_analysis` modules
- Extracts tracking data (players, ball, teams, speeds, distances)
- Saves data to Supabase `tracked_positions` and `analyses` tables
- Returns output video path and analysis summary

**Updated Components**:
- `backend/video_processor.py`: Replaced `run_enhanced_analysis()` with `run_ml_analysis()`
- `backend/job_processor.py`: Simplified to single job type (full analysis only)
- `backend/main.py`: Removed preview job creation, simplified analysis status endpoint

## Data Flow

```
User uploads video chunks
    ↓
All chunks received
    ↓
Job created (type: enhanced_analysis)
    ↓
Job processor picks up job
    ↓
Combine chunks → combined_video.mp4
    ↓
ml_analysis_processor.py
    ↓
ml_analysis algorithm processes video
    ├── Player detection & tracking
    ├── Team assignment (K-means clustering)
    ├── Ball possession analysis
    ├── Speed & distance calculation
    ├── Camera movement compensation
    └── View transformation
    ↓
Extract tracking data
    ↓
Save to Supabase
    ├── tracked_positions table (per-frame data)
    └── analyses table (summary)
    ↓
Save output video locally (.avi)
    ↓
Job completed
```

## Database Schema

### tracked_positions Table

Stores per-frame tracking data for players and ball:

```sql
- match_id: UUID (FK to matches)
- frame_number: INTEGER
- timestamp: FLOAT (seconds)
- object_type: VARCHAR ('player' or 'ball')
- tracker_id: INTEGER (player ID or -1 for ball)
- team_id: INTEGER (1 or 2, NULL for ball)
- x, y: FLOAT (pixel coordinates)
- x_transformed, y_transformed: FLOAT (real-world coordinates)
- speed: FLOAT (km/h)
- distance: FLOAT (meters)
- has_ball: BOOLEAN
```

### analyses Table

Stores match analysis summary:

```sql
- match_id: UUID (FK to matches)
- summary: TEXT
- tactical_insights: TEXT
- metrics: JSONB (possession %, speeds, etc.)
- events: JSONB (key match events)
- formation: JSONB (team formations)
```

## Output Files

### Video Output
- **Path**: `video_outputs/processed_{match_id}.avi`
- **Format**: AVI (XVID codec)
- **Content**: Annotated video with:
  - Player tracking ellipses
  - Team color coding
  - Ball position tracking
  - Speed and distance overlays
  - Possession indicators
  - Camera movement compensation

### Analysis Data
- Stored in Supabase (no local CSV/JSON files by default)
- Can be retrieved via API endpoints

## API Endpoints

### Get Analysis Status (Updated)

```http
GET /api/matches/{match_id}/analysis-status
```

**Response** (Simplified):
```json
{
  "job_id": "uuid",
  "status": "completed",
  "progress": 100,
  "has_results": true,
  "analysis_id": "uuid",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Status Values**:
- `no_job`: No analysis job exists
- `queued`: Job waiting to be processed
- `running`: Currently processing
- `completed`: Analysis complete
- `failed`: Processing failed
- `cancelled`: Job was cancelled

### Other Endpoints (Unchanged)
- `/api/upload/video-chunk`: Upload video chunks
- `/api/matches/{match_id}/upload-status`: Get upload progress
- `/api/matches/{match_id}/analysis`: Get analysis results
- `/api/jobs/{job_id}`: Get job status

## Configuration

### Environment Variables

```bash
# Job concurrency (optional)
MAX_CONCURRENT_JOBS=1  # Single job processing
# Note: YOLO automatically detects and uses GPU if available

# Supabase (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Model Requirements

The new algorithm requires the YOLO model:
- **Path**: `ml_analysis/models/best.pt`
- **Type**: YOLOv5/v8 trained for football detection
- **Classes**: player, goalkeeper, referee, ball

## Performance

### Processing Times (Approximate)

| Video Length | Resolution | CPU (8 cores) | GPU (CUDA) |
|--------------|------------|---------------|------------|
| 1 minute     | 1080p      | 3-5 min       | 1-2 min    |
| 5 minutes    | 1080p      | 15-25 min     | 5-10 min   |
| 90 minutes   | 1080p      | 3-4 hours     | 45-90 min  |

### System Requirements
- **Minimum**: 8GB RAM, 4-core CPU
- **Recommended**: 16GB RAM, 8-core CPU or GPU
- **Storage**: 3-5x video size for processing

## Migration Notes

### Breaking Changes
- **No Preview Analysis**: Only full analysis is performed
- **Output Format**: `.avi` instead of `.mp4`
- **Processing Time**: Full analysis takes longer (no quick preview)

### Backward Compatibility
- **API**: All upload and job endpoints remain compatible
- **Database**: Existing tables unchanged (deprecated columns kept)
- **Frontend**: May need to handle single job status (not dual preview/full)

### Deprecated Fields

These fields remain in database but are no longer used:
- `jobs.analysis_scope` (always NULL or 'full')
- `jobs.video_segment_start` (always 0)
- `jobs.video_segment_end` (always NULL)
- `analyses.analysis_scope` (always NULL or 'full')
- `tracked_positions.analysis_scope` (always NULL or 'full')

## Troubleshooting

### Model Not Found
```
FileNotFoundError: YOLO model not found at ml_analysis/models/best.pt
```
**Solution**: Ensure the YOLO model file exists at the correct path.

### Import Errors
```
ModuleNotFoundError: No module named 'trackers'
```
**Solution**: Verify `ml_analysis/` directory is in the correct location and all modules have `__init__.py` files.

### Memory Issues
```
Out of memory during processing
```
**Solution**:
- Use smaller batch sizes
- Process shorter video segments
- Use GPU instead of CPU
- Increase available RAM

### Slow Processing
**Solutions**:
- GPU automatically detected and used by YOLO if available (10-50x faster)
- Ensure CUDA is properly installed
- Use stub caching for repeated processing

## Testing

### Unit Test: New Analysis Processor
```bash
cd backend
python ml_analysis_processor.py --video_path ../ml_analysis/input_videos/sample.mp4 --match_id test-match-123
```

### Integration Test: Full Pipeline
1. Upload video via frontend or API
2. Monitor job status: `/api/matches/{match_id}/analysis-status`
3. Verify output video: `video_outputs/processed_{match_id}.avi`
4. Check database: Query `tracked_positions` and `analyses` tables

### Performance Test
```bash
# Time the processing
time python ml_analysis_processor.py --video_path video.mp4 --match_id test
```

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review job status: `/api/debug/jobs`
- Database queries: See troubleshooting section
- Rollback: See `documentation/ROLLBACK.md` (if needed)
