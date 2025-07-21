# backend/api/storage_routes.py
"""
FastAPI routes for content storage and management
Replaces IndexedDB with reliable PostgreSQL backend
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Dict, Any, Optional
import json
import uuid
import asyncio
from datetime import datetime
from io import BytesIO
import logging

from services.storage_service import StorageService
from services.file_processor import FileProcessor
from services.analysis_service import analysis_service

logger = logging.getLogger(__name__)

# Use a fixed UUID for single-user setup to ensure consistency across restarts
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

# Create router
storage_router = APIRouter(prefix="/api/storage", tags=["storage"])

# Dependency to get storage service (you'll inject this in main.py)
async def get_storage_service() -> StorageService:
    # This will be injected via dependency override in main.py
    pass

@storage_router.post("/upload")
async def upload_content(
    files: List[UploadFile] = File(...),
    category: str = Form(...),
    storage_service: StorageService = Depends(get_storage_service)
):
    """Upload and process content files"""
    try:
        processor = FileProcessor()
        uploaded_items = []
        
        for file in files:
            # Read file content
            content_bytes = await file.read()
            
            # Process file based on type
            processed_data = await processor.process_file(
                filename=file.filename,
                content_bytes=content_bytes,
                file_type=file.content_type
            )
            
            # Add metadata
            content_data = {
                'title': processed_data.get('title', file.filename),
                'category': category,
                'content': processed_data['content'],
                'passage': processed_data.get('passage'),
                'tags': processed_data.get('tags', []),
                'word_count': processed_data.get('word_count', 0),
                'size_bytes': len(content_bytes),
                'file_type': file.content_type
            }
            
            # Store in database (using a default user ID for single-user setup)
            content_id = await storage_service.store_content(
                user_id=DEFAULT_USER_ID,
                content_data=content_data
            )
            
            # Trigger AI theological analysis (non-blocking)
            await analysis_service.trigger_analysis(
                content_id=content_id,
                text_content=processed_data['content'],
                title=processed_data.get('title'),
                category=category,
                storage_service=storage_service
            )
            
            uploaded_items.append({
                'id': content_id,
                'title': content_data['title'],
                'category': category,
                'status': 'success'
            })
            
            logger.info(f"Uploaded file: {file.filename} -> {content_id}")
        
        return {
            'success': True,
            'uploaded_count': len(uploaded_items),
            'items': uploaded_items
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@storage_router.get("/content")
async def list_content(
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    storage_service: StorageService = Depends(get_storage_service)
):
    """List user's content with optional filtering"""
    try:
        content_items = await storage_service.list_content(
            user_id=DEFAULT_USER_ID,
            category=category,
            limit=limit,
            offset=offset
        )
        
        # Convert datetime objects to ISO strings for JSON serialization
        for item in content_items:
            if item.get('date_created'):
                item['date_created'] = item['date_created'].isoformat()
            if item.get('date_modified'):
                item['date_modified'] = item['date_modified'].isoformat()
        
        return {
            'items': content_items,
            'count': len(content_items)
        }
        
    except Exception as e:
        logger.error(f"Failed to list content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.get("/content/{content_id}")
async def get_content(
    content_id: str,
    storage_service: StorageService = Depends(get_storage_service)
):
    """Get specific content item"""
    try:
        content = await storage_service.get_content(
            user_id=DEFAULT_USER_ID,
            content_id=content_id
        )
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Convert datetime objects
        if content.get('date_created'):
            content['date_created'] = content['date_created'].isoformat()
        if content.get('date_modified'):
            content['date_modified'] = content['date_modified'].isoformat()
        
        return content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content {content_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.put("/content/{content_id}")
async def update_content(
    content_id: str,
    content_data: dict,
    storage_service: StorageService = Depends(get_storage_service)
):
    """Update existing content"""
    try:
        # Verify content exists
        existing = await storage_service.get_content(DEFAULT_USER_ID, content_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Add ID to content data to ensure update
        content_data['id'] = content_id
        
        # Update word count and size if content changed
        content_changed = False
        if 'content' in content_data:
            content_data['word_count'] = len(content_data['content'].split())
            content_data['size_bytes'] = len(content_data['content'].encode('utf-8'))
            content_changed = True
        
        await storage_service.store_content(
            user_id=DEFAULT_USER_ID,
            content_data=content_data
        )
        
        # If content changed, trigger re-analysis
        if content_changed:
            await analysis_service.trigger_analysis(
                content_id=content_id,
                text_content=content_data['content'],
                title=content_data.get('title'),
                category=content_data.get('category'),
                storage_service=storage_service
            )
        
        return {'success': True, 'message': 'Content updated'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update content {content_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.delete("/content/{content_id}")
async def delete_content(
    content_id: str,
    storage_service: StorageService = Depends(get_storage_service)
):
    """Delete content item"""
    try:
        success = await storage_service.delete_content(
            user_id=DEFAULT_USER_ID,
            content_id=content_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Content not found")
        
        return {'success': True, 'message': 'Content deleted'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete content {content_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.get("/search")
async def search_content(
    q: str,
    category: Optional[str] = None,
    limit: int = 50,
    storage_service: StorageService = Depends(get_storage_service)
):
    """Search content with full-text search"""
    try:
        if not q.strip():
            return {'items': [], 'count': 0}
        
        results = await storage_service.search_content(
            user_id=DEFAULT_USER_ID,
            query=q.strip(),
            category=category,
            limit=limit
        )
        
        # Convert datetime objects
        for item in results:
            if item.get('date_created'):
                item['date_created'] = item['date_created'].isoformat()
            if item.get('date_modified'):
                item['date_modified'] = item['date_modified'].isoformat()
        
        return {
            'items': results,
            'count': len(results),
            'query': q
        }
        
    except Exception as e:
        logger.error(f"Search failed for query '{q}': {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.get("/usage")
async def get_storage_usage(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Get storage usage statistics"""
    try:
        usage = await storage_service.get_storage_usage(DEFAULT_USER_ID)
        
        # Convert datetime
        if usage.get('last_updated'):
            usage['last_updated'] = usage['last_updated'].isoformat()
        
        # Add formatted sizes for frontend
        usage['formatted'] = {
            'total_size': _format_bytes(usage['total_bytes']),
            'percentage_used': min(100, (usage['total_bytes'] / (5 * 1024**3)) * 100)  # 5GB limit
        }
        
        return usage
        
    except Exception as e:
        logger.error(f"Failed to get storage usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.get("/categories")
async def get_categories():
    """Get available content categories"""
    categories = [
        {'value': 'sermons', 'label': 'Sermons'},
        {'value': 'study-notes', 'label': 'Study Notes'},
        {'value': 'research', 'label': 'Research'},
        {'value': 'journal', 'label': 'Journal'},
        {'value': 'bookmarks', 'label': 'Bookmarks'}
    ]
    return {'categories': categories}

@storage_router.post("/export")
async def export_user_data(
    storage_service: StorageService = Depends(get_storage_service)
):
    """Export all user data as JSON"""
    try:
        export_data = await storage_service.export_user_data(DEFAULT_USER_ID)
        
        # Convert datetime objects to strings
        def convert_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(item) for item in obj]
            return obj
        
        export_data = convert_datetime(export_data)
        
        # Create JSON response
        json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
        json_bytes = json_str.encode('utf-8')
        
        return StreamingResponse(
            BytesIO(json_bytes),
            media_type='application/json',
            headers={
                'Content-Disposition': 'attachment; filename="sermon_organizer_export.json"'
            }
        )
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.post("/import")
async def import_user_data(
    file: UploadFile = File(...),
    storage_service: StorageService = Depends(get_storage_service)
):
    """Import user data from JSON file"""
    try:
        # Read and parse JSON
        content_bytes = await file.read()
        import_data = json.loads(content_bytes.decode('utf-8'))
        
        # Extract content items
        content_items = import_data.get('content_items', [])
        
        # Import items
        imported_ids = await storage_service.bulk_import(
            user_id=DEFAULT_USER_ID,
            content_items=content_items
        )
        
        return {
            'success': True,
            'imported_count': len(imported_ids),
            'message': f'Successfully imported {len(imported_ids)} items'
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@storage_router.put("/content/{content_id}/summary")
async def update_summary(
    content_id: str,
    summary_data: Dict[str, Any],
    storage_service: StorageService = Depends(get_storage_service)
):
    """Update content summary - called by AI service after processing"""
    try:
        # Extract data from AI service payload
        summary = summary_data.get('summary')
        processing_time = summary_data.get('processing_time_seconds')
        
        if not summary:
            raise HTTPException(status_code=400, detail="Summary is required")
        
        # Update summary in database
        success = await storage_service.update_summary(
            content_id=content_id,
            summary=summary,
            processing_time_seconds=processing_time
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Content not found")
        
        logger.info(f"Summary updated for {content_id} (processing time: {processing_time}s)")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summary update failed for {content_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Summary update failed: {str(e)}")

# Helper functions
def _format_bytes(bytes_value: int) -> str:
    """Format bytes as human-readable string"""
    if bytes_value == 0:
        return "0 B"
    
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    size = bytes_value
    unit_index = 0
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    return f"{size:.1f} {units[unit_index]}"