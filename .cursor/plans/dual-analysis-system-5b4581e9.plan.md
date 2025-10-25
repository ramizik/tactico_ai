<!-- 5b4581e9-47f4-4a5a-aa0f-e7741cbdaeed ee393bf6-1a7c-4f86-9d38-19ac231aa083 -->
# Dual Analysis System Implementation Plan

## Overview

Implement parallel processing where users get quick insights from the first 5 minutes of their video within 1-2 minutes, while the full 90-minute analysis continues in the background. Both analyses use the same enhanced algorithm but produce separate outputs.

## Architecture Changes

### Database Schema Updates

**File: `migrations/dual_analysis_schema.sql`**

```sql
-- Add analysis scope to jobs table
ALTER TABLE jobs ADD COLUMN analysis_scope VARCHAR(20) DEFAULT 'full';
ALTER TABLE jobs ADD COLUMN video_segment_start INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN video_segment_end INTEGER;

-- Add scope to analyses table  
ALTER TABLE analyses ADD COLUMN analysis_scope VARCHAR(20) DEFAULT 'full';

-- Add scope to tracked_positions
ALTER TABLE tracked_positions ADD COLUMN analysis_scope VARCHAR(20) DEFAULT 'full';

-- Create index for faster scope queries
CREATE INDEX idx_jobs_scope ON jobs(match_id, analysis_scope);
CREATE INDEX idx_analyses_scope ON analyses(match_id, analysis_scope);
```

### Backend Implementation

**1. Chunk Upload Handler (`backend/main.py`)**

Modify the video chunk upload endpoint to trigger preview analysis after receiving enough chunks for 5 minutes:

```python
@app.post("/api/upload/video-chunk")
async def upload_video_chunk(...):
    # ... existing chunk save logic ...
    
    # Calculate if we have enough chunks for preview (5 minutes)
    PREVIEW_CHUNK_THRESHOLD = 10  # Approximately 5 minutes for 90-min video
    
    # Trigger preview analysis after threshold
    if chunk_index == PREVIEW_CHUNK_THRESHOLD - 1:
        # Check if preview job already exists
        existing_preview = supabase.table("jobs").select("id").eq("match_id", match_id).eq("analysis_scope", "preview").execute()
        
        if not existing_preview.data:
            preview_job_data = {
                "match_id": match_id,
                "status": "queued",
                "progress": 0,
                "job_type": "enhanced_analysis",
                "analysis_scope": "preview",
                "video_segment_start": 0,
                "video_segment_end": PREVIEW_CHUNK_THRESHOLD
            }
            supabase.table("jobs").insert(preview_job_data).execute()
            logger.info(f"Preview analysis job created for match {match_id}")
    
    # Trigger full analysis after all chunks
    if chunk_index == total_chunks - 1:
        # ... existing full analysis trigger ...
        job_data["analysis_scope"] = "full"
        job_data["video_segment_end"] = total_chunks
```

**2. Job Processor Updates (`backend/job_processor.py`)**

Update the job processor to handle both preview and full analyses concurrently:

```python
def _process_job(self, job: Dict):
    job_id = job["id"]
    match_id = job["match_id"]
    analysis_scope = job.get("analysis_scope", "full")
    
    if analysis_scope == "preview":
        # Process only first N chunks
        video_segment_end = job.get("video_segment_end", 10)
        result = self._process_preview_analysis(job_id, match_id, video_segment_end)
    else:
        # Process full video
        result = self._process_enhanced_analysis(job_id, match_id, match)

def _process_preview_analysis(self, job_id: str, match_id: str, segment_end: int):
    # Similar to full analysis but with limited chunks
    processor = VideoProcessor(device=self.device)
    
    # Combine only preview chunks
    combined_video_path = processor.combine_preview_chunks(
        team_id, match_id, segment_end
    )
    
    # Run enhanced analysis with preview scope
    video_path, analysis_results = processor.run_enhanced_analysis(
        combined_video_path, match_id, 
        analysis_scope="preview"
    )
```

**3. Video Processor Enhancements (`backend/video_processor.py`)**

Add methods for preview processing:

```python
def combine_preview_chunks(self, team_id: str, match_id: str, preview_chunks: int) -> str:
    """Combine only the first N chunks for preview analysis"""
    chunk_paths = []
    for i in range(preview_chunks):
        chunk_path = os.path.join("video_storage", team_id, match_id, "chunks", f"chunk_{i:03d}.mp4")
        if os.path.exists(chunk_path):
            chunk_paths.append(chunk_path)
    
    output_path = os.path.join("video_storage", team_id, match_id, "preview_video.mp4")
    self.merge_video_chunks(chunk_paths, output_path)
    return output_path

def run_enhanced_analysis(self, video_path: str, match_id: str, analysis_scope: str = "full") -> tuple:
    """Run enhanced analysis with scope parameter"""
    # Modify output paths based on scope
    output_prefix = "preview_" if analysis_scope == "preview" else ""
    output_path = os.path.join('backend', 'video_outputs', f'{output_prefix}enhanced_{match_id}.mp4')
    
    # Pass scope to the analysis script
    cmd.extend(['--analysis_scope', analysis_scope])
```

