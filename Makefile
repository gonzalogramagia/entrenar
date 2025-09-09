# Entrenar App - Development and Deployment Commands

.PHONY: help dev build deploy clean test docker-build docker-run

# Default target
help:
	@echo "🏋️ Entrenar App - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  dev              - Start both frontend and backend in development mode"
	@echo "  dev-frontend     - Start only frontend development server"
	@echo "  dev-backend      - Start only backend development server"
	@echo ""
	@echo "Building:"
	@echo "  build            - Build both frontend and backend for production"
	@echo "  build-frontend   - Build frontend for production"
	@echo "  build-backend    - Build backend for production"
	@echo ""
	@echo "Testing:"
	@echo "  test             - Run all tests"
	@echo "  test-frontend    - Run frontend tests"
	@echo "  test-backend     - Run backend tests"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build     - Build Docker images"
	@echo "  docker-run       - Run with Docker Compose"
	@echo "  docker-stop      - Stop Docker containers"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-vercel    - Deploy frontend to Vercel"
	@echo "  deploy-railway   - Deploy backend to Railway"
	@echo ""
	@echo "Utilities:"
	@echo "  clean            - Clean build artifacts"
	@echo "  install          - Install all dependencies"

# Development
dev:
	@echo "🚀 Starting development servers..."
	@make -j2 dev-frontend dev-backend

dev-frontend:
	@echo "🌐 Starting frontend development server..."
	cd frontend && npm run dev

dev-backend:
	@echo "⚙️ Starting backend development server..."
	cd backend && make run

# Building
build: build-frontend build-backend

build-frontend:
	@echo "🏗️ Building frontend for production..."
	cd frontend && npm run build

build-backend:
	@echo "🏗️ Building backend for production..."
	cd backend && go build -o entrenar-backend .

# Testing
test: test-frontend test-backend

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && make test

# Docker
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-run:
	@echo "🐳 Starting services with Docker Compose..."
	docker-compose up -d

docker-stop:
	@echo "🛑 Stopping Docker containers..."
	docker-compose down

# Deployment
deploy-vercel:
	@echo "🚀 Deploying frontend to Vercel..."
	cd frontend && vercel --prod

deploy-railway:
	@echo "🚀 Deploying backend to Railway..."
	cd backend && railway up

# Utilities
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite
	rm -f backend/entrenar-backend
	docker system prune -f

install:
	@echo "📦 Installing dependencies..."
	cd frontend && npm install
	cd backend && go mod download

# Health checks
health-check:
	@echo "🏥 Checking application health..."
	@curl -s http://localhost:3210/api/health || echo "❌ Backend not responding"
	@curl -s http://localhost:5173 || echo "❌ Frontend not responding"

# Environment setup
setup-env:
	@echo "⚙️ Setting up environment files..."
	@if [ ! -f .env ]; then cp env.example .env; echo "Created .env from template"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/env.local.example frontend/.env.local; echo "Created frontend/.env.local from template"; fi
	@if [ ! -f backend/env.test ]; then cp backend/env.test.example backend/env.test; echo "Created backend/env.test from template"; fi

# Production health check
health-check-prod:
	@echo "🌐 Checking production health..."
	@echo "Add your production URLs here"

# Logs
logs-dev:
	@echo "📋 Development logs:"
	docker-compose logs -f

# Complete setup for new developers
first-time-setup: install setup-env
	@echo "🎉 First time setup completed!"
	@echo "1. Update your .env files with actual credentials"
	@echo "2. Run 'make dev' to start development servers"
	@echo "3. Visit http://localhost:5173 for frontend"
	@echo "4. Visit http://localhost:3210/api/health for backend"
