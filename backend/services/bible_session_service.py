"""
Bible Session Service - Phase 8 Implementation
Manages session cache with database integration for optimal Bible reading experience.

This service provides the bridge between the database storage layer and the session cache,
implementing the "cache-first, API-fallback" pattern for personal use compliance.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from .bible_storage_service import BibleStorageService, BibleChapter
from .nlt_api_service import NLTApiService

logger = logging.getLogger(__name__)

class BibleSessionService:
    """
    Session-based Bible content management with database integration.
    Implements the hybrid caching strategy for optimal reading experience.
    """
    
    def __init__(self, storage_service: BibleStorageService, nlt_service: NLTApiService):
        self.storage = storage_service
        self.nlt_api = nlt_service
        self.session_cache = {}  # Format: {version: {book.chapter: BibleChapter}}
        self.books_metadata = []
        self.license_mode = 'personal'  # 'personal' | 'commercial'
        
    async def initialize_session(self, version_code: str = 'NLT'):
        """
        Initialize session cache by loading all available chapters from database.
        This provides instant access to cached content.
        """
        logger.info(f"🚀 Initializing Bible session cache for {version_code}")
        
        try:
            # Load books metadata for navigation
            if not self.books_metadata:
                self.books_metadata = await self.storage.get_books_metadata()
                logger.info(f"📚 Loaded metadata for {len(self.books_metadata)} books")
            
            # Load all cached chapters for this version
            cached_chapters = await self.storage.get_all_cached_chapters(version_code)
            
            # Initialize version cache if not exists
            if version_code not in self.session_cache:
                self.session_cache[version_code] = {}
                
            # Load cached chapters into session
            self.session_cache[version_code].update(cached_chapters)
            
            # Identify missing chapters for progressive loading
            missing_chapters = self._identify_missing_chapters(version_code)
            
            logger.info(f"✅ Session initialized: {len(cached_chapters)} cached chapters, {len(missing_chapters)} missing")
            
            return {
                'version': version_code,
                'cached_chapters': len(cached_chapters),
                'missing_chapters': len(missing_chapters),
                'books_metadata': self.books_metadata,
                'compliance': await self.storage.get_compliance_status()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize session: {e}")
            raise
            
    async def get_chapter(self, book_name: str, chapter_number: int, version_code: str = 'NLT') -> Dict[str, Any]:
        """
        Get Bible chapter with cache-first, API-fallback strategy.
        Returns chapter data in format suitable for frontend consumption.
        """
        chapter_key = f"{book_name}.{chapter_number}"
        
        # 1. Check session cache first (instant response)
        if version_code in self.session_cache and chapter_key in self.session_cache[version_code]:
            chapter = self.session_cache[version_code][chapter_key]
            logger.info(f"📖 Cache hit: {chapter_key} ({version_code})")
            return self._format_chapter_response(chapter, from_cache=True)
            
        # 2. Chapter not in session cache - try API with storage
        logger.info(f"📡 Cache miss: {chapter_key} ({version_code}) - fetching from API")
        
        try:
            # Check compliance before API call
            compliance = await self.storage.get_compliance_status()
            if not compliance.is_compliant:
                logger.warning(f"🚫 Compliance limit reached - cannot fetch new content")
                return self._format_error_response(
                    f"Personal use limit reached ({compliance.total_verses_stored}/{compliance.personal_use_limit} verses)"
                )
            
            # Make API call for chapter
            api_reference = f"{book_name}.{chapter_number}"
            chapter_data = await self.nlt_api.get_chapter(api_reference, version_code)
            
            if not chapter_data:
                return self._format_error_response(f"Chapter not found: {chapter_key}")
                
            # Parse API response into BibleChapter format
            bible_chapter = self._parse_api_response(chapter_data, book_name, chapter_number, version_code)
            
            # Check if we can store this chapter
            can_store, reason = await self.storage.can_store_chapter(bible_chapter.verse_count)
            
            if can_store:
                # Store in database for future use
                stored = await self.storage.store_chapter(bible_chapter)
                if stored:
                    # Add to session cache
                    if version_code not in self.session_cache:
                        self.session_cache[version_code] = {}
                    self.session_cache[version_code][chapter_key] = bible_chapter
                    
                    logger.info(f"✅ Stored and cached: {chapter_key} ({bible_chapter.verse_count} verses)")
                    return self._format_chapter_response(bible_chapter, from_cache=False, stored=True)
                else:
                    logger.warning(f"⚠️ Failed to store chapter, returning API data only")
                    return self._format_chapter_response(bible_chapter, from_cache=False, stored=False)
            else:
                # Return API data without storing
                logger.warning(f"🚫 Cannot store {chapter_key}: {reason}")
                return self._format_chapter_response(bible_chapter, from_cache=False, stored=False, 
                                                   compliance_warning=reason)
                
        except Exception as e:
            logger.error(f"❌ Failed to fetch {chapter_key}: {e}")
            return self._format_error_response(f"Failed to load chapter: {str(e)}")
            
    async def search_bible(self, query: str, version_code: str = 'NLT', search_cached_only: bool = False) -> Dict[str, Any]:
        """
        Search Bible content with option to search cached content only.
        """
        try:
            results = []
            
            if search_cached_only:
                # Search only cached chapters (instant, no API calls)
                results = await self._search_cached_content(query, version_code)
                logger.info(f"🔍 Cached search for '{query}': {len(results)} results")
            else:
                # Use API search (may trigger compliance limits)
                compliance = await self.storage.get_compliance_status()
                if compliance.is_compliant:
                    api_results = await self.nlt_api.search(query, version_code)
                    results = self._format_search_results(api_results)
                    logger.info(f"🔍 API search for '{query}': {len(results)} results")
                else:
                    # Fall back to cached search if over limit
                    results = await self._search_cached_content(query, version_code)
                    logger.info(f"🔍 Compliance fallback search for '{query}': {len(results)} results")
                    
            return {
                'success': True,
                'query': query,
                'version': version_code,
                'results': results,
                'searched_cached_only': search_cached_only or not (await self.storage.get_compliance_status()).is_compliant,
                'result_count': len(results)
            }
            
        except Exception as e:
            logger.error(f"❌ Search failed for '{query}': {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'version': version_code,
                'results': []
            }
            
    async def get_navigation_data(self) -> Dict[str, Any]:
        """Get complete navigation data for Bible interface"""
        try:
            # Load books metadata if not already loaded
            if not self.books_metadata:
                self.books_metadata = await self.storage.get_books_metadata()
                
            # Organize books by testament and category
            old_testament = []
            new_testament = []
            
            for book in self.books_metadata:
                book_data = {
                    'id': book['book_number'],
                    'name': book['book_name'],
                    'abbrev': book['book_abbrev'],
                    'category': book['category'],
                    'color_code': book['color_code'],
                    'total_chapters': book['total_chapters']
                }
                
                if book['testament'] == 'OT':
                    old_testament.append(book_data)
                else:
                    new_testament.append(book_data)
                    
            # Get compliance status and convert to dict
            compliance_status = await self.storage.get_compliance_status()
            compliance_dict = {
                'total_verses_stored': compliance_status.total_verses_stored,
                'total_chapters_stored': compliance_status.total_chapters_stored,
                'personal_use_limit': compliance_status.personal_use_limit,
                'license_mode': compliance_status.license_mode,
                'is_compliant': compliance_status.is_compliant,
                'last_updated': compliance_status.last_updated.isoformat() if compliance_status.last_updated else None
            }
            
            return {
                'success': True,
                'old_testament': old_testament,
                'new_testament': new_testament,
                'total_books': len(self.books_metadata),
                'compliance': compliance_dict
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get navigation data: {e}")
            return {
                'success': False,
                'error': str(e),
                'old_testament': [],
                'new_testament': []
            }
            
    async def get_usage_statistics(self) -> Dict[str, Any]:
        """Get comprehensive usage statistics"""
        try:
            stats = await self.storage.get_usage_statistics()
            
            # Add session cache info
            cache_stats = {}
            for version, chapters in self.session_cache.items():
                cache_stats[version] = len(chapters)
                
            stats['session_cache'] = cache_stats
            stats['total_cached_versions'] = len(self.session_cache)
            
            return {
                'success': True,
                'statistics': stats
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get usage statistics: {e}")
            return {
                'success': False,
                'error': str(e)
            }
            
    # Private helper methods
    
    def _identify_missing_chapters(self, version_code: str) -> List[str]:
        """Identify chapters not yet cached for a version"""
        missing = []
        cached_keys = set(self.session_cache.get(version_code, {}).keys())
        
        for book in self.books_metadata:
            for chapter_num in range(1, book['total_chapters'] + 1):
                chapter_key = f"{book['book_name']}.{chapter_num}"
                if chapter_key not in cached_keys:
                    missing.append(chapter_key)
                    
        return missing
        
    def _parse_api_response(self, api_data: Dict, book_name: str, chapter_number: int, version_code: str) -> BibleChapter:
        """Parse NLT API response into BibleChapter format"""
        # This would contain the actual HTML parsing logic
        # For now, return a structured format
        
        # Find book abbreviation
        book_abbrev = None
        for book in self.books_metadata:
            if book['book_name'] == book_name:
                book_abbrev = book['book_abbrev']
                break
                
        # Parse verses from API response (placeholder)
        verses = api_data.get('verses', [])
        if not verses:
            # If no verses provided, create placeholder
            verses = [{'number': 1, 'text': 'Verse content needs HTML parsing implementation'}]
            
        return BibleChapter(
            book_name=book_name,
            book_abbrev=book_abbrev or book_name[:3].upper(),
            chapter_number=chapter_number,
            version_code=version_code,
            verses=verses,
            verse_count=len(verses),
            api_reference=api_data.get('reference', f"{book_name}.{chapter_number}"),
            raw_html=api_data.get('html'),
            api_url=api_data.get('api_url')
        )
        
    def _format_chapter_response(self, chapter: BibleChapter, from_cache: bool = True, 
                                stored: bool = None, compliance_warning: str = None) -> Dict[str, Any]:
        """Format chapter data for frontend consumption"""
        return {
            'success': True,
            'book': chapter.book_name,
            'book_abbrev': chapter.book_abbrev,
            'chapter': chapter.chapter_number,
            'version': chapter.version_code,
            'verses': chapter.verses,
            'verse_count': chapter.verse_count,
            'from_cache': from_cache,
            'stored': stored,
            'compliance_warning': compliance_warning,
            'api_reference': chapter.api_reference
        }
        
    def _format_error_response(self, error_message: str) -> Dict[str, Any]:
        """Format error response"""
        return {
            'success': False,
            'error': error_message,
            'verses': [],
            'verse_count': 0
        }
        
    async def _search_cached_content(self, query: str, version_code: str) -> List[Dict[str, Any]]:
        """Search within cached chapters only"""
        results = []
        query_lower = query.lower()
        
        cached_chapters = self.session_cache.get(version_code, {})
        
        for chapter_key, chapter in cached_chapters.items():
            for verse in chapter.verses:
                if query_lower in verse.get('text', '').lower():
                    results.append({
                        'reference': f"{chapter.book_name} {chapter.chapter_number}:{verse.get('number', 1)}",
                        'book': chapter.book_name,
                        'chapter': chapter.chapter_number,
                        'verse': verse.get('number', 1),
                        'text': verse.get('text', ''),
                        'version': version_code,
                        'from_cache': True
                    })
                    
        return results[:50]  # Limit results
        
    def _format_search_results(self, api_results: List[Dict]) -> List[Dict[str, Any]]:
        """Format API search results"""
        return [
            {
                'reference': result.get('reference', ''),
                'book': result.get('book', ''),
                'chapter': result.get('chapter', 1),
                'verse': result.get('verse', 1),
                'text': result.get('text', ''),
                'version': result.get('version', 'NLT'),
                'from_cache': False
            }
            for result in api_results
        ]