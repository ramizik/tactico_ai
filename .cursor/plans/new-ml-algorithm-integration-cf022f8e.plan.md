<!-- cf022f8e-d807-4cbf-aade-28c8d3bc92d6 042b3ae4-aca1-4f16-9391-3c5ceb75b704 -->
# Integration Plan: New ML Algorithm

## Overview
Replace the current `video_analysis` module with the `new_analysis` algorithm, maintaining all existing functionality including chunked uploads, job processing, and database integration. Simplify to full analysis only (no preview).

## Key Changes

### 1. Create New Analysis Wrapper
**File**: `backend/new_analysis_processor.py` (new file)

Create a wrapper that:
- Accepts combined video path and match_id
- Calls `new_analysis/main.py` with appropriate parameters
- Captures tracking data (players, ball, teams, speeds, distances)
- Saves tracking data to Supabase `tracked_positions` table
- Creates analysis summary for `analyses` table
- Returns output video path and analysis data

Key features to implement:
- Import modules from `new_analysis/` directory
- Extract tracking data from the algorithm's output
- Map new algorithm's output to existing database schema
- Handle team colors and assignments
- Store speed/distance metrics in analysis summary
- Save output video to `backend/video_outputs/enhanced_{match_id}.avi`

### 2. Update Video Processor
**File**: `backend/video_processor.py`

Changes needed:
- Remove `run_enhanced_analysis()` method that calls old `video_analysis` module
- Add new `run_new_analysis()` method that calls `new_analysis_processor.py`
- Keep chunk combining functionality (already works)
- Remove preview-related methods (`combine_preview_chunks()`, etc.)
- Update device validation (already compatible)

### 3. Update Job Processor
**File**: `backend/job_processor.py`

Changes needed:
- Remove preview analysis handling (`_process_preview_analysis()` method)
- Update `_process_enhanced_analysis()` to call new algorithm via video_processor
- Remove preview job prioritization logic
- Simplify to single job type: full analysis
- Remove `analysis_scope` parameter handling
- Set `max_concurrent_jobs=1` (no parallel preview/full)

### 4. Update API Endpoints
**File**: `backend/main.py`

Changes needed:
- Remove preview job creation in `upload_video_chunk()` endpoint
- Remove `analysis_scope` from job creation
- Simplify `/api/matches/{match_id}/analysis-status` to return single status (not dual)
- Update job data structure to remove preview-related fields
- Keep full analysis job creation on last chunk upload

### 5. Copy Model File
**Files**: `new_analysis/models/best.pt`

Action:
- Ensure YOLO model is accessible at `new_analysis/models/best.pt`
- Document model path in configuration

### 6. Update Requirements
**File**: `backend/requirements.txt`

Add missing dependencies from `new_analysis/requirements.txt`:
- Ensure PyTorch compatibility
- Add scikit-learn (for team assignment K-means)
- Verify supervision and ultralytics versions match

### 7. Update Database Schema (Optional Cleanup)
**Files**: `migrations/dual_analysis_schema.sql`

Optional:
- Remove `analysis_scope` column from jobs table (backward compatible - leave for now)
- Remove `video_segment_start/end` columns (backward compatible - leave for now)
- Document that these fields are deprecated but kept for compatibility

### 8. Update Documentation
**Files**: `documentation/*.md`

Updates:
- Mark DUAL_ANALYSIS_SYSTEM.md as deprecated
- Update QUICK_START.md to reflect new algorithm
- Document new algorithm's capabilities and limitations

## File Structure After Integration

```
backend/
├── new_analysis_processor.py     (NEW - wrapper for new algorithm)
├── video_processor.py            (UPDATED - use new processor)
├── job_processor.py              (UPDATED - remove preview)
├── main.py                       (UPDATED - simplify API)
├── video_outputs/
│   └── enhanced_{match_id}.avi   (output from new algorithm)
└── tracking_data/
    ├── positions_{timestamp}.csv  (tracking data export)
    └── summary_{timestamp}.json   (analysis summary)

new_analysis/                      (USED AS-IS)
├── main.py
├── models/best.pt
├── trackers/
├── team_assigner/
├── speed_and_distance_estimator/
└── ...
```

## Data Flow

```
User uploads video chunks
    ↓
All chunks received
    ↓
Job created (type: enhanced_analysis, scope: full)
    ↓
Job processor picks up job
    ↓
Combine chunks → combined_video.mp4
    ↓
Call new_analysis_processor.py
    ↓
new_analysis/main.py processes video
    ↓
Extract tracking data, speeds, teams
    ↓
Save to Supabase (tracked_positions, analyses)
    ↓
Save output video locally (.avi)
    ↓
Job completed
```

## Implementation Steps

### Phase 1: Create Wrapper (Core)
1. Create `new_analysis_processor.py` with Supabase integration
2. Test standalone with sample video
3. Verify database writes

### Phase 2: Update Processors
4. Update `video_processor.py` to use new processor
5. Remove preview analysis code
6. Test chunk combining + new analysis

### Phase 3: Update Job System
7. Update `job_processor.py` to remove preview logic
8. Simplify job creation in `main.py`
9. Test full job flow

### Phase 4: Cleanup & Testing
10. Update requirements.txt
11. Update documentation
12. End-to-end testing with real upload

## Backward Compatibility

**Preserved:**
- Chunked upload API (unchanged)
- Database schema (unchanged)
- Job status polling (simplified but compatible)
- Local video storage structure

**Removed:**
- Preview analysis (user requirement)
- Dual progress tracking (single job only)
- Analysis scope parameter (always "full")

**Changed:**
- ML algorithm (new_analysis replaces video_analysis)
- Output format (.avi instead of .mp4)
- Tracking data richness (may have different fields)

## Testing Strategy

1. **Unit test**: new_analysis_processor with sample video
2. **Integration test**: Full upload → job → output
3. **Database test**: Verify tracked_positions and analyses data
4. **API test**: Confirm frontend still works
5. **Performance test**: Compare processing times

## Rollback Plan

If integration fails:
1. Keep old `video_analysis` code (don't delete, just stop using)
2. Revert changes to video_processor.py, job_processor.py, main.py
3. Re-enable preview analysis if needed
4. Old algorithm still available as fallback

### To-dos

- [ ] Create new_analysis_processor.py wrapper with Supabase integration
- [ ] Update video_processor.py to use new algorithm, remove preview methods
- [ ] Update job_processor.py to remove preview analysis logic
- [ ] Update main.py API endpoints to remove preview job creation
- [ ] Merge requirements from new_analysis into backend requirements.txt
- [ ] End-to-end testing with video upload and processing