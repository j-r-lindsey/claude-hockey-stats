-- Migration: Initial database schema
-- Creates all the core tables for the hockey stats application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table  
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hockey_reference_url TEXT NOT NULL,
    date_attended DATE NOT NULL,
    home_team VARCHAR(10) NOT NULL,
    away_team VARCHAR(10) NOT NULL,
    final_score_home INTEGER NOT NULL,
    final_score_away INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    team VARCHAR(10) NOT NULL,
    position VARCHAR(10),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    pim INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    takeaways INTEGER DEFAULT 0,
    giveaways INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_losses INTEGER DEFAULT 0,
    toi_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team stats table
CREATE TABLE IF NOT EXISTS team_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    team_name VARCHAR(10) NOT NULL,
    goals INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    overtime_losses INTEGER DEFAULT 0,
    shootout_losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date_attended ON games(date_attended);
CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_team_stats_game_id ON team_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_team_name ON team_stats(team_name);