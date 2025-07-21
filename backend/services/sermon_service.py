# backend/services/sermon_service.py
"""
Sermon Generation Service with fallback capabilities
Handles sermon generation with primary Claude API and fallback to MiniMax
"""

import logging
from typing import Tuple

from .claude_service import claude_service
from .minimax_service import minimax_service

logger = logging.getLogger(__name__)

class SermonService:
    """Sermon generation service with Claude primary and MiniMax fallback"""
    
    def __init__(self):
        self.primary_service = claude_service
        self.fallback_service = minimax_service
    
    async def generate_sermon(self, prompt: str) -> Tuple[str, str]:
        """
        Generate a sermon using primary AI service with fallback
        
        Args:
            prompt: The complete sermon generation prompt
            
        Returns:
            Tuple of (generated_sermon, service_used)
        """
        # Try primary service (Claude) first
        try:
            logger.info("Attempting sermon generation with Claude API...")
            sermon = await self.primary_service.generate_sermon(prompt)
            logger.info(f"Successfully generated sermon with Claude API: {len(sermon)} characters")
            return sermon, "claude"
            
        except Exception as claude_error:
            logger.warning(f"Claude API failed: {claude_error}")
            
            # Check if Claude is overloaded (529 error) or other failures
            if "529" in str(claude_error) or "overloaded" in str(claude_error).lower():
                logger.info("Claude API is overloaded, falling back to MiniMax...")
            else:
                logger.info(f"Claude API failed with error: {claude_error}, trying MiniMax fallback...")
            
            try:
                sermon = await self.fallback_service.generate_sermon(prompt)
                logger.info(f"Successfully generated sermon with MiniMax fallback: {len(sermon)} characters")
                return sermon, "minimax"
                
            except Exception as minimax_error:
                logger.error(f"MiniMax fallback also failed: {minimax_error}")
                raise Exception(f"Both AI services failed - Claude: {claude_error}, MiniMax: {minimax_error}")
    
    async def health_check(self) -> dict:
        """Check health of both AI services"""
        try:
            claude_healthy = await self.primary_service.health_check()
        except Exception:
            claude_healthy = False
            
        try:
            minimax_healthy = await self.fallback_service.health_check()
        except Exception:
            minimax_healthy = False
            
        return {
            "claude": claude_healthy,
            "minimax": minimax_healthy,
            "at_least_one_available": claude_healthy or minimax_healthy
        }

# Create singleton instance
sermon_service = SermonService()