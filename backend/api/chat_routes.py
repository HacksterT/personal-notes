from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import json
import os

from services.grok_service import grok_service

logger = logging.getLogger(__name__)

chat_router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    context: Optional[Dict[str, Any]] = None  # Current study context

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    conversation_id: Optional[str] = None

@chat_router.post("/librarian", response_model=ChatResponse)
async def chat_with_librarian(request: ChatRequest):
    """
    Chat with the Study Librarian AI assistant
    Provides theological guidance, biblical insights, and study assistance
    """
    try:
        logger.info(f"Librarian chat request: {request.message[:100]}...")
        
        # Validate request
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Limit conversation history to last 4 messages (2 user/assistant pairs)
        limited_history = request.conversation_history[-4:] if len(request.conversation_history) > 4 else request.conversation_history
        
        # Build librarian persona and context-aware prompt
        librarian_prompt = build_librarian_prompt(
            user_message=request.message,
            conversation_history=limited_history,
            study_context=request.context
        )
        
        logger.info(f"Built librarian prompt: {len(librarian_prompt)} characters")
        
        # Log the prompt to file for debugging
        log_chat_prompt(request.message, librarian_prompt, limited_history)
        
        # Generate response using Grok AI
        try:
            logger.info("Sending prompt to Grok AI service for librarian chat...")
            ai_response = await grok_service.generate_chat_response(librarian_prompt)
            logger.info(f"Successfully generated librarian response: {len(ai_response)} characters")
            
            return ChatResponse(
                success=True,
                response=ai_response,
                conversation_id=f"chat_{int(datetime.utcnow().timestamp())}"
            )
            
        except Exception as ai_error:
            logger.error(f"Grok AI generation failed: {ai_error}")
            # Return a helpful fallback response
            fallback_response = f"""I apologize, but I'm having trouble connecting to my knowledge base right now. 

However, I can see you asked: "{request.message}"

As your Study Librarian, I'm here to help with:
- Biblical interpretation and exegesis
- Theological questions and concepts  
- Historical and cultural context
- Cross-references and parallel passages
- Study methods and research guidance

Please try your question again in a moment, or feel free to rephrase it. I'm committed to helping you grow in your understanding of Scripture!

*[AI service temporarily unavailable - this is a fallback response]*"""
            
            return ChatResponse(
                success=True,
                response=fallback_response,
                conversation_id=f"fallback_{int(datetime.utcnow().timestamp())}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process librarian chat: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during chat processing"
        )

def build_librarian_prompt(user_message: str, conversation_history: List[ChatMessage], study_context: Dict[str, Any] = None) -> str:
    """
    Build a clean, efficient prompt for the Study Librarian AI
    """
    
    # Build conversation context (last 2 user/assistant pairs)
    conversation_context = ""
    if conversation_history and len(conversation_history) >= 2:
        # Get last 4 messages (2 user/assistant pairs) 
        recent_msgs = conversation_history[-4:]
        if recent_msgs:
            conversation_context = "Recent conversation:\n"
            for msg in recent_msgs:
                role = "User" if msg.role == "user" else "Assistant"
                content = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
                conversation_context += f"{role}: {content}\n"
            conversation_context += "\n"
    
    # Check if this is general biblical guidance mode (checkbox unchecked)
    if study_context and study_context.get('mode') == 'general_biblical_guidance':
        # Use the specific prompt when Include Note Context is unchecked
        prompt = f"""Answer as if you are a pastor and follower of Jesus Christ, staying grounded in the King James Bible.

{conversation_context}Question: {user_message}

Provide a helpful biblical answer (2-3 sentences):"""
    else:
        # Build minimal study context (existing behavior)
        study_context_text = ""
        if study_context:
            if study_context.get('study_notes'):
                # Only include first 1000 chars of notes for context
                notes_preview = study_context['study_notes'][:1000].strip()
                study_context_text += f"Current notes: {notes_preview}...\n"
            if study_context_text:
                study_context_text += "\n"
        
        # Build clean, concise prompt (existing behavior)
        prompt = f"""You are the Study Librarian, a theological AI assistant for pastors and Bible teachers.

{study_context_text}{conversation_context}Question: {user_message}

Provide a helpful biblical answer (2-3 sentences):"""

    return prompt

def log_chat_prompt(user_message: str, full_prompt: str, conversation_history: List[ChatMessage]):
    """Log chat prompt to JSON file for debugging"""
    try:
        # Ensure log_prompts directory exists
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "log_prompts")
        os.makedirs(log_dir, exist_ok=True)
        
        # Create timestamp for filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # milliseconds
        filename = f"chat_prompt_{timestamp}.json"
        filepath = os.path.join(log_dir, filename)
        
        # Prepare log data
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "librarian_chat",
            "user_message": user_message,
            "conversation_history": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                }
                for msg in conversation_history
            ],
            "full_prompt": full_prompt,
            "prompt_length": len(full_prompt),
            "service": "grok"
        }
        
        # Write to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Chat prompt logged to: {filepath}")
        
    except Exception as e:
        logger.error(f"Failed to log chat prompt: {e}")

# Health check endpoint
@chat_router.get("/health")
async def chat_health_check():
    """Health check for chat service"""
    return {"status": "healthy", "service": "librarian_chat"}