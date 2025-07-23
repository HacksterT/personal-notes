from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
import json
import os

from services.prompt_service import PromptService
from services.sermon_service import sermon_service

logger = logging.getLogger(__name__)

sermon_router = APIRouter()
prompt_service = PromptService()

class SermonConfig(BaseModel):
    sermonType: str
    speakingStyle: str
    sermonLength: str
    outputFormat: str
    content: str

class SermonResponse(BaseModel):
    success: bool
    sermon: Optional[str] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None
    code: Optional[str] = None

@sermon_router.post("/generate", response_model=SermonResponse)
async def generate_sermon(config: SermonConfig):
    """Generate a sermon based on configuration and content"""
    try:
        # Validate configuration using prompt service
        validation = prompt_service.validate_configuration(
            config.sermonType, 
            config.speakingStyle, 
            config.sermonLength, 
            config.outputFormat
        )
        
        if not validation['valid']:
            raise HTTPException(
                status_code=400, 
                detail=f"Configuration validation failed: {'; '.join(validation['errors'])}"
            )
        
        # Validate content
        if not config.content or not config.content.strip():
            raise HTTPException(
                status_code=400, 
                detail="Content is required and cannot be empty"
            )
        
        logger.info(f"Generating {config.sermonType} sermon in {config.speakingStyle} style")
        logger.info(f"Length: {config.sermonLength}, Format: {config.outputFormat}")
        
        # Generate the AI prompt using prompt service
        ai_prompt = prompt_service.build_prompt(
            config.sermonType,
            config.speakingStyle,
            config.sermonLength,
            config.outputFormat,
            config.content
        )
        
        # Get prompt metadata
        prompt_metadata = prompt_service.get_prompt_metadata(
            config.sermonType,
            config.speakingStyle,
            config.sermonLength,
            config.outputFormat,
            config.content
        )
        
        logger.info(f"Generated prompt: {prompt_metadata['prompt_words']} words, {prompt_metadata['prompt_length']} characters")
        
        # Save the complete prompt to log file for review
        try:
            log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "log_prompts")
            os.makedirs(log_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            log_filename = f"sermon_prompt_{timestamp}.json"
            log_filepath = os.path.join(log_dir, log_filename)
            
            prompt_log = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "configuration": {
                    "sermonType": config.sermonType,
                    "speakingStyle": config.speakingStyle,
                    "sermonLength": config.sermonLength,
                    "outputFormat": config.outputFormat
                },
                "content": config.content,
                "generated_prompt": ai_prompt,
                "prompt_metadata": prompt_metadata
            }
            
            with open(log_filepath, 'w', encoding='utf-8') as f:
                json.dump(prompt_log, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Prompt logged to: {log_filepath}")
            
        except Exception as log_error:
            logger.error(f"Failed to log prompt: {log_error}")
            # Don't fail the sermon generation if logging fails
        
        # Generate sermon using AI service with fallback
        try:
            logger.info("Sending prompt to sermon generation service...")
            # Combine the prompt instructions with the actual content
            complete_prompt = ai_prompt + "\n\nCONTENT TO WORK WITH:\n" + config.content
            generated_sermon, service_used = await sermon_service.generate_sermon(complete_prompt)
            logger.info(f"Successfully generated sermon with {service_used}: {len(generated_sermon)} characters")
            
        except Exception as ai_error:
            logger.error(f"AI generation failed: {ai_error}")
            # Fallback to showing the prompt for debugging
            generated_sermon = f"""# AI Generation Failed
            
**Error:** {str(ai_error)}

**Configuration:**
- Type: {config.sermonType}
- Style: {config.speakingStyle}
- Length: {config.sermonLength}
- Format: {config.outputFormat}

**Generated AI Prompt:**
```
{ai_prompt}
```

*Both Grok and Claude APIs failed. Please check your API keys and try again.*"""
            service_used = "none"
        
        # Calculate estimated metadata
        word_count = len(generated_sermon.split())
        estimated_minutes = max(1, word_count // 120)  # ~120 words per minute speaking
        
        return SermonResponse(
            success=True,
            sermon=generated_sermon,
            metadata={
                "estimatedWords": word_count,
                "estimatedMinutes": estimated_minutes,
                "generatedAt": datetime.utcnow().isoformat() + "Z",
                "configuration": validation['configuration'],
                "prompt_metadata": prompt_metadata,
                "ai_service_used": service_used if 'service_used' in locals() else "unknown"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate sermon: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during sermon generation"
        )


# Health check endpoint
@sermon_router.get("/health")
async def health_check():
    """Health check for sermon generation service"""
    return {"status": "healthy", "service": "sermon_generation"}