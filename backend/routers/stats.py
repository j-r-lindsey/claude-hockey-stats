from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from models.schemas import PlayerStat, TeamStat, User
from routers.auth import get_current_user
from config.database import supabase

router = APIRouter()

@router.get("/players")
async def get_player_stats(
    current_user: User = Depends(get_current_user),
    player_name: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    position: Optional[str] = Query(None)
):
    """Get aggregated player statistics across all games"""
    try:
        # Build the query
        query = supabase.table("player_stats").select("*")
        
        # Filter by user's games
        user_games = supabase.table("games").select("id").eq("user_id", current_user.id).execute()
        game_ids = [game["id"] for game in user_games.data]
        
        if not game_ids:
            return []
        
        query = query.in_("game_id", game_ids)
        
        # Apply filters
        if player_name:
            query = query.ilike("player_name", f"%{player_name}%")
        if team:
            query = query.ilike("team", f"%{team}%")
        if position:
            query = query.ilike("position", f"%{position}%")
        
        result = query.execute()
        
        # Aggregate by player name (combining across teams if player moved)
        player_aggregates = {}
        for stat in result.data:
            key = stat["player_name"]  # Aggregate by player name only
            
            if key not in player_aggregates:
                player_aggregates[key] = {
                    "id": f"player_{key}",
                    "player_name": stat["player_name"],
                    "team": stat["team"],  # Show most recent team
                    "position": stat["position"],
                    "goals": 0,
                    "assists": 0,
                    "points": 0,
                    "plus_minus": 0,
                    "pim": 0,
                    "shots": 0,
                    "hits": 0,
                    "blocks": 0,
                    "takeaways": 0,
                    "giveaways": 0,
                    "faceoff_wins": 0,
                    "faceoff_losses": 0,
                    "toi_seconds": 0,
                    "games_played": 0
                }
            
            # Aggregate the stats
            agg = player_aggregates[key]
            agg["goals"] += stat["goals"]
            agg["assists"] += stat["assists"]
            agg["points"] += stat["points"]
            agg["plus_minus"] += stat["plus_minus"]
            agg["pim"] += stat["pim"]
            agg["shots"] += stat["shots"]
            agg["hits"] += stat["hits"]
            agg["blocks"] += stat["blocks"]
            agg["takeaways"] += stat["takeaways"]
            agg["giveaways"] += stat["giveaways"]
            agg["faceoff_wins"] += stat["faceoff_wins"]
            agg["faceoff_losses"] += stat["faceoff_losses"]
            agg["toi_seconds"] += stat["toi_seconds"]
            agg["games_played"] += 1
        
        return list(player_aggregates.values())
        
    except Exception as e:
        print(f"Error getting aggregated player stats: {e}")
        return []

@router.get("/teams")
async def get_team_stats(
    current_user: User = Depends(get_current_user),
    team_name: Optional[str] = Query(None)
):
    """Get aggregated team statistics across all games"""
    try:
        # Get user's games
        games_query = supabase.table("games").select("*").eq("user_id", current_user.id)
        games_result = games_query.execute()
        
        if not games_result.data:
            return []
        
        game_ids = [game["id"] for game in games_result.data]
        
        # Get team stats for user's games
        query = supabase.table("team_stats").select("*").in_("game_id", game_ids)
        
        if team_name:
            query = query.ilike("team_name", f"%{team_name}%")
        
        result = query.execute()
        
        # Aggregate by team name
        team_aggregates = {}
        for stat in result.data:
            team = stat["team_name"]
            
            if team not in team_aggregates:
                team_aggregates[team] = {
                    "id": f"team_{team}",
                    "team_name": team,
                    "goals": 0,
                    "goals_against": 0,
                    "wins": 0,
                    "losses": 0,
                    "ties": 0,
                    "overtime_losses": 0,
                    "shootout_losses": 0,
                    "games_played": 0
                }
            
            # Aggregate the stats
            agg = team_aggregates[team]
            agg["goals"] += stat["goals"]
            agg["goals_against"] += stat["goals_against"]
            agg["wins"] += stat["wins"]
            agg["losses"] += stat["losses"]
            agg["ties"] += stat["ties"]
            agg["overtime_losses"] += stat["overtime_losses"]
            agg["shootout_losses"] += stat["shootout_losses"]
            agg["games_played"] += 1
        
        return list(team_aggregates.values())
        
    except Exception as e:
        print(f"Error getting aggregated team stats: {e}")
        return []

@router.get("/summary")
async def get_stats_summary(current_user: User = Depends(get_current_user)):
    # Get user's game IDs
    games_result = supabase.table("games").select("*").eq("user_id", current_user.id).execute()
    games = games_result.data
    
    if not games:
        return {
            "total_games": 0,
            "teams_seen": [],
            "favorite_team": None,
            "total_goals_witnessed": 0
        }
    
    game_ids = [game["id"] for game in games]
    
    # Get team stats
    team_stats_result = supabase.table("team_stats").select("*").in_("game_id", game_ids).execute()
    team_stats = team_stats_result.data
    
    # Calculate summary statistics
    teams_seen = list(set([stat["team_name"] for stat in team_stats]))
    team_appearances = {}
    total_goals = 0
    
    for stat in team_stats:
        team_name = stat["team_name"]
        team_appearances[team_name] = team_appearances.get(team_name, 0) + 1
        total_goals += stat["goals"]
    
    favorite_team = max(team_appearances.items(), key=lambda x: x[1])[0] if team_appearances else None
    
    return {
        "total_games": len(games),
        "teams_seen": teams_seen,
        "favorite_team": favorite_team,
        "total_goals_witnessed": total_goals,
        "team_appearances": team_appearances
    }