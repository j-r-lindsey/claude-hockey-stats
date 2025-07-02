from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.schemas import Game, GameCreate, User
from routers.auth import get_current_user
from config.database import supabase
from services.hockey_parser import parse_hockey_reference_url
from datetime import datetime

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