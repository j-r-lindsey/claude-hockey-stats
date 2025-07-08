from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from models.schemas import PlayerStat, TeamStat, User
from routers.auth_simple import get_current_user
from config.database_simple import supabase

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
        # Use the aggregated view for efficient database-level aggregation
        query = supabase.table("player_stats_aggregated").select("*").eq("user_id", current_user.id)
        
        # Apply filters
        if player_name:
            query = query.ilike("player_name", f"%{player_name}%")
        if team:
            query = query.ilike("team", f"%{team}%")
        if position:
            query = query.ilike("position", f"%{position}%")
        
        result = query
        
        # Transform the result to match the expected format
        player_stats = []
        for row in result.data:
            player_stats.append({
                "id": f"player_{row['player_name']}",
                "player_name": row["player_name"],
                "team": row["team"],
                "position": row["position"],
                "goals": row["goals"],
                "assists": row["assists"],
                "points": row["points"],
                "plus_minus": row["plus_minus"],
                "pim": row["pim"],
                "shots": row["shots"],
                "hits": row["hits"],
                "blocks": row["blocks"],
                "takeaways": row["takeaways"],
                "giveaways": row["giveaways"],
                "faceoff_wins": row["faceoff_wins"],
                "faceoff_losses": row["faceoff_losses"],
                "toi_seconds": row["toi_seconds"],
                "games_played": row["games_played"]
            })
        
        return player_stats
        
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
        # Use the aggregated view for efficient database-level aggregation
        query = supabase.table("team_stats_aggregated").select("*").eq("user_id", current_user.id)
        
        # Apply filters
        if team_name:
            query = query.ilike("team_name", f"%{team_name}%")
        
        result = query
        
        # Transform the result to match the expected format
        team_stats = []
        for row in result.data:
            team_stats.append({
                "id": f"team_{row['team_name']}",
                "team_name": row["team_name"],
                "goals": row["goals"],
                "goals_against": row["goals_against"],
                "wins": row["wins"],
                "losses": row["losses"],
                "ties": row["ties"],
                "overtime_losses": row["overtime_losses"],
                "shootout_losses": row["shootout_losses"],
                "games_played": row["games_played"]
            })
        
        return team_stats
        
    except Exception as e:
        print(f"Error getting aggregated team stats: {e}")
        return []

@router.get("/players/{player_name}/games")
async def get_player_game_stats(
    player_name: str,
    current_user: User = Depends(get_current_user)
):
    """Get individual game statistics for a specific player"""
    try:
        # Get user's game IDs
        user_games = supabase.table("games").select("*").eq("user_id", current_user.id)
        
        if not user_games.data:
            return []
        
        game_ids = [game["id"] for game in user_games.data]
        
        # Create a mapping of game_id to game info
        games_lookup = {game["id"]: game for game in user_games.data}
        
        # Get player stats for this specific player across all user's games
        result = supabase.table("player_stats").select("*").eq("player_name", player_name).in_("game_id", game_ids)
        
        # Combine player stats with game information
        player_games = []
        for stat in result.data:
            game_info = games_lookup.get(stat["game_id"])
            if game_info:
                player_game = {
                    "id": stat["id"],
                    "player_name": stat["player_name"],
                    "team": stat["team"],
                    "position": stat["position"],
                    "goals": stat["goals"],
                    "assists": stat["assists"],
                    "points": stat["points"],
                    "plus_minus": stat["plus_minus"],
                    "pim": stat["pim"],
                    "shots": stat["shots"],
                    "hits": stat["hits"],
                    "blocks": stat["blocks"],
                    "takeaways": stat["takeaways"],
                    "giveaways": stat["giveaways"],
                    "faceoff_wins": stat["faceoff_wins"],
                    "faceoff_losses": stat["faceoff_losses"],
                    "toi_seconds": stat["toi_seconds"],
                    # Game information
                    "game_date": game_info["date_attended"],
                    "home_team": game_info["home_team"],
                    "away_team": game_info["away_team"],
                    "final_score_home": game_info["final_score_home"],
                    "final_score_away": game_info["final_score_away"],
                    "hockey_reference_url": game_info["hockey_reference_url"]
                }
                player_games.append(player_game)
        
        # Sort by game date (chronological order)
        player_games.sort(key=lambda x: x["game_date"])
        
        return player_games
        
    except Exception as e:
        print(f"Error getting player game stats: {e}")
        return []

@router.get("/teams/{team_name}/games")
async def get_team_game_stats(
    team_name: str,
    current_user: User = Depends(get_current_user)
):
    """Get individual game statistics for a specific team"""
    try:
        # Get user's game IDs
        user_games = supabase.table("games").select("*").eq("user_id", current_user.id)
        
        if not user_games.data:
            return []
        
        game_ids = [game["id"] for game in user_games.data]
        
        # Create a mapping of game_id to game info
        games_lookup = {game["id"]: game for game in user_games.data}
        
        # Get team stats for this specific team across all user's games
        result = supabase.table("team_stats").select("*").eq("team_name", team_name).in_("game_id", game_ids)
        
        # Combine team stats with game information
        team_games = []
        for stat in result.data:
            game_info = games_lookup.get(stat["game_id"])
            if game_info:
                team_game = {
                    "id": stat["id"],
                    "team_name": stat["team_name"],
                    "is_home": stat["is_home"],
                    "goals": stat["goals"],
                    "goals_against": stat["goals_against"],
                    "wins": stat["wins"],
                    "losses": stat["losses"],
                    "ties": stat["ties"],
                    "overtime_losses": stat["overtime_losses"],
                    "shootout_losses": stat["shootout_losses"],
                    # Game information
                    "game_date": game_info["date_attended"],
                    "home_team": game_info["home_team"],
                    "away_team": game_info["away_team"],
                    "final_score_home": game_info["final_score_home"],
                    "final_score_away": game_info["final_score_away"],
                    "hockey_reference_url": game_info["hockey_reference_url"]
                }
                team_games.append(team_game)
        
        # Sort by game date (chronological order)
        team_games.sort(key=lambda x: x["game_date"])
        
        return team_games
        
    except Exception as e:
        print(f"Error getting team game stats: {e}")
        return []

@router.get("/summary")
async def get_stats_summary(current_user: User = Depends(get_current_user)):
    # Get user's game IDs
    games_result = supabase.table("games").select("*").eq("user_id", current_user.id)
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
    team_stats_result = supabase.table("team_stats").select("*").in_("game_id", game_ids)
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