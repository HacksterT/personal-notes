# Sermon Organizer

A robust study tool for creating sermons, devotionals, and other religious content, powered by AI and grounded in biblical texts.

## Vision

Sermon Organizer aims to be the premier tool for religious leaders, scholars, and enthusiasts to create, organize, and enhance their sermon preparation process. By leveraging modern AI technologies while staying grounded in authoritative biblical texts, this platform bridges traditional theological study with cutting-edge technology.

## Features (Planned)

- **Multi-version Bible Database**: Vector database containing multiple translations and versions of the Bible for comprehensive study
- **AI-Assisted Content Creation**: Generate sermon outlines, talking points, and supporting materials
- **Personal Content Integration**: Upload and incorporate your own sermons, notes, and resources (Premium feature)
- **Contextual Understanding**: AI that understands theological concepts, biblical narratives, and religious contexts
- **Cross-referencing**: Automatically find related passages, themes, and concepts across biblical texts
- **Sermon Organization**: Tools to structure, save, and organize sermon content

## Technical Architecture

### Database Architecture (Hybrid Approach)

#### Neo4j Graph Database
- **Purpose**: Store relationships between biblical texts, theological concepts, and user content
- **Data Model**:
  - Nodes: Bible verses, chapters, books, sermons, notes, themes, concepts
  - Relationships: Cross-references, thematic connections, sermon-to-verse links
  - Properties: Text content, metadata (excluding vector embeddings)
- **Responsibilities**:
  - Hierarchical Bible structure (verse → chapter → book → testament)
  - Theological relationships and cross-references
  - User content organization and connections

#### ChromaDB Vector Database
- **Purpose**: Efficient storage and retrieval of vector embeddings for semantic search
- **Data Model**:
  - Collections: Bible verses, sermon content, user notes
  - Embeddings: Vector representations of text content
  - Metadata: Minimal information for retrieval (IDs, references)
- **Responsibilities**:
  - Semantic similarity search
  - RAG (Retrieval-Augmented Generation) operations
  - Efficient vector operations

### AI Components

- **Embedding Model**: Sentence transformers for converting text to vector embeddings
- **LLM Engine**: CUDA-accelerated LLama model for content generation
- **RAG Implementation**: Custom retrieval system using both Neo4j and ChromaDB

### Web Application

- **Backend**: FastAPI with Neo4j and ChromaDB integrations
- **Frontend**: React with Vite for modern, component-based UI
- **API Layer**: RESTful endpoints with WebSocket support for real-time interactions
- **UI Architecture**:
  - Three-panel "NotebookLM for Sermons" layout:
    - Bible Panel: Multi-version Bible with search and verse highlighting
    - Study Workspace: Rich text editor with theological content blocks
    - AI Assistant Panel: Context-aware chat interface with streaming responses
  - Component-based design with React
  - State management for complex theological content
  - WebSocket connections for real-time AI interactions
  - Progressive Web App capabilities for offline use

## RAG System Implementation

The project includes a complete Retrieval-Augmented Generation (RAG) system for theological content, optimized for local GPU acceleration on NVIDIA hardware. The RAG system consists of the following components:

### 1. Document Processor ([src/ai/rag/document_processor.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/document_processor.py:0:0-0:0))
- Handles loading and parsing of theological documents (PDF, text)
- Implements Bible verse-aware chunking to preserve verse integrity
- Extracts Bible references automatically from text
- Preserves metadata throughout the processing pipeline

### 2. Embedding Generator ([src/ai/rag/embedder.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/embedder.py:0:0-0:0))
- Uses SentenceTransformers for generating vector embeddings
- Supports GPU acceleration for faster processing
- Includes batch processing with progress tracking
- Preserves document metadata during embedding

### 3. Hybrid Retriever ([src/ai/rag/retriever.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/retriever.py:0:0-0:0))
- Implements hybrid retrieval combining ChromaDB vector search and Neo4j graph search
- Detects Bible references in queries for specialized retrieval
- Includes result reranking optimized for theological content
- Handles filters, metadata, and deduplication

### 4. Local LLM Integration ([src/ai/rag/llm.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/llm.py:0:0-0:0))
- Integrates with llama-cpp-python for GPU-accelerated inference
- Supports both standard and chat-based prompting
- Optimized for RTX GPUs with configurable GPU layer offloading
- Includes logging and performance metrics

### 5. Theological Prompts ([src/ai/rag/prompts.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/prompts.py:0:0-0:0))
- Specialized prompt templates for sermon preparation, Bible study, and verse analysis
- Audience-aware system prompts (pastor, student, general)
- Context integration for RAG responses
- Structured output formats for different theological use cases

### 6. RAG Pipeline ([src/ai/rag/pipeline.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/pipeline.py:0:0-0:0))
- Integrates all components into a complete RAG system
- Provides high-level methods for document processing, querying, sermon preparation
- Handles configuration through environment variables
- Includes performance logging and metadata tracking

### 7. Demo Script ([src/ai/rag/demo.py](cci:7://file:///C:/Projects/sermon-organizer/src/ai/rag/demo.py:0:0-0:0))
- Tests each component individually and the full pipeline
- Creates sample data if needed
- Configurable through command-line arguments

