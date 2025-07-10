from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from models.schemas import Game, GameCreate, User
from routers.auth import get_current_user
from config.database import supabase
from services.hockey_parser import parse_hockey_reference_url
from services.task_queue import task_queue, TaskStatus
from services.arena_service import ArenaService
from datetime import datetime
import re

router = APIRouter()

@router.post("/", response_model=Game)
async def create_game(
    game_data: GameCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"Adding game: {game_data.hockey_reference_url}")
        print(f"Date attended: {game_data.date_attended}")
        
        # Parse the hockey reference URL
        parsed_data = parse_hockey_reference_url(game_data.hockey_reference_url)
        print(f"Parsed data: {parsed_data}")
        
        # Use extracted date from URL if available, otherwise fall back to user input
        game_date = parsed_data.get("game_date")
        if game_date:
            date_attended = game_date
            print(f"Using extracted date from URL: {date_attended}")
        else:
            date_attended = game_data.date_attended.isoformat()
            print(f"Using manually entered date: {date_attended}")
        
        # Create game record
        game_record = {
            "user_id": current_user.id,
            "hockey_reference_url": game_data.hockey_reference_url,
            "date_attended": date_attended,
            "home_team": parsed_data["home_team"],
            "away_team": parsed_data["away_team"],
            "final_score_home": parsed_data["final_score_home"],
            "final_score_away": parsed_data["final_score_away"],
            "created_at": datetime.utcnow().isoformat()
        }
        
        print(f"Creating game record: {game_record}")
        result = supabase.table("games").insert(game_record).execute()
        print(f"Game creation result: {result}")
        
        if not result.data:
            raise Exception("Failed to create game record")
            
        game_id = result.data[0]["id"]
        print(f"Created game with ID: {game_id}")
        
        # Store player stats
        print(f"Storing {len(parsed_data['player_stats'])} player stats")
        for player_stat in parsed_data["player_stats"]:
            player_stat["game_id"] = game_id
            supabase.table("player_stats").insert(player_stat).execute()
        
        # Store team stats
        print(f"Storing {len(parsed_data['team_stats'])} team stats")
        for team_stat in parsed_data["team_stats"]:
            team_stat["game_id"] = game_id
            supabase.table("team_stats").insert(team_stat).execute()
        
        print("Successfully created game and stats")
        return Game(**result.data[0])
        
    except Exception as e:
        print(f"Error processing game: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error processing game: {str(e)}")

@router.get("/", response_model=List[Game])
async def get_user_games(current_user: User = Depends(get_current_user)):
    result = supabase.table("games").select("*").eq("user_id", current_user.id).execute()
    return [Game(**game) for game in result.data]

@router.get("/locations")
async def get_games_with_locations(
    current_user: User = Depends(get_current_user)
):
    """Get all user's games with arena location data"""
    try:
        # Get user's games
        result = supabase.table("games").select("*").eq("user_id", current_user.id).execute()
        
        if not result.data:
            return []
        
        # Enrich games with location data
        games_with_locations = ArenaService.get_games_with_locations(result.data)
        
        return games_with_locations
        
    except Exception as e:
        print(f"Error getting games with locations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get game locations")

@router.get("/arenas")
async def get_unique_arenas(
    current_user: User = Depends(get_current_user)
):
    """Get unique arenas visited by the user"""
    try:
        # Get user's games
        result = supabase.table("games").select("*").eq("user_id", current_user.id).execute()
        
        if not result.data:
            return []
        
        # Get unique arenas with visit counts
        unique_arenas = ArenaService.get_unique_arenas_from_games(result.data)
        
        return unique_arenas
        
    except Exception as e:
        print(f"Error getting unique arenas: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get arena data")

@router.get("/all-arenas")
async def get_all_nhl_arenas():
    """Get all NHL arenas (public endpoint)"""
    try:
        return ArenaService.get_all_nhl_arenas()
    except Exception as e:
        print(f"Error getting all arenas: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get arena data")

@router.get("/{game_id}", response_model=Game)
async def get_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    result = supabase.table("games").select("*").eq("id", game_id).eq("user_id", current_user.id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return Game(**result.data[0])

@router.delete("/{game_id}")
async def delete_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify game belongs to user
    result = supabase.table("games").select("*").eq("id", game_id).eq("user_id", current_user.id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Delete related records
    supabase.table("player_stats").delete().eq("game_id", game_id).execute()
    supabase.table("team_stats").delete().eq("game_id", game_id).execute()
    supabase.table("games").delete().eq("id", game_id).execute()
    
    return {"message": "Game deleted successfully"}

from pydantic import BaseModel

class BulkGameRequest(BaseModel):
    urls_text: str

@router.post("/bulk")
async def create_bulk_games(
    background_tasks: BackgroundTasks,
    request: BulkGameRequest,
    current_user: User = Depends(get_current_user)
):
    """Start bulk processing of multiple Hockey Reference URLs"""
    try:
        # Parse URLs from text input
        urls = []
        for line in request.urls_text.strip().split('\n'):
            line = line.strip()
            if line and 'hockey-reference.com' in line:
                # Extract URL from line (handles cases where there might be extra text)
                url_match = re.search(r'https?://[^\s]+hockey-reference\.com[^\s]*', line)
                if url_match:
                    urls.append(url_match.group())
                elif line.startswith('http'):
                    urls.append(line)
        
        if not urls:
            raise HTTPException(status_code=400, detail="No valid Hockey Reference URLs found")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        # Create task
        task_id = task_queue.create_task(len(unique_urls))
        
        # Start background processing
        background_tasks.add_task(
            task_queue.process_bulk_games,
            task_id,
            unique_urls,
            current_user.id
        )
        
        return {
            "task_id": task_id,
            "total_urls": len(unique_urls),
            "message": f"Started processing {len(unique_urls)} games. Use the task_id to check progress."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting bulk processing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error starting bulk processing: {str(e)}")

@router.post("/reprocess-all")
async def reprocess_all_games(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Reprocess all existing games for the current user"""
    try:
        # Get all existing games for the user
        user_games = supabase.table("games").select("id, hockey_reference_url").eq("user_id", current_user.id).execute()
        
        if not user_games.data:
            return {"message": "No games found to reprocess"}
        
        game_urls = [(game["id"], game["hockey_reference_url"]) for game in user_games.data]
        
        # Create task
        task_id = task_queue.create_task(len(game_urls))
        
        # Start background processing
        background_tasks.add_task(
            task_queue.process_reprocess_games,
            task_id,
            game_urls,
            current_user.id
        )
        
        return {
            "task_id": task_id,
            "total_games": len(game_urls),
            "message": f"Started reprocessing {len(game_urls)} games. Use the task_id to check progress."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting bulk processing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error starting bulk processing: {str(e)}")

@router.get("/bulk/{task_id}")
async def get_bulk_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the status of a bulk processing task"""
    task = task_queue.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task.task_id,
        "status": task.status.value,
        "progress": task.progress,
        "total_items": task.total_items,
        "completed_items": task.completed_items,
        "failed_items": task.failed_items,
        "results": task.results,
        "errors": task.errors,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat()
    }

