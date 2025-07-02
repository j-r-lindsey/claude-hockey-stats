#!/bin/bash

# Build script for Hockey Stats App

echo "🏒 Building Hockey Stats Tracker..."

# Backend setup
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python -m venv venv
fi

# Activate virtual environment (platform specific)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -r requirements.txt

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend
npm ci
npm run build

cd ..

echo "✅ Build complete!"
echo ""
echo "🚀 Ready for deployment!"
echo "   - Backend: ./backend"
echo "   - Frontend build: ./frontend/dist"
echo ""
echo "📋 Next steps:"
echo "   1. Push to GitHub repository"
echo "   2. Deploy to Render.com using render.yaml"
echo "   3. Set environment variables in Render dashboard"