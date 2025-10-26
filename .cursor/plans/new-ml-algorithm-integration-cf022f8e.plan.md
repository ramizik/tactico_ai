<!-- cf022f8e-d807-4cbf-aade-28c8d3bc92d6 42591be3-c027-46fb-b258-a24144d4a752 -->
# Debug and Fix Video Processing Error

## Problem
ML analysis fails with "object of type 'NoneType' has no len()" when trying to process videos. Need to debug the actual error source and ensure video serving works.

## Investigation Steps

### 1. Add Debug Logging to Trace the Issue
**File: `backend/job_processor.py`**
- Add logging before calling `run_ml_analysis_from_chunks` to show team_id, match_id, and total_chunks
- Log the return values from `run_ml_analysis_from_chunks`

**File: `backend/video_processor.py`**
- In `combine_local_chunks`: Log each chunk path being checked and whether it exists
- In `merge_video_chunks`: Add logging for FFmpeg command execution and success/failure
- In `run_ml_analysis_from_chunks`: Log the combined_video_path value before passing to run_ml_analysis

**File: `backend/ml_analysis_processor.py`**
- Add try-except around the `read_video` call with detailed error logging
- Log the exact exception type and message if video reading fails

### 2. Check FFmpeg Merge Success
The `merge_video_chunks` method may be silently failing. Need to verify:
- FFmpeg command execution returns success
- Output file actually exists after merge
- Output file has non-zero size

### 3. Fix Video Serving Endpoint
**File: `backend/main.py`**
- The existing endpoint `/api/matches/{match_id}/processed-video` should work
- Verify it returns the file from `video_outputs/processed_{match_id}.avi`
- Add logging to show what file path is being served

### 4. Test Flow
Once logging is added, run through the upload process and check logs for:
- Where exactly the None value originates
- Whether chunks combine successfully  
- Whether the combined video file exists and has content
- Whether read_video is actually being called with a valid path

## Expected Outcome
After adding comprehensive logging, we'll see exactly where the process fails and can apply the targeted fix.


### To-dos

- [ ] Create new_analysis_processor.py wrapper with Supabase integration
- [ ] Update video_processor.py to use new algorithm, remove preview methods
- [ ] Update job_processor.py to remove preview analysis logic
- [ ] Update main.py API endpoints to remove preview job creation
- [ ] Merge requirements from new_analysis into backend requirements.txt
- [ ] End-to-end testing with video upload and processing