### Getting Started with the RAG System

1. **Environment Setup**:
   - Configure environment variables in `.env`:
     ```
     LLM_MODEL_PATH=C:/path/to/your/model.gguf
     EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
     CHROMA_COLLECTION=sermons
     USE_GPU=true
     LLM_CONTEXT_WINDOW=4096
     ```

2. **Model Download**:
   - Download a GGUF model suitable for your GPU (e.g., Llama-3-8B-Instruct-Q5_K_M.gguf)
   - Place in your configured model directory

3. **Testing**:
   - Run the demo script to verify all components:
     ```powershell
     python src/ai/rag/demo.py
     ```

4. **Usage Examples**:
   - Process theological documents: `pipeline.process_document("path/to/document.pdf")`
   - Query the system: `pipeline.query("What does John 3:16 teach us about God's love?")`
   - Generate sermon outlines: `pipeline.prepare_sermon("John 3:16-21", theme="God's Love")`

## Structured Work Plan

### Phase 1: Core Infrastructure (Weeks 1-4)

1. **Project Setup**
   - [x] Initialize repository
   - [ ] Set up development environment
   - [ ] Configure Django project structure
   - [ ] Set up Docker containers for Neo4j and ChromaDB

2. **Bible Data Integration**
   - [ ] Source and download public domain Bible versions (KJV, WEB)
   - [ ] Create data models for Bible content
   - [ ] Develop import scripts for Bible data
   - [ ] Generate embeddings for Bible verses

3. **Database Implementation**
   - [ ] Configure Neo4j schema and constraints
   - [ ] Set up ChromaDB collections
   - [ ] Implement data synchronization between databases
   - [ ] Create core repository classes for data access

### Phase 2: Search & Retrieval (Weeks 5-8)

1. **Search Functionality**
   - [ ] Implement semantic search using ChromaDB
   - [ ] Develop graph-based search using Neo4j
   - [ ] Create hybrid search combining both approaches
   - [ ] Build API endpoints for search operations

2. **RAG Implementation**
   - [x] Set up local LLama model with CUDA acceleration
   - [x] Implement context retrieval from databases
   - [x] Develop prompt engineering for sermon-related tasks
   - [x] Create content generation services

3. **Basic UI**
   - [ ] Design search interface
   - [ ] Implement Bible browser component
   - [ ] Create basic sermon workspace

### Phase 3: Sermon Creation Tools (Weeks 9-12)

1. **Sermon Workspace**
   - [ ] Develop sermon structure templates
   - [ ] Implement note-taking features
   - [ ] Create verse reference management
   - [ ] Build outline generation tools

2. **Content Assistance**
   - [ ] Implement AI-assisted content suggestions
   - [ ] Develop theological concept explanations
   - [ ] Create illustration and example generator
   - [ ] Build cross-reference suggester

3. **Organization Features**
   - [ ] Implement sermon categorization
   - [ ] Develop tagging and search features
   - [ ] Create sermon series management
   - [ ] Build export functionality (PDF, DOCX)

### Phase 4: User Content & Advanced Features (Weeks 13-16)

1. **User Content Integration**
   - [ ] Implement sermon upload functionality
   - [ ] Develop note import features
   - [ ] Create content processing pipeline
   - [ ] Build personal library management

2. **Advanced AI Features**
   - [ ] Implement personalized recommendations
   - [ ] Develop sermon analysis tools
   - [ ] Create theological consistency checking
   - [ ] Build advanced RAG with user content

3. **Collaboration Features**
   - [ ] Implement sharing functionality
   - [ ] Develop commenting and feedback
   - [ ] Create collaborative editing features
   - [ ] Build user permissions system

### Phase 5: Deployment & Optimization (Weeks 17-20)

1. **Azure Deployment**
   - [ ] Configure Azure resources
   - [ ] Set up CI/CD pipeline
   - [ ] Implement monitoring and logging
   - [ ] Develop backup and recovery procedures

2. **Performance Optimization**
   - [ ] Optimize database queries
   - [ ] Implement caching strategies
   - [ ] Improve AI response times
   - [ ] Enhance search performance

3. **Final Polishing**
   - [ ] Conduct user testing
   - [ ] Refine UI/UX based on feedback
   - [ ] Fix bugs and issues
   - [ ] Prepare for production launch

## Bible Version Sources

The project will initially use these public domain Bible versions:

1. **King James Version (KJV)**
2. **World English Bible (WEB)**
3. **American Standard Version (ASV)**
4. **Young's Literal Translation (YLT)**

Sources for Bible data:
- GitHub repositories with structured Bible data
- Public domain text sources
- API.Bible for additional versions (with proper licensing)

## Getting Started with Docker

### Building and running your application

When you're ready, start your application by running:
```bash
docker compose up --build
```

Your application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5432

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Python guide](https://docs.docker.com/language/python/)

## About

Sermon Organizer is owned and operated by [Your Name/Organization]. The official website is [sermonorganizer.com](https://sermonorganizer.com).

## License

[License information to be added]

## Contact

For inquiries, please contact [contact information to be added]