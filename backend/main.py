from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import auth, games, stats

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

app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(stats.router, prefix="/stats", tags=["statistics"])

@app.get("/")
async def root():
    return {"message": "Hockey Stats API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)