**4. Enhanced Analysis Script Updates (`enhanced_supabase_analysis.py`)**

Modify to handle analysis scope:

```python
def process_enhanced_video_analysis(..., analysis_scope: str = "full"):
    # Generate scope-specific outputs
    output_prefix = "preview_" if analysis_scope == "preview" else ""
    
    # Output paths
    target_path = os.path.join(video_output_dir, f'{output_prefix}enhanced_{match_id}.mp4')
    
    # Export file naming
    if exporter:
        exporter.set_prefix(output_prefix)
    
    # Store to database with scope
    position_batch.append({
        'analysis_scope': analysis_scope,
        # ... other fields ...
    })
```

### API Endpoints

**5. Dual Progress Endpoint (`backend/main.py`)**

```python
@app.get("/api/matches/{match_id}/analysis-status")
async def get_analysis_status(match_id: str):
    """Get status for both preview and full analyses"""
    
    # Get all jobs for this match
    jobs = supabase.table("jobs").select("*").eq("match_id", match_id).execute()
    
    status = {
        "preview": None,
        "full": None
    }
    
    for job in jobs.data:
        scope = job.get("analysis_scope", "full")
        status[scope] = {
            "job_id": job["id"],
            "status": job["status"],
            "progress": job["progress"],
            "error": job.get("error_message"),
            "updated_at": job["updated_at"]
        }
    
    # Get analysis results if completed
    analyses = supabase.table("analyses").select("*").eq("match_id", match_id).execute()
    
    for analysis in analyses.data:
        scope = analysis.get("analysis_scope", "full")
        if scope in status and status[scope]:
            status[scope]["has_results"] = True
    
    return status
```

### Frontend Updates

**6. Progress Tracking Component**

Create a component showing dual progress:

```typescript
// components/DualAnalysisProgress.tsx
const DualAnalysisProgress = ({ matchId }) => {
  const [status, setStatus] = useState({ preview: null, full: null });
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/matches/${matchId}/analysis-status`);
      const data = await response.json();
      setStatus(data);
      
      // Stop polling if both complete
      if (data.preview?.status === 'completed' && data.full?.status === 'completed') {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [matchId]);
  
  return (
    <div>
      <div>
        <h3>Quick Preview (5 minutes)</h3>
        <ProgressBar value={status.preview?.progress || 0} />
        {status.preview?.status === 'completed' && (
          <Button>View Preview Results</Button>
        )}
      </div>
      
      <div>
        <h3>Full Analysis (90 minutes)</h3>
        <ProgressBar value={status.full?.progress || 0} />
        {status.full?.status === 'completed' && (
          <Button>View Full Results</Button>
        )}
      </div>
    </div>
  );
};
```

### File Structure

```
video_storage/{team_id}/{match_id}/
├── chunks/
│   ├── chunk_000.mp4
│   ├── chunk_001.mp4
│   └── ...
├── preview_video.mp4     # Combined first 10 chunks
└── combined_video.mp4    # Full video

backend/video_outputs/
├── preview_enhanced_{match_id}.mp4
└── enhanced_{match_id}.mp4

backend/tracking_data/
├── preview_positions_*.csv
├── preview_summary_*.json
├── positions_*.csv
└── summary_*.json
```

## Implementation Strategy

### Phase 1: Database & Backend Infrastructure (2-3 hours)

1. Run database migrations to add scope fields
2. Update job processor for concurrent handling
3. Modify video processor for preview chunks

### Phase 2: Analysis Pipeline (2-3 hours)

1. Update chunk upload logic for preview trigger
2. Modify enhanced analysis script for scope handling
3. Test preview vs full processing

### Phase 3: API & Frontend (2-3 hours)

1. Create dual status endpoint
2. Build progress tracking component
3. Implement result switching UI

### Testing Approach

1. Upload a test video with known duration
2. Verify preview triggers after ~10 chunks
3. Confirm both analyses run concurrently
4. Check separate outputs are generated
5. Validate frontend shows both progress bars

## Key Benefits

- **Quick Insights**: Users see tactical analysis in 1-2 minutes instead of waiting 15-30 minutes
- **Progressive Enhancement**: Full analysis continues while users explore preview
- **Better UX**: Users can navigate away and return to check progress
- **Same Quality**: Both analyses use identical enhanced algorithm
- **Scalable**: Can extend to multiple preview segments if needed

### To-dos

- [ ] Update database schema to support dual analysis types with scope field
- [ ] Implement preview analysis trigger after receiving ~10 chunks in upload endpoint
- [ ] Modify job processor to handle preview and full jobs concurrently
- [ ] Add preview video processing methods to combine and analyze partial chunks
- [ ] Add analysis_scope parameter to enhanced analysis script for output differentiation
- [ ] Create API endpoint to return both preview and full analysis status
- [ ] Implement dual progress bars and result switching in frontend