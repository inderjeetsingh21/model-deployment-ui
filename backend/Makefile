.PHONY: help install dev test clean docker-build docker-up docker-down docker-logs

help:
	@echo "Model Deployment Backend - Available Commands"
	@echo "=============================================="
	@echo "install          - Install dependencies"
	@echo "dev              - Run development server"
	@echo "test             - Run test suite"
	@echo "clean            - Clean temporary files"
	@echo "docker-build     - Build Docker image"
	@echo "docker-up        - Start Docker containers"
	@echo "docker-down      - Stop Docker containers"
	@echo "docker-logs      - View Docker logs"
	@echo "=============================================="

install:
	@echo "Installing dependencies..."
	chmod +x setup.sh
	./setup.sh

dev:
	@echo "Starting development server..."
	@. venv/bin/activate && python3 api_server.py

test:
	@echo "Running tests..."
	@. venv/bin/activate && python3 test_api.py

clean:
	@echo "Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	rm -rf .pytest_cache
	@echo "Clean complete!"

docker-build:
	@echo "Building Docker image..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "Backend running at http://localhost:8000"
	@echo "API Docs at http://localhost:8000/docs"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f backend

docker-restart:
	@echo "Restarting Docker containers..."
	docker-compose restart

docker-shell:
	@echo "Opening shell in backend container..."
	docker-compose exec backend /bin/bash

status:
	@echo "Checking service status..."
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "Backend not running"

deploy-example:
	@echo "Deploying example model..."
	@curl -s -X POST http://localhost:8000/api/deploy \
		-H "Content-Type: application/json" \
		-d '{"model_name": "example_model", "port": 8001, "workers": 2}' | python3 -m json.tool
