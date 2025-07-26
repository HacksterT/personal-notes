"""
NLT API Service - Backend Implementation
Handles communication with the NLT API for Bible content with HTML parsing.

This is the backend counterpart to the frontend NLT service, designed for
server-side operations and database integration.
"""

import asyncio
import httpx
import re
import html
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class NLTApiService:
    """Backend NLT API service with HTML parsing capabilities"""
    
    def __init__(self, api_key: str):
        self.base_url = 'https://api.nlt.to/api'
        self.api_key = api_key
        self.rate_limit_delay = 0.1  # 100ms between requests
        self.last_request_time = 0
            
    async def _rate_limit(self):
        """Enforce rate limiting between requests"""
        import time
        now = time.time()
        time_since_last = now - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Make HTTP request to NLT API"""
        await self._rate_limit()
        
        # Add API key to parameters
        params['key'] = self.api_key
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    content = response.text
                    logger.debug(f"✅ API request successful: {endpoint}")
                    return content
                else:
                    logger.error(f"❌ API request failed: {response.status_code} - {response.text}")
                    raise Exception(f"API request failed: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"❌ Network error for {endpoint}: {e}")
            raise
            
    async def get_chapter(self, api_reference: str, version: str = 'NLT') -> Optional[Dict[str, Any]]:
        """
        Get a complete Bible chapter from the NLT API.
        
        Args:
            api_reference: Chapter reference like 'John.3' or 'Genesis.1'
            version: Bible version (NLT, KJV, NLTUK, NTV)
            
        Returns:
            Dictionary with parsed chapter data or None if failed
        """
        try:
            logger.info(f"📡 Fetching {api_reference} ({version}) from NLT API")
            
            html_content = await self._make_request('/passages', {
                'ref': api_reference,
                'version': version
            })
            
            # Parse the HTML response
            chapter_data = self._parse_chapter_html(html_content, api_reference, version)
            
            if chapter_data:
                logger.info(f"✅ Parsed {api_reference}: {len(chapter_data['verses'])} verses")
                return chapter_data
            else:
                logger.warning(f"⚠️ Failed to parse {api_reference}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Failed to get chapter {api_reference}: {e}")
            return None
            
    async def search(self, query: str, version: str = 'NLT') -> List[Dict[str, Any]]:
        """
        Search Bible content using NLT API.
        
        Args:
            query: Search terms
            version: Bible version to search
            
        Returns:
            List of search result dictionaries
        """
        try:
            logger.info(f"🔍 Searching for '{query}' in {version}")
            
            html_content = await self._make_request('/search', {
                'text': query,
                'version': version
            })
            
            # Parse search results
            results = self._parse_search_html(html_content, version)
            
            logger.info(f"✅ Search returned {len(results)} results for '{query}'")
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed for '{query}': {e}")
            return []
            
    def _parse_chapter_html(self, html_content: str, api_reference: str, version: str) -> Optional[Dict[str, Any]]:
        """
        Parse HTML response from passages endpoint into structured chapter data.
        
        Extracts individual verses from <verse_export> tags with proper text cleaning.
        """
        try:
            # Extract book and chapter from reference
            parts = api_reference.split('.')
            book_name = parts[0]
            chapter_number = int(parts[1]) if len(parts) > 1 else 1
            
            verses = []
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all verse_export elements - each contains one verse
            verse_elements = soup.find_all('verse_export')
            
            if verse_elements:
                logger.debug(f"🔍 Found {len(verse_elements)} verse elements in HTML")
                
                for verse_elem in verse_elements:
                    try:
                        # Extract verse number from the 'vn' attribute or from <span class="vn">
                        verse_num = verse_elem.get('vn')
                        if not verse_num:
                            # Fallback: look for <span class="vn"> inside the element
                            vn_span = verse_elem.find('span', class_='vn')
                            if vn_span:
                                verse_num = vn_span.get_text(strip=True)
                        
                        if not verse_num:
                            continue
                            
                        verse_number = int(verse_num)
                        
                        # Remove footnotes and their content
                        for footnote in verse_elem.find_all(['a', 'span'], class_=['a-tn', 'tn']):
                            footnote.decompose()
                        
                        # Remove verse number spans to avoid duplication
                        for vn_span in verse_elem.find_all('span', class_='vn'):
                            vn_span.decompose()
                        
                        # Remove headers and subheadings
                        for header in verse_elem.find_all(['h2', 'h3'], class_=['chapter-number', 'subhead', 'bk_ch_vs_header']):
                            header.decompose()
                        
                        # Get clean text content
                        verse_text = verse_elem.get_text(separator=' ', strip=True)
                        
                        # Clean up the text
                        verse_text = html.unescape(verse_text)
                        verse_text = re.sub(r'\s+', ' ', verse_text)  # Normalize whitespace
                        verse_text = verse_text.strip()
                        
                        if verse_text and len(verse_text) > 3:  # Filter out very short content
                            # Create preview (first 40 characters + ellipsis)
                            preview = verse_text[:40] + '...' if len(verse_text) > 40 else verse_text
                            
                            verses.append({
                                'number': verse_number,
                                'text': verse_text,
                                'preview': preview
                            })
                            
                    except (ValueError, AttributeError) as e:
                        logger.warning(f"⚠️ Skipping malformed verse element: {e}")
                        continue
                        
            else:
                logger.warning(f"⚠️ No verse_export elements found, trying fallback parsing")
                
                # Fallback: Look for <span class="vn"> elements directly
                verse_spans = soup.find_all('span', class_='vn')
                
                if verse_spans:
                    for i, vn_span in enumerate(verse_spans):
                        try:
                            verse_num = int(vn_span.get_text(strip=True))
                            
                            # Get the parent element and extract text after the verse number
                            parent = vn_span.parent
                            if parent:
                                # Remove footnotes
                                for footnote in parent.find_all(['a', 'span'], class_=['a-tn', 'tn']):
                                    footnote.decompose()
                                
                                # Get text and clean it
                                verse_text = parent.get_text(separator=' ', strip=True)
                                # Remove the verse number from the beginning
                                verse_text = re.sub(rf'^{verse_num}\s*', '', verse_text).strip()
                                
                                if verse_text and len(verse_text) > 3:
                                    preview = verse_text[:40] + '...' if len(verse_text) > 40 else verse_text
                                    verses.append({
                                        'number': verse_num,
                                        'text': verse_text,
                                        'preview': preview
                                    })
                                    
                        except (ValueError, AttributeError) as e:
                            logger.warning(f"⚠️ Skipping verse span {i}: {e}")
                            continue
                
                if not verses:
                    # Final fallback: create single verse with cleaned HTML
                    plain_text = soup.get_text(separator=' ', strip=True)
                    plain_text = html.unescape(plain_text)
                    plain_text = re.sub(r'\s+', ' ', plain_text).strip()
                    
                    if plain_text:
                        preview = plain_text[:40] + '...' if len(plain_text) > 40 else plain_text
                        verses = [{
                            'number': 1,
                            'text': plain_text,
                            'preview': preview
                        }]
            
            # Sort verses by number to ensure correct order
            verses.sort(key=lambda v: v['number'])
            
            logger.info(f"✅ Parsed {len(verses)} verses from {api_reference}")
            
            return {
                'reference': api_reference,
                'book': book_name,
                'chapter': chapter_number,
                'version': version,
                'verses': verses,
                'verse_count': len(verses),
                'html': html_content,
                'api_url': f"{self.base_url}/passages?ref={api_reference}&version={version}&key={self.api_key}"
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to parse chapter HTML: {e}")
            return None
            
    def _parse_search_html(self, html_content: str, version: str) -> List[Dict[str, Any]]:
        """
        Parse HTML response from search endpoint into structured results.
        
        Placeholder implementation - real version would parse search result HTML.
        """
        try:
            results = []
            
            # Simple parsing for search results
            # Real implementation would parse the specific HTML structure of search results
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Look for elements that might contain search results
            # This is a very basic implementation
            result_elements = soup.find_all(['div', 'p'], class_=re.compile(r'result|passage|verse', re.I))
            
            for i, element in enumerate(result_elements[:20]):  # Limit to first 20
                text = element.get_text(strip=True)
                if len(text) > 10:  # Filter out very short texts
                    results.append({
                        'reference': f"Search Result {i+1}",  # Would extract actual reference
                        'book': 'Unknown',  # Would extract from HTML
                        'chapter': 1,  # Would extract from HTML
                        'verse': 1,  # Would extract from HTML
                        'text': text,
                        'version': version
                    })
                    
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to parse search HTML: {e}")
            return []
            
    async def parse_reference(self, reference: str) -> Optional[Dict[str, Any]]:
        """Parse a Bible reference string using the NLT API"""
        try:
            logger.debug(f"🔍 Parsing reference: {reference}")
            
            # The parse endpoint returns JSON, not HTML
            params = {'ref': reference, 'key': self.api_key}
            url = f"{self.base_url}/parse"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    json_data = response.json()
                    logger.debug(f"✅ Parsed reference: {reference}")
                    return json_data
                else:
                    logger.error(f"❌ Failed to parse reference: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Reference parsing error: {e}")
            return None