"""
Letta AI Client Service
Handles communication with Letta AI API for TacticoAI
"""

import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class TacticoLettaClient:
    """Client for interacting with Letta AI"""
    
    def __init__(self):
        self.api_key = os.getenv("LETTA_API_KEY")
        self.agent_id = os.getenv("LETTA_AGENT_ID")
        self.client = None
        
        if not self.api_key:
            logger.warning("LETTA_API_KEY not found in environment variables")
            return
            
        if not self.agent_id:
            logger.warning("LETTA_AGENT_ID not found in environment variables")
            return
            
        try:
            from letta_client import Letta
            self.client = Letta()
            self.client._client_wrapper.token = self.api_key
            logger.info("Letta client initialized successfully")
        except ImportError:
            logger.error("letta-client package not installed. Run: pip install letta-client")
        except Exception as e:
            logger.error(f"Failed to initialize Letta client: {e}")
    
    def ask_question(self, question: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Send a question to Letta AI and get a response
        
        Args:
            question: The question to ask Letta
            context: Optional context data (team info, match data, etc.)
            
        Returns:
            Letta's response as a string, or None if error
        """
        if not self.client or not self.agent_id:
            logger.error("Letta client not properly initialized")
            return None
            
        try:
            logger.info(f"Asking Letta: {question}")
            
            # Prepare the message with context if provided
            message = question
            if context:
                context_str = f"\n\nContext: {context}"
                message += context_str
            
            # Send to Letta AI
            from letta_client import MessageCreate, TextContent
            
            response = self.client.agents.messages.create(
                agent_id=self.agent_id,
                messages=[
                    MessageCreate(
                        role="user",
                        content=[
                            TextContent(text=message)
                        ]
                    )
                ]
            )
            
            if response and response.messages and len(response.messages) > 0:
                content = response.messages[0].content
                logger.info(f"Letta response received: {content[:100]}...")
                return content
            else:
                logger.warning("Empty response from Letta AI")
                return None
                
        except Exception as e:
            logger.error(f"Letta API error: {e}")
            return None
    
    def is_available(self) -> bool:
        """Check if Letta client is available and configured"""
        return self.client is not None and self.agent_id is not None
    
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the Letta client"""
        return {
            "available": self.is_available(),
            "api_key_set": bool(self.api_key),
            "agent_id_set": bool(self.agent_id),
            "client_initialized": self.client is not None
        }

# Global instance
letta_client = TacticoLettaClient()
