"""
Bible API Routes - Phase A Implementation
Provides REST endpoints for Bible content with compliance tracking.

This module exposes the BibleSessionService through FastAPI routes,
following the same patterns as other API modules in the project.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import os

from services.bible_session_service import BibleSessionService
from services.bible_storage_service import BibleStorageService
from services.nlt_api_service import NLTApiService

logger = logging.getLogger(__name__)

# Create router
bible_router = APIRouter()

# Response Models following project patterns
class BibleChapterResponse(BaseModel):
    success: bool
    book: Optional[str] = None
    book_abbrev: Optional[str] = None
    chapter: Optional[int] = None
    version: Optional[str] = None
    verses: Optional[List[Dict[str, Any]]] = None
    verse_count: Optional[int] = None
    from_cache: Optional[bool] = None
    stored: Optional[bool] = None
    compliance_warning: Optional[str] = None
    error: Optional[str] = None

class BibleSearchResponse(BaseModel):
    success: bool
    query: Optional[str] = None
    version: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    result_count: Optional[int] = None
    searched_cached_only: Optional[bool] = None
    error: Optional[str] = None

class BibleNavigationResponse(BaseModel):
    success: bool
    old_testament: Optional[List[Dict[str, Any]]] = None
    new_testament: Optional[List[Dict[str, Any]]] = None
    total_books: Optional[int] = None
    compliance: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class BibleComplianceResponse(BaseModel):
    success: bool
    statistics: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Dependency placeholder - will be initialized in main.py
def get_bible_session_service() -> BibleSessionService:
    """Dependency to provide Bible session service instance"""
    raise HTTPException(status_code=500, detail="Bible session service not initialized")

@bible_router.get("/chapter/{book}/{chapter}", response_model=BibleChapterResponse)
async def get_bible_chapter(
    book: str,
    chapter: int,
    version: str = Query(default="NLT", description="Bible version (NLT, KJV)"),
    session_service: BibleSessionService = Depends(get_bible_session_service)
):
    """
    Get a Bible chapter with cache-first, API-fallback strategy.
    
    This endpoint:
    1. Checks session cache first (instant if found)
    2. Falls back to API call if not cached
    3. Stores new content in database (if compliant)
    4. Tracks usage for 500-verse compliance limit
    
    Learning Notes: 
    - Study how async services are called from FastAPI routes
    - Observe the cache-first pattern in action
    - Understand compliance checking integration
    """
    try:
        logger.info(f"📖 Bible chapter request: {book} {chapter} ({version})")
        
        # Validate inputs
        if chapter < 1:
            raise HTTPException(status_code=400, detail="Chapter number must be positive")
        
        if version not in ["NLT", "KJV"]:
            raise HTTPException(status_code=400, detail="Invalid Bible version. Only NLT and KJV are supported.")
        
        # Get chapter from session service (handles cache/API/storage)
        result = await session_service.get_chapter(book, chapter, version)
        
        # Convert to response model
        if result.get('success'):
            return BibleChapterResponse(
                success=True,
                book=result.get('book'),
                book_abbrev=result.get('book_abbrev'),
                chapter=result.get('chapter'),
                version=result.get('version'),
                verses=result.get('verses', []),
                verse_count=result.get('verse_count', 0),
                from_cache=result.get('from_cache'),
                stored=result.get('stored'),
                compliance_warning=result.get('compliance_warning')
            )
        else:
            return BibleChapterResponse(
                success=False,
                error=result.get('error', 'Unknown error occurred')
            )
            
    except Exception as e:
        logger.error(f"❌ Error getting Bible chapter {book} {chapter}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Bible chapter: {str(e)}")

@bible_router.get("/search", response_model=BibleSearchResponse)  
async def search_bible(
    q: str = Query(..., description="Search query"),
    version: str = Query(default="NLT", description="Bible version to search"),
    cached_only: bool = Query(default=False, description="Search cached content only"),
    session_service: BibleSessionService = Depends(get_bible_session_service)
):
    """
    Search Bible content with optional cache-only mode.
    
    This endpoint:
    1. Searches either cached content only or uses API search
    2. Respects compliance limits (cached-only if over limit)
    3. Returns formatted search results with context
    
    Learning Notes:
    - Understand how search differs from chapter retrieval
    - See how compliance affects available features
    - Study query parameter validation patterns
    """
    try:
        logger.info(f"🔍 Bible search request: '{q}' in {version} (cached_only={cached_only})")
        
        # Validate inputs
        if not q or len(q.strip()) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
        
        if version not in ["NLT", "KJV"]:
            raise HTTPException(status_code=400, detail="Invalid Bible version. Only NLT and KJV are supported.")
        
        # Search using session service
        result = await session_service.search_bible(q.strip(), version, cached_only)
        
        # Convert to response model
        return BibleSearchResponse(
            success=result.get('success', False),
            query=result.get('query'),
            version=result.get('version'),
            results=result.get('results', []),
            result_count=result.get('result_count', 0),
            searched_cached_only=result.get('searched_cached_only'),
            error=result.get('error')
        )
        
    except Exception as e:
        logger.error(f"❌ Error searching Bible for '{q}': {e}")
        raise HTTPException(status_code=500, detail=f"Bible search failed: {str(e)}")

@bible_router.get("/navigation", response_model=BibleNavigationResponse)
async def get_bible_navigation(
    session_service: BibleSessionService = Depends(get_bible_session_service)
):
    """
    Get complete Bible navigation data for the UI.
    
    This endpoint:
    1. Returns all 66 books organized by testament and category
    2. Includes color coding and chapter counts for navigation
    3. Provides current compliance status
    
    Learning Notes:
    - See how reference data is structured for UI consumption
    - Understand the relationship between books metadata and navigation
    - Study how compliance status is integrated into UI data
    """
    try:
        logger.info("📚 Bible navigation data requested")
        
        # Get navigation data from session service
        result = await session_service.get_navigation_data()
        
        # Convert to response model
        return BibleNavigationResponse(
            success=result.get('success', False),  
            old_testament=result.get('old_testament', []),
            new_testament=result.get('new_testament', []),
            total_books=result.get('total_books', 0),
            compliance=result.get('compliance', {}),
            error=result.get('error')
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting Bible navigation data: {e}")
        raise HTTPException(status_code=500, detail=f"Navigation data failed: {str(e)}")

@bible_router.get("/compliance", response_model=BibleComplianceResponse)
async def get_bible_compliance(
    session_service: BibleSessionService = Depends(get_bible_session_service)
):
    """
    Get detailed compliance and usage statistics.
    
    This endpoint:
    1. Returns current verse usage vs 500 verse limit
    2. Shows recently accessed chapters and popular content
    3. Provides session cache statistics
    
    Learning Notes:
    - Understand how compliance tracking works in practice
    - See how usage analytics are structured
    - Study the relationship between cache, database, and compliance
    """
    try:
        logger.info("📊 Bible compliance statistics requested")
        
        # Get usage statistics from session service
        result = await session_service.get_usage_statistics()
        
        # Convert to response model
        return BibleComplianceResponse(
            success=result.get('success', False),
            statistics=result.get('statistics', {}),
            error=result.get('error')
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting Bible compliance data: {e}")
        raise HTTPException(status_code=500, detail=f"Compliance data failed: {str(e)}")

@bible_router.post("/initialize")
async def initialize_bible_session(
    version: str = Query(default="NLT", description="Bible version to initialize"),
    session_service: BibleSessionService = Depends(get_bible_session_service)
):
    """
    Initialize Bible session cache for a specific version.
    
    This endpoint:
    1. Loads all cached chapters for the version into session memory
    2. Identifies missing chapters for progressive loading
    3. Returns initialization statistics
    
    Learning Notes:
    - Understand session initialization patterns
    - See how cache warming strategies work
    - Study progressive loading architecture
    """
    try:
        logger.info(f"🚀 Bible session initialization requested for {version}")
        
        if version not in ["NLT", "KJV"]:
            raise HTTPException(status_code=400, detail="Invalid Bible version. Only NLT and KJV are supported.")
        
        # Initialize session for the version
        result = await session_service.initialize_session(version)
        
        return {
            "success": True,
            "version": result.get('version'),
            "cached_chapters": result.get('cached_chapters', 0),
            "missing_chapters": result.get('missing_chapters', 0),
            "books_metadata": len(result.get('books_metadata', [])),
            "compliance": result.get('compliance', {})
        }
        
    except Exception as e:
        logger.error(f"❌ Error initializing Bible session for {version}: {e}")
        raise HTTPException(status_code=500, detail=f"Session initialization failed: {str(e)}")