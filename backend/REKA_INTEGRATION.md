# Reka AI Integration - TacticoAI

## Overview

This is a temporary integration of Reka AI for video analysis in the TacticoAI application. The feature allows users to upload sports videos and receive AI-generated analysis of the gameplay, tactics, and actions.

## Features

1. **Video Upload**: Users can upload video files (MP4, MOV, AVI formats)
2. **AI Analysis**: Reka AI analyzes the video and provides detailed insights
3. **Results Display**: Analysis results are displayed in a popup window
4. **Quick Access**: Available from the Dashboard with a "Try Reka AI" button

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
REKA_API_KEY=your_reka_api_key_here
```

### 2. Install Dependencies

The `reka-api` and `httpx` packages are already included in `requirements.txt`:

```bash
pip install reka-api httpx
```

## Architecture

### Backend Components

1. **tactico_reka_client.py**: Reka AI client service
   - Handles API communication with Reka AI
   - Supports async video analysis
   - Error handling and logging

2. **main.py**: API endpoint
   - `POST /api/reka/analyze-video`: Upload and analyze videos
   - Returns AI-generated analysis text

### Frontend Components

1. **RekaAnalysis.tsx**: Main UI component
   - File upload interface
   - Loading states
   - Results display
   - Error handling

2. **Dashboard.tsx**: Integration point
   - "Try Reka AI" button
   - Modal display

## Usage

### User Flow

1. User selects their university (UOP or UC California)
2. User is taken to the Dashboard
3. User clicks "Try Reka AI" button
4. User uploads a video file
5. User clicks "Analyze Video"
6. Analysis is displayed in a popup window

### API Endpoint

```http
POST /api/reka/analyze-video
Content-Type: multipart/form-data

file: <video_file>
prompt: <optional_custom_prompt>
```

**Note**: This endpoint uses Reka Vision API which requires two steps:
1. Upload the video to get a video_id
2. Send questions about the video using the video_id

**Response:**
```json
{
  "status": "success",
  "analysis": "Detailed analysis text...",
  "file_name": "video.mp4"
}
```

## Technical Details

### Video Processing

- Videos are temporarily stored in `temp_reka_uploads/` directory
- Files are automatically cleaned up after analysis
- Supports multiple video formats (MP4, MOV, AVI)

### Error Handling

- Validates API key configuration
- Handles file upload errors
- Displays user-friendly error messages
- Logs all errors to console

### Performance

- Async video analysis with 5-minute timeout
- Large video file support
- Responsive UI during processing

## Temporary Nature

This integration is **temporary** and is meant to:
1. Test Reka AI capabilities
2. Validate video analysis features
3. Gather user feedback
4. Evaluate if Reka AI should be permanently integrated

## Future Enhancements

Potential improvements:
- Save analysis results to database
- Allow users to view past analyses
- Add analysis export functionality
- Integrate with existing match analysis system
- Add video preview before analysis

## Troubleshooting

### API Key Issues

If you see "Reka AI not configured" error:
1. Check that `REKA_API_KEY` is set in `.env`
2. Restart the backend server
3. Check backend logs for initialization messages

### Upload Errors

If video upload fails:
1. Check file size (may be too large)
2. Verify file format is supported
3. Check network connection
4. Review backend logs for detailed error messages

### Analysis Timeout

If analysis takes too long:
1. Try a shorter video
2. Reduce video quality/resolution
3. Check Reka API status
4. Review timeout settings in code

## Files Modified

- `backend/tactico_reka_client.py` (new)
- `backend/main.py` (updated)
- `frontend/components/RekaAnalysis.tsx` (new)
- `frontend/components/Dashboard.tsx` (updated)

## API Documentation

Access interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
