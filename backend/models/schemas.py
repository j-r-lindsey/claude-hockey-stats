from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class GameCreate(BaseModel):
    hockey_reference_url: str
    date_attended: datetime

class Game(BaseModel):
    id: str
    user_id: str
    hockey_reference_url: str
    date_attended: datetime
    home_team: str
    away_team: str
    final_score_home: int
    final_score_away: int
    created_at: datetime

class PlayerStat(BaseModel):
    id: str
    game_id: str
    player_name: str
    team: str
    position: str
    goals: int
    assists: int
    points: int
    plus_minus: int
    pim: int
    shots: int
    hits: int
    blocks: int
    takeaways: int
    giveaways: int
    faceoff_wins: int
    faceoff_losses: int
    toi_seconds: int

class TeamStat(BaseModel):
    id: str
    game_id: str
    team_name: str
    is_home: bool
    goals: int
    goals_against: int
    wins: int
    losses: int
    ties: int
    overtime_losses: int
    shootout_losses: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None