# backend/services/analysis_service.py
"""
Content Analysis Service for theological content analysis
Handles communication with AI services (Grok primary, Claude fallback) for key themes and thought questions
"""

import asyncio
import logging
import json
import os
from datetime import datetime
from typing import Optional
from .grok_service import grok_service
from .claude_service import claude_service

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for theological content analysis with queue management using Grok-primary/Claude-fallback"""
    
    def __init__(self):
        self.grok = grok_service
        self.claude = claude_service
        self.max_retries = 3
        self.analysis_queue = asyncio.Queue()
        self.queue_processor_running = False
    
    async def trigger_analysis(self, content_id: str, text_content: str, 
                              title: str = None, category: str = None, 
                              storage_service = None) -> bool:
        """
        Add AI theological analysis to queue for sequential processing
        
        Args:
            content_id: UUID of the content item
            text_content: Full text to analyze
            title: Optional title for context
            category: Optional category for context
            storage_service: Storage service instance for database updates
            
        Returns:
            bool: True if request was queued successfully
        """
        try:
            # Add to queue for sequential processing
            await self.analysis_queue.put({
                'content_id': content_id,
                'text_content': text_content,
                'title': title,
                'category': category,
                'storage_service': storage_service
            })
            
            # Start queue processor if not running
            if not self.queue_processor_running:
                asyncio.create_task(self._process_analysis_queue())
            
            queue_size = self.analysis_queue.qsize()
            logger.info(f"AI theological analysis queued for content {content_id} (queue size: {queue_size})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to queue AI analysis for {content_id}: {e}")
            return False
    
    async def _process_analysis_queue(self):
        """
        Process analysis requests from queue sequentially
        Runs continuously until queue is empty
        """
        self.queue_processor_running = True
        logger.info("AI analysis queue processor started")
        
        try:
            while True:
                try:
                    # Get next item from queue (wait up to 1 second)
                    queue_item = await asyncio.wait_for(
                        self.analysis_queue.get(), 
                        timeout=1.0
                    )
                    
                    # Process the analysis
                    await self._process_and_store_analysis(
                        queue_item['content_id'],
                        queue_item['text_content'],
                        queue_item['title'],
                        queue_item['category'],
                        queue_item['storage_service']
                    )
                    
                    # Mark task as done
                    self.analysis_queue.task_done()
                    
                except asyncio.TimeoutError:
                    # No items in queue for 1 second, stop processor
                    break
                    
                except Exception as e:
                    logger.error(f"Error processing analysis queue item: {e}")
                    # Continue processing other items
                    continue
                    
        finally:
            self.queue_processor_running = False
            logger.info("AI analysis queue processor stopped")
    
    async def _process_and_store_analysis(self, content_id: str, text_content: str,
                                          title: str = None, category: str = None, 
                                          storage_service = None):
        """
        Internal method that handles AI service communication (Grok primary, Claude fallback) and database update
        Includes service fallback logic and error handling
        """
        # Try Grok first (primary service)
        analysis = await self._try_analysis_with_service("Grok", self.grok, content_id, text_content, title, category)
        
        # If Grok fails, fallback to Claude
        if not analysis:
            logger.warning(f"Grok analysis failed for {content_id}, falling back to Claude")
            analysis = await self._try_analysis_with_service("Claude", self.claude, content_id, text_content, title, category)
        
        # If both services fail
        if not analysis:
            logger.error(f"Both Grok and Claude analysis failed for {content_id}")
            
            # Update database with failure status
            if storage_service:
                try:
                    await storage_service.update_processing_data(
                        content_id=content_id,
                        processing_status='failed',
                        last_error="AI analysis failed with both Grok and Claude services"
                    )
                    logger.info(f"Database updated with failure status for {content_id}")
                except Exception as db_error:
                    logger.error(f"Failed to update database with failure status for {content_id}: {db_error}")
            
            return False
        
        # Success - store results in database
        if storage_service:
            success = await storage_service.update_processing_data(
                content_id=content_id,
                key_themes=analysis.key_themes,
                thought_questions=analysis.thought_questions,
                processing_status='completed'
            )
            
            if success:
                logger.info(f"AI theological analysis and storage successful for {content_id}")
                return True
            else:
                logger.error(f"Failed to store analysis for {content_id}")
                return False
        else:
            logger.error(f"No storage service provided for {content_id}")
            return False

    async def _try_analysis_with_service(self, service_name: str, service, content_id: str, 
                                       text_content: str, title: str = None, category: str = None):
        """
        Try analysis with a specific AI service with retry logic
        
        Returns:
            TheologicalAnalysis object if successful, None if failed
        """
        for attempt in range(self.max_retries):
            try:
                logger.info(f"AI theological analysis with {service_name} (attempt {attempt + 1}) for {content_id}")
                
                # Log the analysis prompt for debugging
                self._log_analysis_prompt(content_id, text_content, title, category, service_name)
                
                # Call AI service for theological analysis
                analysis = await service.analyze_content(
                    content=text_content,
                    title=title,
                    category=category
                )
                
                if not analysis or not analysis.key_themes or not analysis.thought_questions:
                    logger.warning(f"{service_name} analysis returned incomplete data: {analysis}")
                    
                    # If it's a retry-able error, continue to next attempt
                    if attempt < self.max_retries - 1:
                        continue
                    else:
                        return None
                
                logger.info(f"{service_name} analysis successful for {content_id}")
                return analysis
                        
            except Exception as e:
                logger.error(f"{service_name} analysis error for {content_id} (attempt {attempt + 1}): {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.max_retries - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                await asyncio.sleep(wait_time)
        
        logger.error(f"{service_name} analysis failed after {self.max_retries} attempts for {content_id}")
        return None
    
    async def health_check(self) -> bool:
        """Check if AI services are available (Grok primary, Claude fallback)"""
        grok_healthy = await self.grok.health_check()
        claude_healthy = await self.claude.health_check()
        
        if grok_healthy:
            logger.info("Grok AI service is healthy (primary)")
            return True
        elif claude_healthy:
            logger.info("Claude AI service is healthy (fallback - Grok unavailable)")
            return True
        else:
            logger.error("Both Grok and Claude AI services are unavailable")
            return False
    
    def _log_analysis_prompt(self, content_id: str, text_content: str, title: str = None, category: str = None, service_name: str = "Unknown"):
        """Log analysis prompt to JSON file for debugging"""
        try:
            # Ensure log_prompts directory exists
            log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "log_prompts")
            os.makedirs(log_dir, exist_ok=True)
            
            # Create timestamp for filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # milliseconds
            filename = f"analysis_prompt_{timestamp}_{service_name.lower()}.json"
            filepath = os.path.join(log_dir, filename)
            
            # Get service instance for prompt generation
            service = self.grok if service_name.lower() == "grok" else self.claude
            
            # Build the prompts that will be sent to AI
            system_prompt = service._create_system_prompt()
            user_prompt = service._create_user_prompt(text_content, title, category)
            
            # Prepare log data
            log_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "type": "theological_analysis",
                "content_id": content_id,
                "title": title,
                "category": category,
                "content_preview": text_content[:200] + "..." if len(text_content) > 200 else text_content,
                "content_length": len(text_content),
                "system_prompt": system_prompt,
                "user_prompt": user_prompt,
                "system_prompt_length": len(system_prompt),
                "user_prompt_length": len(user_prompt),
                "total_prompt_length": len(system_prompt) + len(user_prompt),
                "service": service_name.lower(),
                "function_calling": True
            }
            
            # Write to file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(log_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Analysis prompt logged to: {filepath}")
            
        except Exception as e:
            logger.error(f"Failed to log analysis prompt: {e}")
    
    # Legacy method for backward compatibility during transition
    async def trigger_summarization(self, content_id: str, text_content: str, 
                                  title: str = None, category: str = None, 
                                  storage_service = None) -> bool:
        """Legacy method - redirects to trigger_analysis"""
        logger.warning("trigger_summarization is deprecated, use trigger_analysis instead")
        return await self.trigger_analysis(content_id, text_content, title, category, storage_service)

# Create singleton instance
analysis_service = AnalysisService()