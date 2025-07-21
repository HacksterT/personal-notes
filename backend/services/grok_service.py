# backend/services/grok_service.py
"""
Grok API Service for theological content and chat responses
Provides fast chat responses and theological analysis using xAI's Grok-3-mini
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
    """Structured output from Grok analysis"""
    key_themes: List[str]
    thought_questions: List[str]

class GrokService:
    """Service for theological content and chat using Grok API"""
    
    def __init__(self, api_key: str = None, base_url: str = "https://api.x.ai/v1"):
        self.api_key = api_key or os.getenv('XAI_API_KEY')
        self.base_url = base_url
        self.model = "grok-3-mini"  # Fast, reasoning-capable model
        self.timeout = 60.0  # Grok is fast, shorter timeout
        self.max_retries = 3
        
        if not self.api_key:
            logger.warning("xAI API key not found. Set XAI_API_KEY environment variable.")
    
    async def generate_sermon(self, prompt: str) -> str:
        """
        Generate a sermon using Grok API
        
        Args:
            prompt: The complete sermon generation prompt
            
        Returns:
            Generated sermon text
        """
        if not self.api_key:
            raise ValueError("xAI API key is required for sermon generation")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 8000,  # Long-form content for sermons
            "stream": False
        }
        
        logger.info(f"Generating sermon with Grok API...")
        logger.debug(f"Prompt length: {len(prompt)} characters")
        
        # Use longer timeout for sermon generation
        sermon_timeout = 180.0  # 3 minutes for sermon generation
        async with httpx.AsyncClient(timeout=sermon_timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        if 'choices' in result and len(result['choices']) > 0:
                            sermon_text = result['choices'][0]['message']['content']
                            logger.info(f"Successfully generated sermon: {len(sermon_text)} characters")
                            return sermon_text
                        else:
                            logger.error(f"No choices in Grok response: {result}")
                            raise ValueError("No sermon content generated")
                    
                    else:
                        logger.error(f"Grok API error: {response.status_code} - {response.text}")
                        if attempt == self.max_retries - 1:
                            raise ValueError(f"Grok API failed after {self.max_retries} attempts")
                        
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        
                except httpx.TimeoutException:
                    logger.error(f"Grok API timeout on attempt {attempt + 1}")
                    if attempt == self.max_retries - 1:
                        raise ValueError("Grok API timed out")
                    await asyncio.sleep(2 ** attempt)
                    
                except Exception as e:
                    logger.error(f"Unexpected error calling Grok API: {e}")
                    if attempt == self.max_retries - 1:
                        raise ValueError(f"Grok API error: {str(e)}")
                    await asyncio.sleep(2 ** attempt)
    
    def _create_function_schema(self) -> Dict[str, Any]:
        """Create function calling schema for structured theological analysis"""
        return {
            "type": "function",
            "function": {
                "name": "analyze_theological_content",
                "description": "Analyze theological content (sermons, studies, journals) to extract key themes and generate thought-provoking questions",
                "parameters": {
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
        Analyze theological content using Grok API with function calling
        
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
            raise ValueError("xAI API key not configured")
        
        try:
            # Prepare the API request (Grok format)
            messages = [
                {"role": "system", "content": self._create_system_prompt()},
                {"role": "user", "content": self._create_user_prompt(content, title, category)}
            ]
            
            tools = [self._create_function_schema()]
            
            # Use function calling with Grok
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2000,
                "tools": tools,
                "tool_choice": "auto",
                "stream": False
            }
            
            # Make API request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    error_msg = f"Grok API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                # Parse response
                result = response.json()
                logger.info(f"Grok API full response: {json.dumps(result, indent=2)}")
                
                # Extract function call result
                if 'choices' in result and len(result['choices']) > 0:
                    choice = result['choices'][0]
                    logger.info(f"Choice content: {json.dumps(choice, indent=2)}")
                    
                    if 'message' in choice and 'tool_calls' in choice['message']:
                        tool_calls = choice['message']['tool_calls']
                        logger.info(f"Tool calls found: {len(tool_calls)}")
                        if len(tool_calls) > 0:
                            logger.info(f"First tool call: {json.dumps(tool_calls[0], indent=2)}")
                            try:
                                function_args = json.loads(tool_calls[0]['function']['arguments'])
                                
                                return TheologicalAnalysis(
                                    key_themes=function_args.get('key_themes', []),
                                    thought_questions=function_args.get('thought_questions', [])
                                )
                            except json.JSONDecodeError as e:
                                logger.error(f"Failed to parse function arguments JSON: {e}")
                                logger.error(f"Raw arguments: {tool_calls[0]['function']['arguments']}")
                                raise Exception(f"Invalid JSON in function arguments: {e}")
                    else:
                        logger.warning("No tool_calls found in message")
                        if 'message' in choice:
                            logger.info(f"Message content: {choice['message']}")
                else:
                    logger.warning("No choices found in response")
                
                # Fallback if no function call found
                raise Exception("No function call result found in response")
                
        except httpx.TimeoutException:
            logger.error("Grok API request timeout")
            raise
        except Exception as e:
            logger.error(f"Grok API request failed: {str(e)}")
            raise
    
    async def generate_chat_response(self, prompt: str) -> str:
        """
        Generate a chat response using Grok API (optimized for fast conversation)
        
        Args:
            prompt: The chat prompt
            
        Returns:
            Generated response text
        """
        if not self.api_key:
            raise ValueError("xAI API key is required for chat generation")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000,  # Shorter for chat responses
            "stream": False
        }
        
        logger.info(f"Generating chat response with Grok API...")
        logger.debug(f"Prompt length: {len(prompt)} characters")
        
        # Use shorter timeout for chat (Grok is fast)
        chat_timeout = 30.0  # 30 seconds for chat responses
        async with httpx.AsyncClient(timeout=chat_timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        if 'choices' in result and len(result['choices']) > 0:
                            chat_text = result['choices'][0]['message']['content']
                            logger.info(f"Successfully generated chat response: {len(chat_text)} characters")
                            return chat_text
                        else:
                            logger.error(f"No choices in Grok response: {result}")
                            raise ValueError("No chat content generated")
                    
                    else:
                        logger.error(f"Grok API error: {response.status_code} - {response.text}")
                        if attempt == self.max_retries - 1:
                            raise ValueError(f"Grok API failed after {self.max_retries} attempts")
                        
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        
                except httpx.TimeoutException:
                    logger.error(f"Grok API timeout on attempt {attempt + 1}")
                    if attempt == self.max_retries - 1:
                        raise ValueError("Grok API timed out")
                    await asyncio.sleep(2 ** attempt)
                    
                except Exception as e:
                    logger.error(f"Unexpected error calling Grok API: {e}")
                    if attempt == self.max_retries - 1:
                        raise ValueError(f"Grok API error: {str(e)}")
                    await asyncio.sleep(2 ** attempt)

    async def health_check(self) -> bool:
        """Check if Grok API is available"""
        if not self.api_key:
            return False
        
        try:
            # Simple test request
            messages = [{"role": "user", "content": "Hello"}]
            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 10
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers
                )
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Grok health check failed: {e}")
            return False

# Create singleton instance
grok_service = GrokService()