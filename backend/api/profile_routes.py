# backend/api/profile_routes.py
"""
FastAPI routes for user profile and settings management
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from datetime import datetime

from services.storage_service import StorageService
from api.storage_routes import get_storage_service

logger = logging.getLogger(__name__)

# Use the same default user ID as storage routes
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

# Create router
profile_router = APIRouter(prefix="/api/profile", tags=["profile"])

# Pydantic models for request/response validation
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    preferred_bible_versions: Optional[List[str]] = None
    other_bible_versions: Optional[str] = None
    audience_description: Optional[str] = None
    year_started_ministry: Optional[int] = None
    primary_church_affiliation: Optional[str] = None
    favorite_historical_preacher: Optional[str] = None
    role_id: Optional[int] = None
    theological_profile_id: Optional[int] = None
    other_theological_profile: Optional[str] = None
    speaking_style_id: Optional[int] = None
    education_level_id: Optional[int] = None

class UserProfileResponse(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    preferred_bible_versions: Optional[List[str]] = None
    other_bible_versions: Optional[str] = None
    audience_description: Optional[str] = None
    year_started_ministry: Optional[int] = None
    primary_church_affiliation: Optional[str] = None
    favorite_historical_preacher: Optional[str] = None
    role_id: Optional[int] = None
    theological_profile_id: Optional[int] = None
    other_theological_profile: Optional[str] = None
    speaking_style_id: Optional[int] = None
    education_level_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Dependency is imported from storage_routes

@profile_router.get("/", response_model=UserProfileResponse)
async def get_user_profile(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Get user profile data"""
    try:
        profile = await storage_service.get_user_profile(DEFAULT_USER_ID)
        
        if not profile:
            # Return empty profile if none exists
            return UserProfileResponse(user_id=DEFAULT_USER_ID)
        
        return UserProfileResponse(**profile)
        
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.put("/", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    storage_service: StorageService = Depends(get_storage_service)
):
    """Update user profile data"""
    try:
        # Convert to dict and filter out None values
        profile_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
        
        if not profile_dict:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Update profile in database
        updated_profile = await storage_service.update_user_profile(
            user_id=DEFAULT_USER_ID,
            profile_data=profile_dict
        )
        
        return UserProfileResponse(**updated_profile)
        
    except Exception as e:
        logger.error(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.get("/lookup-data")
async def get_lookup_data(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Get all lookup table data for dropdowns"""
    try:
        lookup_data = await storage_service.get_lookup_data()
        
        return {
            "roles": lookup_data.get("roles", []),
            "theological_profiles": lookup_data.get("theological_profiles", []),
            "speaking_styles": lookup_data.get("speaking_styles", []),
            "education_levels": lookup_data.get("education_levels", [])
        }
        
    except Exception as e:
        logger.error(f"Failed to get lookup data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.delete("/")
async def delete_user_profile(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Delete user profile data"""
    try:
        success = await storage_service.delete_user_profile(DEFAULT_USER_ID)
        
        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"success": True, "message": "Profile deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.post("/reset")
async def reset_user_profile(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Reset user profile to default values"""
    try:
        # Delete existing profile
        await storage_service.delete_user_profile(DEFAULT_USER_ID)
        
        # Create new empty profile
        default_profile = await storage_service.create_user_profile(DEFAULT_USER_ID)
        
        return UserProfileResponse(**default_profile)
        
    except Exception as e:
        logger.error(f"Failed to reset user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))