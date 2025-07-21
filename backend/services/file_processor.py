# backend/services/file_processor.py
"""
File processing service for various content types
Handles text extraction, metadata generation, and Bible reference detection
"""

import re
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging
from dataclasses import dataclass
import io

# For different file type processing
try:
    from docx import Document  # python-docx
except ImportError:
    Document = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import markdown
except ImportError:
    markdown = None

logger = logging.getLogger(__name__)

@dataclass
class ProcessedContent:
    """Structure for processed file content"""
    title: str
    content: str
    word_count: int
    passage: Optional[str] = None
    tags: List[str] = None
    file_type: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}

class FileProcessor:
    """Process various file types and extract theological content"""
    
    def __init__(self):
        # Bible books for reference detection
        self.bible_books = [
            # Old Testament
            'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
            'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
            '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
            'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
            'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
            'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
            'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
            # New Testament
            'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
            '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
            'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
            '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
            'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
            'Jude', 'Revelation'
        ]
        
        # Common theological terms for tag generation
        self.theological_terms = [
            'salvation', 'grace', 'faith', 'love', 'hope', 'peace', 'joy',
            'forgiveness', 'redemption', 'sanctification', 'justification',
            'eternal life', 'kingdom', 'gospel', 'cross', 'resurrection',
            'trinity', 'christ', 'jesus', 'god', 'holy spirit', 'prayer',
            'worship', 'discipleship', 'stewardship', 'evangelism', 'mission',
            'church', 'community', 'fellowship', 'service', 'ministry',
            'wisdom', 'truth', 'righteousness', 'holiness', 'mercy',
            'compassion', 'healing', 'restoration', 'transformation'
        ]
    
    async def process_file(self, filename: str, content_bytes: bytes, 
                          file_type: str) -> Dict[str, Any]:
        """Process file based on its type and extract content"""
        try:
            # Determine file extension
            file_ext = Path(filename).suffix.lower()
            
            # Extract text based on file type
            if file_ext == '.txt' or 'text/plain' in file_type:
                text_content = await self._process_text_file(content_bytes)
            elif file_ext == '.md' or 'markdown' in file_type:
                text_content = await self._process_markdown_file(content_bytes)
            elif file_ext == '.docx' or 'document' in file_type:
                text_content = await self._process_docx_file(content_bytes)
            elif file_ext == '.pdf' or 'pdf' in file_type:
                text_content = await self._process_pdf_file(content_bytes)
            else:
                # Fallback: try to decode as text
                text_content = content_bytes.decode('utf-8', errors='ignore')
            
            # Generate title from filename or content
            title = self._generate_title(filename, text_content)
            
            # Extract Bible references
            passages = self._extract_bible_references(text_content)
            main_passage = passages[0] if passages else None
            
            # Generate tags
            tags = self._generate_tags(text_content)
            
            # Calculate word count
            word_count = len(text_content.split())
            
            return {
                'title': title,
                'content': text_content,
                'word_count': word_count,
                'passage': main_passage,
                'tags': tags,
                'file_type': file_type,
                'metadata': {
                    'original_filename': filename,
                    'bible_references': passages,
                    'processed_at': asyncio.get_event_loop().time()
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            # Return basic content even if processing fails
            return {
                'title': Path(filename).stem,
                'content': content_bytes.decode('utf-8', errors='ignore'),
                'word_count': 0,
                'tags': [],
                'file_type': file_type,
                'metadata': {'error': str(e)}
            }
    
    async def _process_text_file(self, content_bytes: bytes) -> str:
        """Process plain text file"""
        return content_bytes.decode('utf-8', errors='ignore')
    
    async def _process_markdown_file(self, content_bytes: bytes) -> str:
        """Process Markdown file"""
        markdown_text = content_bytes.decode('utf-8', errors='ignore')
        
        if markdown:
            # Convert markdown to plain text (remove formatting)
            md = markdown.Markdown()
            html = md.convert(markdown_text)
            # Simple HTML tag removal
            import re
            text = re.sub('<[^<]+?>', '', html)
            return text
        else:
            # Fallback: return raw markdown
            return markdown_text
    
    async def _process_docx_file(self, content_bytes: bytes) -> str:
        """Process Word document"""
        if not Document:
            raise ImportError("python-docx not installed. Run: pip install python-docx")
        
        try:
            doc = Document(io.BytesIO(content_bytes))
            paragraphs = []
            
            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if text:
                    paragraphs.append(text)
            
            return '\n\n'.join(paragraphs)
            
        except Exception as e:
            logger.error(f"Error processing DOCX: {e}")
            raise
    
    async def _process_pdf_file(self, content_bytes: bytes) -> str:
        """Process PDF file"""
        if not PyPDF2:
            raise ImportError("PyPDF2 not installed. Run: pip install PyPDF2")
        
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            pages_text = []
            
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text.strip():
                    pages_text.append(text.strip())
            
            return '\n\n'.join(pages_text)
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise
    
    def _generate_title(self, filename: str, content: str) -> str:
        """Generate title from filename or content"""
        # First try to extract title from content
        lines = content.split('\n')
        
        # Look for title patterns in first few lines
        for line in lines[:5]:
            line = line.strip()
            if line:
                # Check if it looks like a title (short, capitalized, etc.)
                if len(line) < 100 and not line.endswith('.'):
                    # Remove common markdown/formatting
                    title = re.sub(r'^#+\s*', '', line)  # Remove markdown headers
                    title = re.sub(r'\*+', '', title)   # Remove asterisks
                    if title:
                        return title
        
        # Fallback to filename without extension
        return Path(filename).stem.replace('_', ' ').replace('-', ' ').title()
    
    def _extract_bible_references(self, content: str) -> List[str]:
        """Extract Bible references from content"""
        references = []
        
        # Create pattern for Bible references
        books_pattern = '|'.join(re.escape(book) for book in self.bible_books)
        
        # Pattern: Book Chapter:Verse or Book Chapter:Verse-Verse
        pattern = rf'\b({books_pattern})\s+(\d+):(\d+)(?:-(\d+))?\b'
        
        matches = re.finditer(pattern, content, re.IGNORECASE)
        
        for match in matches:
            book = match.group(1)
            chapter = match.group(2)
            start_verse = match.group(3)
            end_verse = match.group(4)
            
            if end_verse:
                ref = f"{book} {chapter}:{start_verse}-{end_verse}"
            else:
                ref = f"{book} {chapter}:{start_verse}"
            
            if ref not in references:
                references.append(ref)
        
        # Also look for chapter-only references
        chapter_pattern = rf'\b({books_pattern})\s+(\d+)\b'
        chapter_matches = re.finditer(chapter_pattern, content, re.IGNORECASE)
        
        for match in chapter_matches:
            book = match.group(1)
            chapter = match.group(2)
            ref = f"{book} {chapter}"
            
            # Only add if we don't already have a more specific reference
            if not any(existing.startswith(ref + ':') for existing in references):
                references.append(ref)
        
        return references[:10]  # Limit to first 10 references
    
    def _generate_tags(self, content: str) -> List[str]:
        """Generate tags based on content analysis"""
        tags = []
        content_lower = content.lower()
        
        # Find theological terms
        for term in self.theological_terms:
            if term.lower() in content_lower:
                tags.append(term)
        
        # Add content-based tags
        if 'sermon' in content_lower:
            tags.append('sermon')
        if 'study' in content_lower:
            tags.append('bible study')
        if 'prayer' in content_lower:
            tags.append('prayer')
        if 'worship' in content_lower:
            tags.append('worship')
        
        # Analyze content themes (simple keyword detection)
        theme_keywords = {
            'christmas': ['christmas', 'nativity', 'birth of christ', 'bethlehem'],
            'easter': ['easter', 'resurrection', 'crucifixion', 'cross'],
            'pentecost': ['pentecost', 'holy spirit', 'tongues', 'flames'],
            'advent': ['advent', 'waiting', 'preparation', 'coming'],
            'discipleship': ['disciple', 'follow', 'learn', 'teach'],
            'evangelism': ['evangel', 'witness', 'share', 'gospel'],
            'stewardship': ['steward', 'giving', 'tithe', 'resources'],
            'community': ['community', 'fellowship', 'together', 'unity'],
            'leadership': ['lead', 'serve', 'shepherd', 'guide']
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                tags.append(theme)
        
        # Remove duplicates and limit
        unique_tags = list(dict.fromkeys(tags))  # Preserves order
        return unique_tags[:5]  # Limit to 5 tags
    
    def validate_file_type(self, filename: str, file_type: str) -> bool:
        """Validate if file type is supported"""
        supported_extensions = ['.txt', '.md', '.docx', '.pdf']
        supported_mime_types = [
            'text/plain', 'text/markdown', 'application/markdown',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ]
        
        file_ext = Path(filename).suffix.lower()
        
        return (file_ext in supported_extensions or 
                any(mime in file_type for mime in supported_mime_types))
    
    def get_supported_formats(self) -> Dict[str, List[str]]:
        """Get list of supported file formats"""
        return {
            'text': ['.txt', 'text/plain'],
            'markdown': ['.md', 'text/markdown', 'application/markdown'],
            'word': ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'pdf': ['.pdf', 'application/pdf']
        }