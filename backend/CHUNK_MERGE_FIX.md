# Video Chunk Merge Fix for Large Files

## Problem
When uploading videos with many chunks (90+ chunks), FFmpeg was failing with the error:
```
[mov,mp4,m4a,3gp,3g2,mj2] moov atom not found
[concat] Impossible to open 'chunk_000.mp4'
```

## Root Cause - UPDATED
The real issue was a fundamental misunderstanding of how client-side chunking works:

1. **Client-side chunks are NOT individual MP4 files** - they're just binary slices of the original MP4
2. **FFmpeg's concat demuxer expects valid media files** - but chunks are just raw binary data
3. **Only when concatenated do chunks become a valid MP4** - the moov atom might be in the last chunk

When JavaScript does `blob.slice(start, end)` on a video file, it's just cutting raw bytes, not creating valid MP4 segments.

## Solutions Implemented

### 1. Force File System Sync on Upload
**File:** `backend/main.py`

Added explicit file flushing and OS sync when saving each chunk:
```python
with open(chunk_path, "wb") as f:
    f.write(chunk_content)
    f.flush()  # Flush Python buffer
    os.fsync(f.fileno())  # Force OS to write to disk
```

This ensures each chunk is fully written to disk before the upload endpoint returns success.

### 2. Changed to Binary Concatenation (KEY FIX)
**File:** `backend/video_processor.py` - `merge_video_chunks()`

Replaced FFmpeg concat demuxer with simple binary concatenation:
```python
# Binary concatenation - just combine raw bytes
with open(output_path, 'wb') as outfile:
    for chunk_path in chunk_paths:
        with open(chunk_path, 'rb') as chunk_file:
            outfile.write(chunk_file.read())
```

This works because client-side chunks are just binary slices that form a complete MP4 when joined.

### 3. Simplified Chunk Validation
**File:** `backend/video_processor.py` - `combine_local_chunks()`

Removed MP4 header validation since chunks aren't complete MP4 files:
- Only check for minimum file size (100 bytes)
- No header validation needed - chunks are just raw binary

### 4. Added Post-Merge Validation & Remux
**File:** `backend/video_processor.py` - `merge_video_chunks()`

After binary concatenation:
- Validates the combined file with FFmpeg
- If issues detected, remuxes with FFmpeg to fix structure
- Uses `-movflags +faststart` to ensure moov atom is at the beginning

## Testing Recommendations

1. **Test with small videos (< 50 chunks):** Should work as before, no delays added
2. **Test with large videos (90+ chunks):** Should now successfully merge with the added safeguards
3. **Monitor logs:** Check for validation errors or retry attempts

## Performance Impact

- **Small videos (< 50 chunks):** Minimal impact - only `fsync()` per chunk (~1-2ms overhead per chunk)
- **Large videos (50+ chunks):** 3-second delay before merge + potential retry delays (max 6 seconds if retries needed)
- **Total overhead:** ~3-9 seconds for videos with 50+ chunks - acceptable for 90-minute match videos

## Expected Behavior

With 90 chunks:
1. Chunks upload with proper file sync
2. 3-second delay before merge starts
3. Chunk validation ensures all files are complete
4. FFmpeg merge succeeds on first attempt (or retries if needed)
5. Combined video ready for ML analysis

## Monitoring

Watch for these log messages:
- ✅ `"Large chunk count (90), waiting 3 seconds for file system sync..."`
- ✅ `"Found and validated chunk X: path (size bytes)"`
- ✅ `"All 90 chunks found and validated successfully"`
- ✅ `"Video chunks merged successfully"`

If issues persist:
- Check `"Chunk X is too small"` - indicates upload truncation
- Check `"does not have valid MP4 header"` - indicates file corruption
- Check `"Detected 'moov atom not found' error, will retry"` - indicates timing issues (retries should resolve)
