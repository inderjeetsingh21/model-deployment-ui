# Multi-stage Dockerfile for Model Deployment Backend

FROM python:3.9-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api_server.py .
COPY model_server_template.py .

# Create necessary directories
RUN mkdir -p deployed_models uploads logs

# Expose ports
# 8000 for main API
# 8001-8010 for deployed models
EXPOSE 8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "api_server.py"]
