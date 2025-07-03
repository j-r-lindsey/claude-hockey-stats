import asyncio
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import time
from enum import Enum
from dataclasses import dataclass, asdict
from services.hockey_parser import parse_hockey_reference_url
from config.database import supabase


class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TaskResult:
    task_id: str
    status: TaskStatus
    progress: int  # 0-100
    total_items: int
    completed_items: int
    failed_items: int
    results: List[Dict[str, Any]]
    errors: List[str]
    created_at: datetime
    updated_at: datetime


class InMemoryTaskQueue:
    def __init__(self):
        self.tasks: Dict[str, TaskResult] = {}
        self.processing_lock = asyncio.Lock()
    
    def create_task(self, total_items: int) -> str:
        task_id = str(uuid.uuid4())
        task_result = TaskResult(
            task_id=task_id,
            status=TaskStatus.PENDING,
            progress=0,
            total_items=total_items,
            completed_items=0,
            failed_items=0,
            results=[],
            errors=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.tasks[task_id] = task_result
        return task_id
    
    def get_task(self, task_id: str) -> Optional[TaskResult]:
        return self.tasks.get(task_id)
    
    def update_task(self, task_id: str, **kwargs):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            for key, value in kwargs.items():
                if hasattr(task, key):
                    setattr(task, key, value)
            task.updated_at = datetime.now()
            
            # Calculate progress
            if task.total_items > 0:
                task.progress = int(((task.completed_items + task.failed_items) / task.total_items) * 100)
            
            # Update status based on progress
            if task.progress >= 100:
                task.status = TaskStatus.COMPLETED
    
    async def process_bulk_games(self, task_id: str, urls: List[str], user_id: str):
        """Process multiple game URLs with rate limiting"""
        async with self.processing_lock:
            self.update_task(task_id, status=TaskStatus.PROCESSING)
            
            for i, url in enumerate(urls):
                try:
                    # Add delay between requests to be respectful to Hockey Reference
                    if i > 0:
                        await asyncio.sleep(2)  # 2 second delay between requests
                    
                    # Parse the game
                    parsed_data = parse_hockey_reference_url(url.strip())
                    
                    # Use extracted date from URL if available, otherwise use current date
                    game_date = parsed_data.get("game_date")
                    if game_date:
                        date_attended = game_date
                    else:
                        date_attended = datetime.now().isoformat()
                    
                    # Create game record
                    game_record = {
                        "user_id": user_id,
                        "hockey_reference_url": url.strip(),
                        "date_attended": date_attended,
                        "home_team": parsed_data["home_team"],
                        "away_team": parsed_data["away_team"],
                        "final_score_home": parsed_data["final_score_home"],
                        "final_score_away": parsed_data["final_score_away"],
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Insert game
                    result = supabase.table("games").insert(game_record).execute()
                    
                    if result.data:
                        game_id = result.data[0]["id"]
                        
                        # Store player stats
                        for player_stat in parsed_data["player_stats"]:
                            player_stat["game_id"] = game_id
                            supabase.table("player_stats").insert(player_stat).execute()
                        
                        # Store team stats
                        for team_stat in parsed_data["team_stats"]:
                            team_stat["game_id"] = game_id
                            supabase.table("team_stats").insert(team_stat).execute()
                        
                        # Update task with success
                        task = self.get_task(task_id)
                        task.results.append({
                            "url": url.strip(),
                            "game_id": game_id,
                            "matchup": f"{parsed_data['away_team']} @ {parsed_data['home_team']}",
                            "status": "success"
                        })
                        task.completed_items += 1
                        self.update_task(task_id, results=task.results, completed_items=task.completed_items)
                        
                    else:
                        raise Exception("Failed to create game record")
                        
                except Exception as e:
                    # Update task with error
                    task = self.get_task(task_id)
                    error_msg = f"Failed to process {url.strip()}: {str(e)}"
                    task.errors.append(error_msg)
                    task.failed_items += 1
                    task.results.append({
                        "url": url.strip(),
                        "status": "failed",
                        "error": str(e)
                    })
                    self.update_task(task_id, 
                                   errors=task.errors, 
                                   failed_items=task.failed_items,
                                   results=task.results)
                    print(f"Error processing game: {error_msg}")
            
            # Mark task as completed
            self.update_task(task_id, status=TaskStatus.COMPLETED)

    async def process_reprocess_games(self, task_id: str, game_data: List[tuple], user_id: str):
        """Reprocess existing games with rate limiting"""
        async with self.processing_lock:
            self.update_task(task_id, status=TaskStatus.PROCESSING)
            
            for i, (game_id, url) in enumerate(game_data):
                try:
                    # Add delay between requests to be respectful to Hockey Reference
                    if i > 0:
                        await asyncio.sleep(2)  # 2 second delay between requests
                    
                    # Parse the game with updated logic
                    parsed_data = parse_hockey_reference_url(url.strip())
                    
                    # Use extracted date from URL if available, otherwise use existing date
                    game_date = parsed_data.get("game_date")
                    if game_date:
                        date_attended = game_date
                    else:
                        # Keep existing date
                        existing_game = supabase.table("games").select("date_attended").eq("id", game_id).execute()
                        date_attended = existing_game.data[0]["date_attended"] if existing_game.data else datetime.now().isoformat()
                    
                    # Update game record
                    game_record = {
                        "hockey_reference_url": url.strip(),
                        "date_attended": date_attended,
                        "home_team": parsed_data["home_team"],
                        "away_team": parsed_data["away_team"],
                        "final_score_home": parsed_data["final_score_home"],
                        "final_score_away": parsed_data["final_score_away"],
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Update the game
                    supabase.table("games").update(game_record).eq("id", game_id).execute()
                    
                    # Delete existing stats for this game
                    supabase.table("player_stats").delete().eq("game_id", game_id).execute()
                    supabase.table("team_stats").delete().eq("game_id", game_id).execute()
                    
                    # Store updated player stats
                    for player_stat in parsed_data["player_stats"]:
                        player_stat["game_id"] = game_id
                        supabase.table("player_stats").insert(player_stat).execute()
                    
                    # Store updated team stats
                    for team_stat in parsed_data["team_stats"]:
                        team_stat["game_id"] = game_id
                        supabase.table("team_stats").insert(team_stat).execute()
                    
                    # Update task with success
                    task = self.get_task(task_id)
                    task.results.append({
                        "game_id": game_id,
                        "url": url.strip(),
                        "matchup": f"{parsed_data['away_team']} @ {parsed_data['home_team']}",
                        "status": "success"
                    })
                    task.completed_items += 1
                    self.update_task(task_id, results=task.results, completed_items=task.completed_items)
                    
                except Exception as e:
                    # Update task with error
                    task = self.get_task(task_id)
                    error_msg = f"Failed to reprocess game {game_id}: {str(e)}"
                    task.errors.append(error_msg)
                    task.failed_items += 1
                    task.results.append({
                        "game_id": game_id,
                        "url": url.strip(),
                        "status": "failed",
                        "error": str(e)
                    })
                    self.update_task(task_id, 
                                   errors=task.errors, 
                                   failed_items=task.failed_items,
                                   results=task.results)
                    print(f"Error reprocessing game: {error_msg}")
            
            # Mark task as completed
            self.update_task(task_id, status=TaskStatus.COMPLETED)


# Global task queue instance
task_queue = InMemoryTaskQueue()