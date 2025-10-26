# Hackathon Demo Setup Guide

## Problem Solved
The chunked upload validation was rejecting valid chunks because client-side MP4 chunks don't have individual headers. This is now fixed.

## Quick Start for Demo

### Option 1: Use Fixed Chunked Upload (Now Works!)
Your existing upload system now works with 90+ chunks. Just try uploading again - the validation is fixed.

### Option 2: Pre-Process Videos Offline (RECOMMENDED for Demo Stability)

If you want to prepare demo videos before the hackathon presentation:

#### Step 1: Get Your Team ID
```bash
# Check your Supabase database for your team ID
# Or create a new team through your app
```

#### Step 2: Process a Single Video
```bash
cd backend
python demo_video_processor.py \
  --video "C:\path\to\your\match_video.mp4" \
  --team-id "your-team-id-here" \
  --opponent "Real Madrid"
```

#### Step 3: Process Multiple Videos in Bulk
```bash
# Put all your demo videos in one folder
python demo_video_processor.py \
  --folder "C:\path\to\demo_videos" \
  --team-id "your-team-id-here"
```

This will:
1. Create match records in Supabase
2. Run ML analysis on each video
3. Generate processed videos with player tracking
4. Save analysis data to database
5. Print match IDs for each video

#### Step 4: Use in Demo
The videos are now ready! Just navigate to:
```
http://localhost:3000/matches/{match_id}
```

## What Changed in the Fix

### 1. Relaxed Validation (`video_processor.py`)
- Only validates MP4 header on **chunk 0** (which has the header)
- Other chunks are raw binary data (expected behavior)
- Still validates minimum size for all chunks

### 2. Added File Sync (`main.py`)
- Forces flush with `f.flush()` and `os.fsync()`
- Ensures chunks are fully written before proceeding

### 3. Smart Delays
- 3-second delay for 50+ chunks before merge
- Gives file system time to sync

### 4. Retry Logic
- Up to 3 merge attempts with delays
- Handles transient file system issues

## Demo Day Best Practices

### Before the Demo
1. **Pre-process 2-3 demo videos** using `demo_video_processor.py`
2. **Test the full flow** with those videos
3. **Take screenshots** of good analysis results
4. **Have backup data** in case of network issues

### During the Demo
1. **Show pre-processed matches** for consistent results
2. **Optionally demo live upload** if time permits
3. **Focus on the analysis results** and insights

### If Live Upload Fails During Demo
- Gracefully fallback to pre-processed videos
- Say: "We already analyzed this match earlier, let me show you the results"

## Troubleshooting

### If Processing Still Fails
```bash
# Check chunk 0 has valid header
python -c "
with open('path/to/chunk_000.mp4', 'rb') as f:
    header = f.read(32)
    print('Has ftyp:', b'ftyp' in header)
    print('Header:', header[:32])
"
```

### If FFmpeg Merge Fails
```bash
# Test FFmpeg manually
ffmpeg -i your_video.mp4 -c copy test_output.mp4
```

### Quick Status Check
```bash
# Check if analysis is running
curl http://localhost:8000/api/matches/{match_id}/analysis-status
```

## Time Estimates
- Single video processing: ~5-15 minutes (depending on video length)
- 90-chunk upload: ~2-5 minutes upload + 5-15 minutes processing
- Pre-processing 3 videos: ~30-45 minutes total

## Recommended Demo Flow
1. **Start**: "We've built TacticoAI to analyze soccer matches using computer vision"
2. **Show upload UI**: "Coaches can upload match videos through our web interface"
3. **Show pre-processed match**: "Here's a match we analyzed earlier..."
4. **Walk through analysis**: Show player tracking, heatmaps, tactical insights
5. **Highlight key features**: AI insights, video annotations, statistics
6. **Optionally demo live upload**: If confident and have time

Good luck with your demo! 🚀⚽
