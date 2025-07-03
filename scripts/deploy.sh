#!/bin/bash

# AI Web Upgrader - Builder Service Deployment Script

set -e

echo "🚀 Deploying AI Web Upgrader Builder Service..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found. Using environment variables."
fi

# Build and start the service
echo "📦 Building Docker image..."
docker-compose build

echo "🔧 Starting service..."
docker-compose up -d

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:${PORT:-8002}/health > /dev/null 2>&1; then
    echo "✅ Builder service deployed successfully!"
    echo "🔗 Health check: http://localhost:${PORT:-8002}/health"
    echo "📚 API documentation: http://localhost:${PORT:-8002}/"
else
    echo "❌ Service health check failed"
    echo "📋 Checking logs..."
    docker-compose logs builder
    exit 1
fi

echo "🎉 Deployment complete!"