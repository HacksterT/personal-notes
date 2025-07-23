# backend/services/claude_service.py
"""
Claude API Service for sermon generation
High-quality sermon generation using Anthropic's Claude API
"""

import os
import json
import logging
import asyncio
import httpx
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TheologicalAnalysis:
    """Structured output from Claude analysis"""
    key_themes: List[str]
    thought_questions: List[str]

class ClaudeService:
    """Service for sermon generation using Claude API"""
    
    def __init__(self, api_key: str = None, base_url: str = "https://api.anthropic.com"):
        self.api_key = api_key or os.getenv('CLAUDE_API_KEY')
        self.base_url = base_url
        self.model = "claude-3-7-sonnet-20250219"  # Claude Sonnet 3.7
        self.timeout = 60.0  # Standard timeout for Claude API
        self.max_retries = 3
        
        if not self.api_key:
            logger.warning("Claude API key not found. Set CLAUDE_API_KEY environment variable.")
    
    async def generate_sermon(self, prompt: str) -> str:
        """
        Generate a sermon using Claude API
        
        Args:
            prompt: The complete sermon generation prompt
            
        Returns:
            Generated sermon text
        """
        if not self.api_key:
            raise ValueError("Claude API key is required for sermon generation")
        
        logger.info(f"Using Claude API key: {self.api_key[:20]}...")
        
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": 8000,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        logger.info(f"Generating sermon with Claude API...")
        logger.debug(f"Prompt length: {len(prompt)} characters")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/v1/messages",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        if 'content' in result and len(result['content']) > 0:
                            sermon_text = result['content'][0]['text']
                            logger.info(f"Successfully generated sermon: {len(sermon_text)} characters")
                            return sermon_text
                        else:
                            logger.error(f"No content in Claude response: {result}")
                            raise ValueError("No sermon content generated")
                    
                    else:
                        error_text = response.text
                        logger.error(f"Claude API error: {response.status_code} - {error_text}")
                        if attempt == self.max_retries - 1:
                            raise ValueError(f"Claude API failed after {self.max_retries} attempts: {error_text}")
                        
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        
                except httpx.TimeoutException:
                    logger.error(f"Claude API timeout on attempt {attempt + 1}")
                    if attempt == self.max_retries - 1:
                        raise ValueError("Claude API timed out")
                    await asyncio.sleep(2 ** attempt)
                    
                except Exception as e:
                    logger.error(f"Unexpected error calling Claude API: {e}")
                    if attempt == self.max_retries - 1:
                        raise ValueError(f"Claude API error: {str(e)}")
                    await asyncio.sleep(2 ** attempt)

    async def health_check(self) -> bool:
        """Check if Claude API is available"""
        if not self.api_key:
            return False
        
        try:
            # Simple test request
            payload = {
                "model": self.model,
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "Hello"}]
            }
            
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/messages",
                    json=payload,
                    headers=headers
                )
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Claude health check failed: {e}")
            return False
    
    def _create_function_schema(self) -> Dict[str, Any]:
        """Create function calling schema for structured theological analysis"""
        return {
            "name": "analyze_theological_content",
            "description": "Analyze theological content (sermons, studies, journals) to extract key themes and generate thought-provoking questions",
            "input_schema": {
                "type": "object",
                "properties": {
                    "key_themes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Exactly 3 key theological themes from the content (e.g., 'Grace and forgiveness', 'Faith in trials', 'God's sovereignty')"
                    },
                    "thought_questions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Exactly 2 open-ended thought questions for personal reflection or group discussion, tailored to the content category"
                    }
                },
                "required": ["key_themes", "thought_questions"]
            }
        }
    
    def _create_system_prompt(self) -> str:
        """Create system prompt for theological analysis"""
        return """You are a theological content analyzer specializing in Christian sermons, Bible studies, and spiritual journals.

Your task is to:
1. Identify exactly 3 key theological themes from the content
2. Generate exactly 2 open-ended thought questions for reflection or discussion. These questions should guide the reader to deeper insight or study.

Guidelines:
- Focus on deep spiritual insights, not surface-level observations
- Themes should be actionable and personally relevant
- Questions should encourage deeper spiritual reflection
- Adapt question style to content category:
  * Sermons: Focus on personal application and life transformation
  * Study Notes: Focus on deeper biblical understanding and analysis
  * Journals: Focus on personal spiritual growth and emotional processing
- Be respectful of different Christian traditions and interpretations
- Do NOT use any profanity or offensive language
- Use clear, accessible language meant for pastors and Bible teachers
- Do not insert religious doctrines from other world religions
- Ground your answers in the Holy Bible and associated theological principles

Call the analyze_theological_content function with your analysis."""
    
    def _create_user_prompt(self, content: str, title: str = None, category: str = None) -> str:
        """Create user prompt with content context"""
        prompt_parts = []
        
        if title:
            prompt_parts.append(f"Title: {title}")
        
        if category:
            prompt_parts.append(f"Category: {category}")
        
        prompt_parts.append(f"Content to analyze:\n\n{content}")
        
        return "\n\n".join(prompt_parts)
    
    async def analyze_content(self, content: str, title: str = None, category: str = None) -> TheologicalAnalysis:
        """
        Analyze theological content using Claude API with function calling
        
        Args:
            content: The text content to analyze
            title: Optional title for context
            category: Optional category for context
            
        Returns:
            TheologicalAnalysis object with structured results
            
        Raises:
            ValueError: If API key is not configured
            httpx.TimeoutException: If request times out
            Exception: For other API errors
        """
        if not self.api_key:
            raise ValueError("Claude API key not configured")
        
        try:
            # Prepare the API request (Claude format)
            tools = [self._create_function_schema()]
            
            payload = {
                "model": self.model,
                "max_tokens": 2000,
                "temperature": 0.7,
                "tools": tools,
                "messages": [
                    {"role": "user", "content": self._create_system_prompt() + "\n\n" + self._create_user_prompt(content, title, category)}
                ]
            }
            
            # Make API request
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/messages",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    error_msg = f"Claude API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                # Parse response
                result = response.json()
                logger.info(f"Claude API full response: {json.dumps(result, indent=2)}")
                
                # Extract function call result
                if 'content' in result and len(result['content']) > 0:
                    for content_block in result['content']:
                        if content_block.get('type') == 'tool_use':
                            logger.info(f"Tool use found: {json.dumps(content_block, indent=2)}")
                            try:
                                function_input = content_block.get('input', {})
                                
                                return TheologicalAnalysis(
                                    key_themes=function_input.get('key_themes', []),
                                    thought_questions=function_input.get('thought_questions', [])
                                )
                            except Exception as e:
                                logger.error(f"Failed to parse function input: {e}")
                                raise Exception(f"Invalid function input: {e}")
                
                # Fallback if no function call found
                raise Exception("No function call result found in response")
                
        except httpx.TimeoutException:
            logger.error("Claude API request timeout")
            raise
        except Exception as e:
            logger.error(f"Claude API request failed: {str(e)}")
            raise
    
    async def generate_chat_response(self, prompt: str) -> str:
        """
        Generate a chat response using Claude API (optimized for fast conversation)
        
        Args:
            prompt: The chat prompt
            
        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("Claude API key is required for chat generation")
        
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": 1000,  # Shorter for chat responses
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        logger.info(f"Generating chat response with Claude API...")
        logger.debug(f"Prompt length: {len(prompt)} characters")
        
        # Use shorter timeout for chat
        chat_timeout = 30.0  # 30 seconds for chat responses
        async with httpx.AsyncClient(timeout=chat_timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/v1/messages",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        if 'content' in result and len(result['content']) > 0:
                            chat_text = result['content'][0]['text']
                            logger.info(f"Successfully generated chat response: {len(chat_text)} characters")
                            return chat_text
                        else:
                            logger.error(f"No content in Claude response: {result}")
                            raise ValueError("No chat content generated")
                    
                    else:
                        error_text = response.text
                        logger.error(f"Claude API error: {response.status_code} - {error_text}")
                        if attempt == self.max_retries - 1:
                            raise ValueError(f"Claude API failed after {self.max_retries} attempts")
                        
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        
                except httpx.TimeoutException:
                    logger.error(f"Claude API timeout on attempt {attempt + 1}")
                    if attempt == self.max_retries - 1:
                        raise ValueError("Claude API timed out")
                    await asyncio.sleep(2 ** attempt)
                    
                except Exception as e:
                    logger.error(f"Unexpected error calling Claude API: {e}")
                    if attempt == self.max_retries - 1:
                        raise ValueError(f"Claude API error: {str(e)}")
                    await asyncio.sleep(2 ** attempt)

# Create singleton instance
claude_service = ClaudeService()