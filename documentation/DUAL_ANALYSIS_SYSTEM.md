# Dual Analysis System (DEPRECATED)

> **⚠️ DEPRECATED**: This dual analysis system has been replaced with a new single-analysis approach using an improved ML algorithm. See `ML_ANALYSIS_INTEGRATION.md` for current implementation.

## Overview

The Dual Analysis System provides users with **progressive analysis results** during video upload and processing. Instead of waiting 15-30 minutes for complete analysis of a 90-minute match, users receive quick tactical insights from the first 5 minutes within 1-2 minutes, while the full analysis continues in the background.

## Architecture

### Key Components

1. **Preview Analysis** - Analyzes first ~5 minutes (10 chunks)
2. **Full Analysis** - Analyzes complete 90-minute video
3. **Concurrent Processing** - Both analyses run simultaneously using the same enhanced algorithm
4. **Dual Progress Tracking** - Frontend displays separate progress for each analysis

## How It Works

### Video Upload Flow

```
User uploads 90-min video
    ↓
Chunks 0-9 received (first 5 minutes)
    ↓
Preview Analysis Job Created (queued)
    ↓
Chunks 10-99 continue uploading
    ↓
Preview Analysis Processing (1-2 minutes)
    ↓
All chunks received
    ↓
Full Analysis Job Created (queued)
    ↓
Full Analysis Processing (15-30 minutes)
```

### Database Schema

#### jobs Table (New Columns)

```sql
analysis_scope VARCHAR(20) DEFAULT 'full'  -- 'preview' or 'full'
video_segment_start INTEGER DEFAULT 0      -- Starting chunk index
video_segment_end INTEGER                  -- Ending chunk index
```

#### analyses Table (New Column)

```sql
analysis_scope VARCHAR(20) DEFAULT 'full'  -- Links to job scope
```

#### tracked_positions Table (New Column)

```sql
analysis_scope VARCHAR(20) DEFAULT 'full'  -- Separates preview/full data
```

### File Structure

```
video_storage/{team_id}/{match_id}/
├── chunks/
│   ├── chunk_000.mp4 ... chunk_009.mp4  (Preview)
│   └── chunk_010.mp4 ... chunk_099.mp4  (Full)
├── preview_video.mp4                     (Combined preview)
└── combined_video.mp4                    (Complete video)

backend/video_outputs/
├── preview_enhanced_{match_id}.mp4       (Preview analysis output)
└── enhanced_{match_id}.mp4               (Full analysis output)

backend/tracking_data/
├── preview_positions_{timestamp}.csv     (Preview tracking data)
├── preview_summary_{timestamp}.json      (Preview summary)
├── positions_{timestamp}.csv             (Full tracking data)
└── summary_{timestamp}.json              (Full summary)
```

## API Endpoints

### Get Dual Analysis Status

```http
GET /api/matches/{match_id}/analysis-status
```

**Response:**

```json
{
  "preview": {
    "job_id": "uuid",
    "status": "completed",
    "progress": 100,
    "has_results": true,
    "analysis_id": "uuid",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "full": {
    "job_id": "uuid",
    "status": "running",
    "progress": 45,
    "has_results": false,
    "updated_at": "2024-01-01T12:05:00Z"
  }
}
```

### Job Types

Both preview and full analysis use the same job type with different scopes:

```json
{
  "job_type": "enhanced_analysis",
  "analysis_scope": "preview",  // or "full"
  "video_segment_start": 0,
  "video_segment_end": 10
}
```

## Frontend Integration

### Using the DualAnalysisProgress Component

```tsx
import DualAnalysisProgress from '@/components/DualAnalysisProgress';

function MatchPage({ matchId }) {
  return (
    <DualAnalysisProgress
      matchId={matchId}
      onPreviewComplete={() => {
        console.log('Preview ready!');
        // Show notification, enable preview tab, etc.
      }}
      onFullComplete={() => {
        console.log('Full analysis ready!');
        // Show notification, enable full analysis tab, etc.
      }}
    />
  );
}
```

### Polling Strategy

- **Preview**: Poll every 2 seconds (faster completion expected)
- **Full**: Poll every 2 seconds (same endpoint)
- **Auto-stop**: Polling stops when both analyses complete or fail

