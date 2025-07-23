# backend/services/sermon_service.py
"""
Sermon Generation Service with fallback capabilities
Handles sermon generation with primary Grok API and fallback to Claude
"""

import logging
from typing import Tuple

from .grok_service import grok_service
from .claude_service import claude_service

logger = logging.getLogger(__name__)

class SermonService:
    """Sermon generation service with Grok primary and Claude fallback"""
    
    def __init__(self):
        self.primary_service = grok_service
        self.fallback_service = claude_service
    
    async def generate_sermon(self, prompt: str) -> Tuple[str, str]:
        """
        Generate a sermon using primary AI service with fallback
        
        Args:
            prompt: The complete sermon generation prompt
            
        Returns:
            Tuple of (generated_sermon, service_used)
        """
        # Try primary service (Grok) first
        try:
            logger.info("Attempting sermon generation with Grok API...")
            sermon = await self.primary_service.generate_sermon(prompt)
            logger.info(f"Successfully generated sermon with Grok API: {len(sermon)} characters")
            return sermon, "grok"
            
        except Exception as grok_error:
            logger.warning(f"Grok API failed: {grok_error}")
            
            # Check if Grok is overloaded or other failures
            if "429" in str(grok_error) or "overloaded" in str(grok_error).lower():
                logger.info("Grok API is overloaded, falling back to Claude...")
            else:
                logger.info(f"Grok API failed with error: {grok_error}, trying Claude fallback...")
            
            try:
                sermon = await self.fallback_service.generate_sermon(prompt)
                logger.info(f"Successfully generated sermon with Claude fallback: {len(sermon)} characters")
                return sermon, "claude"
                
            except Exception as claude_error:
                logger.error(f"Claude fallback also failed: {claude_error}")
                raise Exception(f"Both AI services failed - Grok: {grok_error}, Claude: {claude_error}")
    
    async def health_check(self) -> dict:
        """Check health of both AI services"""
        try:
            grok_healthy = await self.primary_service.health_check()
        except Exception:
            grok_healthy = False
            
        try:
            claude_healthy = await self.fallback_service.health_check()
        except Exception:
            claude_healthy = False
            
        return {
            "grok": grok_healthy,
            "claude": claude_healthy,
            "at_least_one_available": grok_healthy or claude_healthy
        }

# Create singleton instance
sermon_service = SermonService()