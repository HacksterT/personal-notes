# backend/main.py
"""
FastAPI app with PostgreSQL storage - single user, no authentication
"""

import os
import logging
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import sys
import os
sys.path.append('/app/backend')

from api.storage_routes import storage_router, get_storage_service
from api.profile_routes import profile_router
from api.sermon_routes import sermon_router
from api.chat_routes import chat_router
from api.bible_routes import bible_router, get_bible_session_service
from services.storage_service import StorageService
from services.file_processor import FileProcessor
from services.bible_storage_service import BibleStorageService
from services.bible_session_service import BibleSessionService
from services.nlt_api_service import NLTApiService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the path for static files
STATIC_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "static"))

# Create FastAPI app
app = FastAPI(
    title="Sermon Organizer API",
    description="Backend for file storage with PostgreSQL",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
storage_service_instance = None
bible_session_service_instance = None

async def get_storage_service_instance() -> StorageService:
    """Dependency to provide storage service instance"""
    return storage_service_instance

async def get_bible_session_service_instance() -> BibleSessionService:
    """Dependency to provide Bible session service instance"""
    return bible_session_service_instance

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global storage_service_instance, bible_session_service_instance
    
    # Get database URLs from environment
    database_url = os.getenv("DATABASE_URL", "postgresql://dev_user:dev_password@localhost:5432/sermon_organizer_dev")
    bible_cache_db_url = os.getenv("BIBLE_CACHE_DATABASE_URL", "postgresql://bible_user:bible_password@bible-cache-db:5432/bible_content_cache")
    nlt_api_key = os.getenv("NLT_API_KEY", "")
    
    # Initialize storage service
    storage_service_instance = StorageService(database_url)
    await storage_service_instance.initialize()
    logger.info("✅ Storage service initialized")
    
    # Initialize Bible services
    try:
        # Parse Bible cache database config
        bible_db_config = {
            'user': 'bible_user',
            'password': 'bible_password',
            'database': 'bible_content_cache',
            'host': 'bible-cache-db',
            'port': 5432
        }
        
        # Initialize Bible storage service
        bible_storage_service = BibleStorageService(bible_db_config)
        await bible_storage_service.initialize()
        logger.info("✅ Bible storage service initialized")
        
        # Initialize NLT API service (no async initialization needed)
        nlt_api_service = NLTApiService(nlt_api_key)
        logger.info("✅ NLT API service initialized")
        
        # Initialize Bible session service (orchestrates the other two)
        bible_session_service_instance = BibleSessionService(bible_storage_service, nlt_api_service)
        logger.info("✅ Bible session service initialized")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Bible services: {e}")
        # Don't fail startup - let the app run without Bible features
        bible_session_service_instance = None

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if storage_service_instance:
        await storage_service_instance.close()
        
    # Cleanup Bible services
    if bible_session_service_instance:
        # Bible session service doesn't have a close method - it orchestrates others
        # Close the underlying services
        if hasattr(bible_session_service_instance, 'storage'):
            await bible_session_service_instance.storage.close()
        # NLT API service uses context managers, no close method needed
            
    logger.info("🔒 All services closed")

# Override dependencies for dependency injection
app.dependency_overrides[get_storage_service] = get_storage_service_instance
app.dependency_overrides[get_bible_session_service] = get_bible_session_service_instance

# Include API routes
app.include_router(storage_router)
app.include_router(profile_router)
app.include_router(sermon_router, prefix="/api/sermon")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(bible_router, prefix="/api/bible")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sermon-organizer-api",
        "version": "1.0.0",
        "database": "postgresql" if storage_service_instance else "not_connected"
    }

# Custom StaticFiles class to handle SPA routing
class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            # Try to get the file
            return await super().get_response(path, scope)
        except HTTPException as ex:
            # If the file is not found, serve index.html for SPA routing
            if ex.status_code == 404:
                # Ensure the path is updated to serve index.html
                return await super().get_response("index.html", scope)
            raise ex

# Serve static files and the React app
if os.path.exists(STATIC_DIR) and os.path.isdir(STATIC_DIR):
    # Mount the SPAStaticFiles handler.
    app.mount("/", SPAStaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    logger.warning(f"Static directory not found at {STATIC_DIR}. Frontend will not be served.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        timeout_keep_alive=300
    )