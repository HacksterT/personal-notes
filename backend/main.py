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
from services.storage_service import StorageService
from services.file_processor import FileProcessor

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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage service instance
storage_service_instance = None

async def get_storage_service_instance() -> StorageService:
    """Dependency to provide storage service instance"""
    return storage_service_instance

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global storage_service_instance
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "postgresql://dev_user:dev_password@localhost:5432/sermon_organizer_dev")
    
    # Initialize storage service
    storage_service_instance = StorageService(database_url)
    await storage_service_instance.initialize()
    
    logger.info("✅ Storage service initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if storage_service_instance:
        await storage_service_instance.close()
    logger.info("🔒 Storage service closed")

# Override the dependency in storage routes
app.dependency_overrides[get_storage_service] = get_storage_service_instance

# Include API routes
app.include_router(storage_router)
app.include_router(profile_router)
app.include_router(sermon_router, prefix="/api/sermon")
app.include_router(chat_router, prefix="/api/chat")

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