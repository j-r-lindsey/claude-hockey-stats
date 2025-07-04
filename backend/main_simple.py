from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from pathlib import Path

from routers import auth_simple
from routers import games_simple, stats_simple

load_dotenv()

app = FastAPI(title="Hockey Stats API", version="1.0.0")

# Configure CORS for development and production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://localhost:5174",
]

# Add production origins from environment variables
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

# Allow all Render.com domains for easier deployment
allowed_origins.extend([
    "https://*.onrender.com",
    "https://hockey-stats-frontend.onrender.com",  # Default frontend service name
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_simple.router, prefix="/auth", tags=["authentication"])
app.include_router(games_simple.router, prefix="/games", tags=["games"])
app.include_router(stats_simple.router, prefix="/stats", tags=["statistics"])

# Create static directory if it doesn't exist
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)

# Serve static files (React app assets) from root
app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

@app.get("/")
async def root():
    """Serve the React app for the root route"""
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Hockey Stats API"}

@app.get("/{path:path}")
async def serve_react_app(path: str):
    """Serve the React app for all other routes (SPA routing)"""
    # Check if it's a static asset first
    asset_file = static_dir / path
    if asset_file.exists() and asset_file.is_file():
        return FileResponse(str(asset_file))
    
    # Otherwise serve the React app
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Route not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)