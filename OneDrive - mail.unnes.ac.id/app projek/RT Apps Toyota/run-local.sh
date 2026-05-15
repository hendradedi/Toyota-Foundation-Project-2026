#!/bin/bash

# Digital RT-Muban Local Development Setup Script
# This script helps you run the application locally without Docker

echo "========================================="
echo "Digital RT-Muban Local Development Setup"
echo "========================================="

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You'll need to install PostgreSQL 16+"
    echo "   or use Docker for database services."
    read -p "Continue without PostgreSQL? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ PostgreSQL is installed"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis is not installed. You'll need to install Redis 7+"
    echo "   or use Docker for Redis services."
    read -p "Continue without Redis? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Redis is installed"
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install shared module dependencies
cd shared
npm install
cd ..

# Install API Gateway dependencies
cd api-gateway
npm install
cd ..

# Install database module dependencies
cd database
npm install
cd ../..

echo ""
echo "✅ Dependencies installed successfully!"

echo ""
echo "🔧 Setting up environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    echo ""
    echo "⚠️  Please edit the .env file with your configuration:"
    echo "   - Set DB_PASSWORD to a secure password"
    echo "   - Set JWT_SECRET and JWT_REFRESH_SECRET"
    echo "   - Update other settings as needed"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🚀 Starting services..."

# Start services in the background
echo "1. Starting API Gateway..."
cd backend/api-gateway
npm run dev &
API_GATEWAY_PID=$!
cd ../..

echo "2. Starting PostgreSQL (if available)..."
# You would start PostgreSQL here if needed

echo "3. Starting Redis (if available)..."
# You would start Redis here if needed

echo ""
echo "========================================="
echo "🎉 Development environment is ready!"
echo "========================================="
echo ""
echo "📡 API Gateway: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/api-docs"
echo "🏥 Health Check: http://localhost:3000/health"
echo ""
echo "📋 Available endpoints:"
echo "   POST /api/v1/auth/register    - Register new user"
echo "   POST /api/v1/auth/login       - Login user"
echo "   POST /api/v1/auth/refresh     - Refresh token"
echo "   POST /api/v1/auth/logout      - Logout user"
echo "   GET  /api/v1/auth/me          - Get current user"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo ""

# Wait for user to press Ctrl+C
trap "kill $API_GATEWAY_PID 2>/dev/null; echo 'Services stopped.'; exit 0" INT
wait
