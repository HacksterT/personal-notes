# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sermon Organizer is a FastAPI + React application for creating sermons, devotionals, and religious content using AI assistance. The project uses a hybrid architecture with PostgreSQL for main data storage and integrates with AI services (Grok primary, Claude fallback) for content generation.

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with SQLModel/SQLAlchemy for database operations
- **Database**: PostgreSQL (configured in Docker Compose)
- **AI Services**: Grok API (primary) and Claude API (fallback) for sermon generation
- **Authentication**: Currently single-user with no authentication system
- **File Structure**:
  - `backend/main.py`: Application entry point with CORS, static file serving
  - `backend/api/`: Route modules (sermon_routes.py, storage_routes.py, profile_routes.py, chat_routes.py)
  - `backend/services/`: Business logic (ai_service.py, grok_service.py, claude_service.py, etc.)

### Frontend (React + Vite)
- **Framework**: React 19 with Vite for development and building
- **State Management**: Zustand for client state
- **Styling**: Tailwind CSS
- **Key Libraries**: @tanstack/react-query, framer-motion, lucide-react, socket.io-client
- **Build Target**: Static files served by FastAPI backend

### Database
- PostgreSQL with async connections via asyncpg
- Database URL: `postgresql://dev_user:dev_password@db:5432/sermon_organizer_dev`
- Storage service handles file operations and metadata

## Development Commands

### Full Stack Development (Docker)
```bash
# Start all services (backend, frontend-dev, database)
docker compose up --build

# Access points:
# - Frontend dev server: http://localhost:5173
# - Backend API: http://localhost:8000
# - Database: localhost:5432
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (from project root)
cd backend
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Operations
```bash
# Connect to database (when running in Docker)
docker compose exec db psql -U dev_user -d sermon_organizer_dev

# Database migrations (if needed)
python backend/migrate_database.py
```

## Environment Variables

Required environment variables (set in .env or docker-compose):
- `DATABASE_URL`: PostgreSQL connection string
- `XAI_API_KEY`: API key for Grok AI service (primary)
- `CLAUDE_API_KEY`: API key for Claude AI service (fallback)

## Key Components

### AI Integration
- `grok_service.py`: Grok API integration for sermon generation and content analysis (primary)
- `claude_service.py`: Claude API integration for sermon generation and content analysis (fallback)
- `prompt_service.py`: Manages sermon generation prompts and validation
- Sermon generation supports multiple types, styles, lengths, and output formats

### Storage System
- `storage_service.py`: Handles file storage and database operations
- `file_processor.py`: Processes uploaded files and content
- Supports file uploads, content extraction, and metadata management

### API Routes
- `/api/sermon/generate`: POST endpoint for AI sermon generation
- `/api/storage/*`: File and content management endpoints
- `/api/profile/*`: User profile and settings
- `/api/chat/*`: Real-time chat/communication features
- `/health`: Health check endpoint

## File Organization Patterns

### Backend Services
All services follow dependency injection pattern and are async-compatible. Services are initialized in `main.py` startup event and shared via FastAPI dependencies.

### Frontend Components
- `components/`: Reusable React components
- `services/`: API client and external service integrations
- `styles/`: CSS and styling files
- Uses functional components with hooks

### Content Storage
- User content stored in PostgreSQL database
- File uploads handled through multipart form data
- Static assets served from `/app/static` directory in production

## AI Service Integration

The application integrates with AI providers using Grok-primary/Claude-fallback strategy:
- Grok API for primary sermon generation and content analysis
- Claude API as fallback service when Grok fails
- Prompt templates stored in `prompt_service.py`
- Logging of AI prompts in `backend/log_prompts/` directory

## Common Patterns

### Error Handling
- FastAPI HTTPException for API errors
- Structured error responses with `success`, `error`, and `code` fields
- Comprehensive logging using Python's logging module

### Async Operations
- All database operations are async using asyncpg
- FastAPI endpoints use async/await pattern
- Service classes designed for async operation

### Configuration
- Environment-based configuration using python-dotenv
- Docker Compose for development environment setup
- No authentication currently implemented (single-user system)