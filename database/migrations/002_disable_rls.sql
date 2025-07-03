-- Migration: Disable Row Level Security
-- This resolves authentication and data access issues

-- Disable RLS on all tables to ensure proper data access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats DISABLE ROW LEVEL SECURITY;