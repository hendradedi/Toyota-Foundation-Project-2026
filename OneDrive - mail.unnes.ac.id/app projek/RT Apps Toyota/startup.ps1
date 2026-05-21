# RT Apps Toyota - Startup Script for Development & Production (Windows PowerShell)
# Usage: .\startup.ps1 -Mode dev|prod|docker

param(
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🚀 RT Apps Toyota Startup Script (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Yellow
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

switch ($Mode) {
    "dev" {
        Write-Host "📦 Starting in DEVELOPMENT mode..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Prerequisites (make sure running):" -ForegroundColor Yellow
        Write-Host "  ✓ PostgreSQL on localhost:5432"
        Write-Host "  ✓ Redis on localhost:6379"
        Write-Host ""
        
        # Start API Gateway
        Write-Host "🔧 Starting API Gateway (port 3000)..." -ForegroundColor Cyan
        $BackendPath = Join-Path $ProjectRoot "backend\api-gateway"
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; npm run dev"
        
        # Wait for backend to start
        Start-Sleep -Seconds 3
        
        # Start Web App
        Write-Host "🎨 Starting Web App (port 3003)..." -ForegroundColor Cyan
        $WebAppPath = Join-Path $ProjectRoot "frontend\web-app"
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$WebAppPath'; npm run dev"
        
        Write-Host ""
        Write-Host "✅ Development environment started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs:" -ForegroundColor Yellow
        Write-Host "  Web App:      http://localhost:3003"
        Write-Host "  API Gateway:  http://localhost:3000"
        Write-Host "  API Docs:     http://localhost:3000/api-docs"
        Write-Host ""
        Write-Host "Close terminal windows to stop"
    }
    
    "prod" {
        Write-Host "📦 Starting in PRODUCTION mode..." -ForegroundColor Green
        Write-Host ""
        
        $EnvFile = Join-Path $ProjectRoot ".env.production"
        if (-not (Test-Path $EnvFile)) {
            Write-Host "❌ Error: .env.production not found!" -ForegroundColor Red
            Write-Host "   Please create .env.production first"
            exit 1
        }
        
        # Start API Gateway
        Write-Host "🔧 Starting API Gateway (port 3000)..." -ForegroundColor Cyan
        $BackendPath = Join-Path $ProjectRoot "backend\api-gateway"
        $BackendCmd = "cd '$BackendPath'; `$env:NODE_ENV='production'; npm start"
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", $BackendCmd
        
        Start-Sleep -Seconds 3
        
        # Start Web App
        Write-Host "🎨 Starting Web App (port 3003)..." -ForegroundColor Cyan
        $WebAppPath = Join-Path $ProjectRoot "frontend\web-app"
        $WebCmd = "cd '$WebAppPath'; `$env:NODE_ENV='production'; npm start"
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", $WebCmd
        
        Write-Host ""
        Write-Host "✅ Production environment started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs:" -ForegroundColor Yellow
        Write-Host "  Web App:      http://localhost:3003"
        Write-Host "  API Gateway:  http://localhost:3000"
        Write-Host ""
        Write-Host "Close terminal windows to stop"
    }
    
    "docker" {
        Write-Host "🐳 Starting with DOCKER COMPOSE..." -ForegroundColor Green
        Write-Host ""
        
        # Check docker
        $DockerCheck = docker --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error: Docker not found!" -ForegroundColor Red
            Write-Host "   Please install Docker Desktop"
            exit 1
        }
        
        Write-Host "✓ Docker detected: $DockerCheck" -ForegroundColor Green
        
        # Determine which compose file
        $ProdFile = Join-Path $ProjectRoot "docker-compose.prod.yml"
        $DevFile = Join-Path $ProjectRoot "docker-compose.yml"
        
        if (Test-Path $ProdFile -PathType Leaf) {
            $ComposeFile = "docker-compose.prod.yml"
            Write-Host "Using production configuration" -ForegroundColor Cyan
        } else {
            $ComposeFile = "docker-compose.yml"
            Write-Host "Using development configuration" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "📋 Starting services from $ComposeFile..." -ForegroundColor Yellow
        
        Set-Location $ProjectRoot
        docker-compose -f $ComposeFile up -d
        
        # Wait for services
        Write-Host ""
        Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Show status
        docker-compose -f $ComposeFile ps
        
        Write-Host ""
        Write-Host "✅ Docker services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access Points:" -ForegroundColor Yellow
        Write-Host "  Web App:       http://localhost:3003"
        Write-Host "  API Gateway:   http://localhost:3000"
        Write-Host "  Nginx:         http://localhost"
        Write-Host "  PostgreSQL:    localhost:5432"
        Write-Host "  Redis:         localhost:6379"
        Write-Host ""
        Write-Host "📊 View logs:  docker-compose -f $ComposeFile logs -f" -ForegroundColor Cyan
        Write-Host "🛑 Stop all:   docker-compose -f $ComposeFile down" -ForegroundColor Cyan
        Write-Host ""
    }
    
    default {
        Write-Host "❌ Invalid mode: $Mode" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage: .\startup.ps1 -Mode [dev|prod|docker]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Modes:" -ForegroundColor Yellow
        Write-Host "  dev    - Development mode (local Node.js)" -ForegroundColor Cyan
        Write-Host "  prod   - Production mode (local Node.js)" -ForegroundColor Cyan
        Write-Host "  docker - Docker Compose (recommended)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\startup.ps1 -Mode dev" -ForegroundColor Gray
        Write-Host "  .\startup.ps1 -Mode docker" -ForegroundColor Gray
        exit 1
    }
}
