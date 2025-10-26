import os
import json
import logging
from typing import Optional, Dict, Any
import httpx
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class RekaClient:
    """Client for interacting with Reka AI API"""

    def __init__(self):
        self.api_key = os.getenv("REKA_API_KEY")
        self.model_core = os.getenv("REKA_MODEL_CORE", "reka-core-20240501")
        self.model_flash = os.getenv("REKA_MODEL_FLASH", "reka-flash")
        self.base_url = "https://api.reka.ai"

        if not self.api_key:
            logger.warning("REKA_API_KEY not found in environment variables")
            return

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        logger.info("Reka client initialized successfully")

    async def analyze_video(self, video_path: str, prompt_text: str, model: str = "reka-flash") -> Optional[Dict[str, Any]]:
        """
        Analyze a video file with Reka AI

        Args:
            video_path: Path to the video file
            prompt_text: Text prompt for analysis
            model: Model to use ('reka-flash' or 'reka-core-20240501')

        Returns:
            Dict with analysis results or None if error
        """
        if not self.api_key:
            logger.error("Reka API key not configured")
            return None

        if not os.path.exists(video_path):
            logger.error(f"Video file not found: {video_path}")
            return None

        try:
            logger.info(f"Analyzing video with Reka: {video_path}")

            # Read video file and convert to base64 data URL
            with open(video_path, 'rb') as video_file:
                video_data = video_file.read()

            video_base64 = base64.b64encode(video_data).decode('utf-8')
            video_data_url = f"data:video/mp4;base64,{video_base64}"

            # Prepare the request payload
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "video_url",
                                "video_url": video_data_url
                            },
                            {
                                "type": "text",
                                "text": prompt_text
                            }
                        ]
                    }
                ]
            }

            # Make the API call to Reka AI
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/chat",
                    headers=self.headers,
                    json=payload
                )

                if response.status_code != 200:
                    logger.error(f"Reka API error: {response.status_code} - {response.text}")
                    return None

                result = response.json()
                logger.info("Successfully received response from Reka AI")

                # Extract the response content
                if "responses" in result and len(result["responses"]) > 0:
                    content = result["responses"][0]["message"]["content"]
                    logger.info(f"Received analysis content: {len(content)} characters")

                    # Try to parse as JSON if it looks like JSON
                    try:
                        if content.strip().startswith('{') or content.strip().startswith('['):
                            parsed_content = json.loads(content)
                            logger.info("Successfully parsed JSON response from Reka")
                            return parsed_content
                        else:
                            logger.info("Received text response from Reka")
                            return {"text": content}
                    except json.JSONDecodeError:
                        logger.warning("Response is not valid JSON, returning as text")
                        return {"text": content}
                else:
                    logger.error("No responses in Reka response")
                    return None

        except Exception as e:
            logger.error(f"Reka API error: {e}")
            return None

    def is_available(self) -> bool:
        """Check if Reka client is available and configured"""
        return self.api_key is not None

    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the Reka client"""
        return {
            "available": self.is_available(),
            "api_key_set": bool(self.api_key),
            "model_core": self.model_core,
            "model_flash": self.model_flash
        }

# Global instance
_reka_client = None

def get_reka() -> RekaClient:
    """Get the global Reka client instance"""
    global _reka_client
    if _reka_client is None:
        _reka_client = RekaClient()
    return _reka_client

