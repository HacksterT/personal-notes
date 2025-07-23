# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.12.6

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

# ---- Frontend Builder Stage ----
# Use a Node.js image to build the frontend
FROM node:20-slim as frontend-builder

# Accept build argument for API URL
ARG VITE_API_URL=http://localhost:8001

# Set the working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies for reproducible builds
RUN npm install --frozen-lockfile

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the frontend application with environment variable
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# ---- Backend Final Stage ----
# Use the official Python image
FROM python:${PYTHON_VERSION}-slim as backend

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr.
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Create a non-privileged user that the app will run under.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install Python dependencies
# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/ ./backend/

# Copy the built frontend assets from the builder stage
# The destination is 'static', which is what main.py expects
COPY --from=frontend-builder /app/frontend/dist ./static

# Create uploads directory (for future file uploads)
RUN mkdir -p /app/uploads

# Ensure the appuser owns the application files
RUN chown -R appuser:appuser /app

# Switch to the non-privileged user
USER appuser

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application with Gunicorn
# This command starts Gunicorn with Uvicorn workers for FastAPI
CMD ["gunicorn", "--chdir", "backend", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]

# -----------------------------------------------------------------------------
# Development stage for Frontend (for hot-reloading)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-dev

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./

RUN npm install

# The command to run the dev server.
# The --host flag is crucial to expose the server outside the container.
CMD ["npm", "run", "dev", "--", "--host"]
