-- Hockey Stats Tracker Database Schema

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hockey_reference_url TEXT NOT NULL,
    date_attended TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    final_score_home INTEGER NOT NULL,
    final_score_away INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics table
CREATE TABLE player_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    team VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    pim INTEGER DEFAULT 0, -- Penalty minutes
    shots INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    takeaways INTEGER DEFAULT 0,
    giveaways INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_losses INTEGER DEFAULT 0,
    toi_seconds INTEGER DEFAULT 0 -- Time on ice in seconds
);

-- Team statistics table
CREATE TABLE team_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    is_home BOOLEAN NOT NULL,
    goals INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    pim INTEGER DEFAULT 0,
    powerplay_goals INTEGER DEFAULT 0,
    powerplay_opportunities INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_losses INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_date_attended ON games(date_attended);
CREATE INDEX idx_player_stats_game_id ON player_stats(game_id);
CREATE INDEX idx_player_stats_player_name ON player_stats(player_name);
CREATE INDEX idx_player_stats_team ON player_stats(team);
CREATE INDEX idx_team_stats_game_id ON team_stats(game_id);
CREATE INDEX idx_team_stats_team_name ON team_stats(team_name);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Games policies
CREATE POLICY "Users can view own games" ON games FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own games" ON games FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own games" ON games FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own games" ON games FOR DELETE USING (auth.uid()::text = user_id::text);

-- Player stats policies (through games relationship)
CREATE POLICY "Users can view own player stats" ON player_stats FOR SELECT 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can insert own player stats" ON player_stats FOR INSERT 
    WITH CHECK (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can update own player stats" ON player_stats FOR UPDATE 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can delete own player stats" ON player_stats FOR DELETE 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));

-- Team stats policies (through games relationship)
CREATE POLICY "Users can view own team stats" ON team_stats FOR SELECT 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can insert own team stats" ON team_stats FOR INSERT 
    WITH CHECK (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can update own team stats" ON team_stats FOR UPDATE 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));
CREATE POLICY "Users can delete own team stats" ON team_stats FOR DELETE 
    USING (game_id IN (SELECT id FROM games WHERE user_id::text = auth.uid()::text));