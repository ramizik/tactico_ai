"""
Fish AI Text-to-Speech Client
Converts text to streaming audio using Fish AI API
"""

import os
import logging
import httpx
import base64
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Fish AI API configuration
FISH_AI_API_KEY = os.getenv("FISH_AI_API_KEY", "1f03239462174d28b5542be2c40e0598")
FISH_AI_MODEL_ID = os.getenv("FISH_AI_MODEL_ID", "77fb1472a0f54b358ef95fab9d80139a")
FISH_AI_API_URL = "https://api.fish.audio/v1/tts"


class FishTTSClient:
    """Client for Fish AI Text-to-Speech API"""

    def __init__(self):
        self.api_key = FISH_AI_API_KEY
        self.model_id = FISH_AI_MODEL_ID
        self.sample_rate = 44100
        self.format = "mp3"
        self.api_url = FISH_AI_API_URL
        
        logger.info("Fish TTS client initialized using REST API")

    def is_available(self) -> bool:
        """Check if Fish AI client is available"""
        return bool(self.api_key and self.model_id)

    async def stream_text_to_audio(self, text_content: str) -> Optional[bytes]:
        """
        Convert text to audio bytes using Fish AI REST API
        
        Args:
            text_content: The text to convert to speech
            
        Returns:
            bytes: Audio data in MP3 format, or None if failed
        """
        if not text_content or not text_content.strip():
            logger.warning("Empty text content provided to TTS")
            return None

        try:
            logger.info(f"Converting text to speech via Fish AI API ({len(text_content)} characters)")
            
            # Prepare request payload
            # CRITICAL: Use 'reference_id' parameter for custom voice
            payload = {
                "text": text_content,
                "format": "mp3",
                "reference_id": self.model_id  # ← THIS IS THE KEY!
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Make API request
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                )
                
                logger.info(f"Fish AI API response: {response.status_code}")
                
                if response.status_code == 200:
                    # Get audio data
                    audio_data = response.content
                    logger.info(f"Generated audio: {len(audio_data)} bytes")
                    return audio_data
                else:
                    error_text = response.text
                    logger.error(f"Fish AI API error: {response.status_code}")
                    logger.error(f"Response text: {error_text[:200]}")
                    return None
            
        except httpx.TimeoutException:
            logger.error("Fish AI API timeout")
            return None
        except Exception as e:
            logger.error(f"Fish AI TTS error: {type(e).__name__}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def extract_text_from_reka_response(self, reka_result: dict) -> str:
        """
        Extract and format text from Reka AI response for TTS
        
        Args:
            reka_result: The Reka AI analysis result
            
        Returns:
            str: Formatted text suitable for speech synthesis
        """
        text_parts = []
        
        # Extract different parts of the analysis
        if isinstance(reka_result, dict):
            # Summary
            if "summary" in reka_result:
                text_parts.append(f"Summary: {reka_result['summary']}")
            
            # Main text
            if "text" in reka_result:
                text_parts.append(reka_result['text'])
            
            # Tactical insights
            if "tactical_insights" in reka_result:
                insights = reka_result['tactical_insights']
                if isinstance(insights, list):
                    text_parts.append("Key Tactical Insights:")
                    for insight in insights:
                        if isinstance(insight, str):
                            text_parts.append(f"- {insight}")
                elif isinstance(insights, str):
                    text_parts.append(f"Tactical Insights: {insights}")
            
            # Recommendations
            if "recommendations" in reka_result:
                recommendations = reka_result['recommendations']
                if isinstance(recommendations, list):
                    text_parts.append("Recommendations:")
                    for rec in recommendations:
                        if isinstance(rec, str):
                            text_parts.append(f"- {rec}")
                elif isinstance(recommendations, str):
                    text_parts.append(f"Recommendations: {recommendations}")
        else:
            # If it's just a string
            text_parts.append(str(reka_result))
        
        # Combine all parts
        combined_text = "\n".join(text_parts)
        
        # Clean up and format
        combined_text = combined_text.replace('\n\n', '\n')
        combined_text = combined_text.strip()
        
        logger.info(f"Extracted {len(combined_text)} characters from Reka response")
        return combined_text

    def get_status(self) -> dict:
        """Get the current status of the Fish TTS client"""
        return {
            "available": self.is_available(),
            "api_key_set": bool(self.api_key),
            "model_id": self.model_id,
            "sample_rate": self.sample_rate,
            "format": self.format
        }


# Global instance
_fish_tts_client = None

def get_fish_tts() -> FishTTSClient:
    """Get the global Fish TTS client instance"""
    global _fish_tts_client
    if _fish_tts_client is None:
        _fish_tts_client = FishTTSClient()
    return _fish_tts_client

