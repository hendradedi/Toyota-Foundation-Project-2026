#!/bin/bash

# RT Apps Toyota - Startup Script for Development & Production
# Usage: ./startup.sh [dev|prod|docker]

set -e

MODE=${1:-dev}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "🚀 RT Apps Toyota Startup Script"
echo "=================================="
echo "Mode: $MODE"
echo "Project Root: $PROJECT_ROOT"
echo ""

case $MODE in
  dev)
    echo "📦 Starting in DEVELOPMENT mode..."
    echo ""
    echo "Prerequisites (make sure running):"
    echo "  ✓ PostgreSQL on localhost:5432"
    echo "  ✓ Redis on localhost:6379"
    echo ""
    
    # Start API Gateway
    echo "🔧 Starting API Gateway (port 3000)..."
    cd "$PROJECT_ROOT/backend/api-gateway"
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 3
    
    # Start Web App
    echo "🎨 Starting Web App (port 3003)..."
    cd "$PROJECT_ROOT/frontend/web-app"
    npm run dev &
    WEB_PID=$!
    
    echo ""
    echo "✅ Development environment started!"
    echo ""
    echo "URLs:"
    echo "  Web App:      http://localhost:3003"
    echo "  API Gateway:  http://localhost:3000"
    echo "  API Docs:     http://localhost:3000/api-docs"
    echo ""
    echo "PIDs: Backend=$BACKEND_PID, Web=$WEB_PID"
    echo "Press Ctrl+C to stop"
    echo ""
    
    wait
    ;;
    
  prod)
    echo "📦 Starting in PRODUCTION mode..."
    echo ""
    
    if [ ! -f .env.production ]; then
      echo "❌ Error: .env.production not found!"
      echo "   Please create .env.production first"
      exit 1
    fi
    
    # Start API Gateway
    echo "🔧 Starting API Gateway (port 3000)..."
    cd "$PROJECT_ROOT/backend/api-gateway"
    NODE_ENV=production npm start &
    BACKEND_PID=$!
    
    sleep 3
    
    # Start Web App
    echo "🎨 Starting Web App (port 3003)..."
    cd "$PROJECT_ROOT/frontend/web-app"
    NODE_ENV=production npm start &
    WEB_PID=$!
    
    echo ""
    echo "✅ Production environment started!"
    echo ""
    echo "URLs:"
    echo "  Web App:      http://localhost:3003"
    echo "  API Gateway:  http://localhost:3000"
    echo ""
    
    wait
    ;;
    
  docker)
    echo "🐳 Starting with DOCKER COMPOSE..."
    echo ""
    
    # Check docker
    if ! command -v docker &> /dev/null; then
      echo "❌ Error: Docker not found!"
      exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
      echo "❌ Error: Docker Compose not found!"
      exit 1
    fi
    
    # Determine which compose file to use
    if [ -f .env.production ]; then
      COMPOSE_FILE="docker-compose.prod.yml"
      echo "Using production docker-compose.prod.yml"
    else
      COMPOSE_FILE="docker-compose.yml"
      echo "Using development docker-compose.yml"
    fi
    
    echo ""
    echo "📋 Starting services from $COMPOSE_FILE..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to start
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 5
    
    # Show status
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "✅ Docker services started!"
    echo ""
    echo "Access Points:"
    echo "  Web App:       http://localhost:3003"
    echo "  API Gateway:   http://localhost:3000"
    echo "  Nginx:         http://localhost:80"
    echo "  PostgreSQL:    localhost:5432"
    echo "  Redis:         localhost:6379"
    echo ""
    echo "📊 View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "🛑 Stop all:   docker-compose -f $COMPOSE_FILE down"
    echo ""
    ;;
    
  *)
    echo "❌ Invalid mode: $MODE"
    echo ""
    echo "Usage: ./startup.sh [dev|prod|docker]"
    echo ""
    echo "Modes:"
    echo "  dev    - Development mode (local Node.js)"
    echo "  prod   - Production mode (local Node.js)"
    echo "  docker - Docker Compose (recommended)"
    echo ""
    exit 1
    ;;
esac
