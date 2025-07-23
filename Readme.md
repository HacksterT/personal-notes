# Personal Notes Manager (FOR LOCAL USE ONLY)

A self-hosted personal note-taking application based on the Sermon Organizer codebase. This instance is completely isolated, with its own configuration, database, and deployment setup. It includes optional AI functionality to assist with content generation like blog posts or YouTube scripts.

## Features

- Web-based interface (React + FastAPI)
- Full data separation from other apps
- External PostgreSQL for backups and persistence
- Optional AI content generation
- Ready for local use

## Quick Start

Navigate to the project directory and run:

    docker compose up --build

Then open [http://localhost:8001](http://localhost:8001) in your browser.

**Note**: This builds a single production container with React frontend served by FastAPI backend.

## Environment Configuration

The `.env` file is already configured for this setup with:

- **Database**: PostgreSQL with copied content from original setup
- **AI Services**: Claude and Grok APIs for content generation  
- **Port Configuration**: Runs on port 8001 to avoid conflicts

> Note: While a database username and password are required for container setup,
> authentication is not enforced in this local-only configuration. This setup
> is intended for private, non-production environments with no exposed ports.

## Architecture

**2 Container Setup:**
- **notes-app** (port 8001): Production build with React frontend served by FastAPI
- **notes-db** (port 5433): PostgreSQL database with copied content for testing


## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.


personal-notes/
├── backend/        # FastAPI backend
├── frontend/       # React frontend
├── Dockerfile
├── compose.yaml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