## Configuration

### Preview Chunk Threshold

Adjust in `backend/main.py`:

```python
PREVIEW_CHUNK_THRESHOLD = 10  # ~5 minutes for 90-min video

# For different video lengths:
# - 45-min video: Use 10 chunks (10% of total)
# - 60-min video: Use 10 chunks (10% of total)
# - 120-min video: Use 10 chunks (5% of total)
```

### Processing Device

Set in `.env`:

```bash
ANALYSIS_DEVICE=cpu   # or 'cuda' or 'mps'
```

## User Experience Benefits

### Before Dual Analysis

1. User uploads 90-min video
2. Waits 15-30 minutes
3. Views complete analysis

**Problem**: Long wait time, no intermediate feedback

### After Dual Analysis

1. User uploads 90-min video
2. Preview ready in 1-2 minutes ✓
3. Views tactical insights immediately
4. Full analysis completes in background
5. Receives notification when full analysis ready

**Benefits**:
- Immediate tactical feedback
- Better user engagement
- Progressive enhancement
- Can navigate away and return

## Processing Times

| Analysis Type | Video Length | Processing Time | Output |
|--------------|--------------|-----------------|--------|
| Preview | 5 minutes | 1-2 minutes | Quick insights, player tracking |
| Full | 90 minutes | 15-30 minutes | Complete analysis, all metrics |

*Times vary based on hardware (CPU/GPU) and video quality*

## Migration Guide

### For Existing Matches

Run the database migration:

```sql
-- Apply schema updates
\i migrations/dual_analysis_schema.sql
```

Existing jobs will default to `analysis_scope='full'` for backward compatibility.

### Testing the System

1. **Upload Test Video**
   ```bash
   # Upload a test video with at least 10 chunks
   curl -X POST http://localhost:8000/api/upload/video-chunk \
     -F "file=@chunk_000.mp4" \
     -F "chunk_index=0" \
     -F "total_chunks=50" \
     -F "match_id=YOUR_MATCH_ID" \
     -F "team_id=YOUR_TEAM_ID"
   ```

2. **Verify Preview Job Creation**
   ```bash
   # After uploading chunk 9 (index 9)
   curl http://localhost:8000/api/matches/YOUR_MATCH_ID/analysis-status
   # Should show preview job queued/running
   ```

3. **Check Progress**
   - Open frontend at `/matches/YOUR_MATCH_ID`
   - Observe dual progress bars
   - Verify preview completes first
   - Verify full analysis continues

## Troubleshooting

### Preview Not Triggering

**Issue**: Preview job not created after 10 chunks

**Solutions**:
1. Check chunk upload logs: `tail -f backend/logs/upload.log`
2. Verify chunk_index is exactly 9 (0-indexed)
3. Check database: `SELECT * FROM jobs WHERE match_id='...' AND analysis_scope='preview'`

### Both Jobs Running Slowly

**Issue**: Job processor bottleneck

**Solutions**:
1. Check CPU/GPU usage
2. Consider reducing preview threshold
3. Increase job processor workers (future enhancement)

### Frontend Not Polling

**Issue**: Status not updating

**Solutions**:
1. Check browser console for API errors
2. Verify API URL in `.env`: `VITE_API_URL`
3. Check CORS configuration in backend

## Future Enhancements

1. **Multiple Preview Segments**
   - Preview at 5 min, 15 min, 30 min intervals
   - Progressive refinement of analysis

2. **Adaptive Thresholds**
   - Calculate preview chunks based on video metadata
   - Adjust for different video lengths automatically

3. **Streaming Results**
   - WebSocket for real-time updates
   - Incremental position data delivery

4. **Priority Queue**
   - Process preview jobs with higher priority
   - Background processing for full analysis

## Performance Metrics

Expected performance on different hardware:

| Hardware | Preview (5 min) | Full (90 min) |
|----------|-----------------|---------------|
| CPU (8 cores) | 2-3 minutes | 25-35 minutes |
| GPU (CUDA) | 1-1.5 minutes | 10-15 minutes |
| Apple Silicon (MPS) | 1.5-2 minutes | 15-20 minutes |

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review job status: `/api/debug/jobs`
- Database queries: See troubleshooting section
