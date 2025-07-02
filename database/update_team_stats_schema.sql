-- Update team_stats table to include season record statistics
-- Run this in your Supabase SQL Editor

-- Add new columns for team season statistics
ALTER TABLE team_stats 
ADD COLUMN wins INTEGER DEFAULT 0,
ADD COLUMN losses INTEGER DEFAULT 0,
ADD COLUMN ties INTEGER DEFAULT 0,
ADD COLUMN overtime_losses INTEGER DEFAULT 0,
ADD COLUMN shootout_losses INTEGER DEFAULT 0,
ADD COLUMN goals_against INTEGER DEFAULT 0;

-- Remove old columns that are no longer needed for team stats view
ALTER TABLE team_stats 
DROP COLUMN IF EXISTS shots,
DROP COLUMN IF EXISTS hits,
DROP COLUMN IF EXISTS blocks,
DROP COLUMN IF EXISTS pim,
DROP COLUMN IF EXISTS powerplay_goals,
DROP COLUMN IF EXISTS powerplay_opportunities,
DROP COLUMN IF EXISTS faceoff_wins,
DROP COLUMN IF EXISTS faceoff_losses;