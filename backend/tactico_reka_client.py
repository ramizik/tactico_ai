"""
Reka AI Client Service
Handles communication with Reka AI API for TacticoAI video analysis
"""

import os
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import httpx
import asyncio
import json
import time

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class TacticoRekaClient:
    """Client for interacting with Reka AI"""
    
    def __init__(self):
        self.api_key = os.getenv("REKA_API_KEY")
        self.base_url = "https://vision-agent.api.reka.ai"
        
        if not self.api_key:
            logger.warning("REKA_API_KEY not found in environment variables")
            return
            
        logger.info("Reka client initialized successfully")
    
    def _extract_text_from_sections(self, data: Any) -> str:
        """
        Extract readable text from Reka's sections structure
        
        Args:
            data: The response data (dict or string)
            
        Returns:
            Clean text commentary (without timestamps)
        """
        if not isinstance(data, dict):
            return str(data)
        
        # Handle sections structure
        if 'sections' in data:
            sections = data['sections']
            text_parts = []
            
            for section in sections:
                section_type = section.get('section_type', '')
                section_content = section.get('section_content')
                
                if section_type == 'markdown' and isinstance(section_content, str):
                    text_parts.append(section_content)
                elif section_type == 'video-clips-info' and isinstance(section_content, dict):
                    video_clips = section_content.get('video_clips', [])
                    for clip in video_clips:
                        clip_info = clip.get('video_clip_info', '')
                        if clip_info:
                            # Add just the commentary text without timestamps
                            text_parts.append(clip_info)
            
            return '\n\n'.join(text_parts)
        
        # If no sections, try to extract text from other structures
        text_parts = []
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 10:
                text_parts.append(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str) and len(item) > 10:
                        text_parts.append(item)
        
        return '\n\n'.join(text_parts) if text_parts else str(data)
    
    async def analyze_by_id(self, video_id: str, prompt: str) -> Optional[str]:
        """
        Analyze a video by its ID
        
        Args:
            video_id: Video ID from upload
            prompt: Analysis prompt
            
        Returns:
            Analysis text or None if failed
        """
        if not self.api_key:
            logger.error("REKA_API_KEY not configured")
            return None
            
        try:
            payload = {
                "video_id": video_id,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            headers = {
                'X-Api-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/qa/chat",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract text from various response formats
                    if isinstance(result, dict):
                        # Try different fields that might contain the commentary
                        if 'answer' in result and result['answer']:
                            commentary = result['answer']
                            # Handle JSON string response
                            if isinstance(commentary, str) and (commentary.startswith('{') or commentary.startswith('[')):
                                try:
                                    parsed = json.loads(commentary)
                                    return self._extract_text_from_sections(parsed)
                                except:
                                    pass
                            return commentary
                        elif 'chat_response' in result and result['chat_response']:
                            commentary = result['chat_response']
                            # Handle JSON string response
                            if isinstance(commentary, str) and (commentary.startswith('{') or commentary.startswith('[')):
                                try:
                                    parsed = json.loads(commentary)
                                    return self._extract_text_from_sections(parsed)
                                except:
                                    pass
                            return commentary
                        elif 'text' in result and result['text']:
                            return result['text']
                    
                    # If result itself is the sections structure
                    return self._extract_text_from_sections(result) if isinstance(result, dict) else str(result)
                else:
                    logger.error(f"Analysis failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Failed to analyze video by ID: {e}")
            return None
    
    async def upload_video_only(self, video_path: str) -> Optional[str]:
        """
        Upload a video and return the video_id without analyzing
        
        Args:
            video_path: Path to the video file
            
        Returns:
            video_id or None if failed
        """
        if not self.api_key:
            logger.error("REKA_API_KEY not configured")
            return None
            
        try:
            video_filename = os.path.basename(video_path)
            
            # Determine content type
            content_type = 'video/mp4'
            if video_path.lower().endswith('.mov'):
                content_type = 'video/quicktime'
            elif video_path.lower().endswith('.avi'):
                content_type = 'video/x-msvideo'
            
            # Prepare upload data
            data = {
                "index": True,
                "enable_thumbnails": False,
                "video_name": video_filename.replace('.', '_')
            }
            
            headers = {
                'X-Api-Key': self.api_key
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                with open(video_path, 'rb') as video_file:
                    files = {
                        'file': (video_filename, video_file, content_type)
                    }
                    
                    upload_response = await client.post(
                        f"{self.base_url}/videos/upload",
                        files=files,
                        data=data,
                        headers=headers
                    )
                
                if upload_response.status_code != 200:
                    logger.error(f"Video upload failed: {upload_response.status_code} - {upload_response.text}")
                    return None
                
                upload_result = upload_response.json()
                video_id = upload_result.get('video_id')
                
                if video_id:
                    logger.info(f"Video uploaded successfully with ID: {video_id}")
                    return video_id
                else:
                    logger.error(f"No video_id in upload response: {upload_result}")
                    return None
                    
        except Exception as e:
            logger.error(f"Failed to upload video: {e}")
            return None

# Global instance
reka_client = TacticoRekaClient()
