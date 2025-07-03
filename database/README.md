# Database Setup

This directory contains SQL migration files for the Hockey Stats application database.

## Migration Files

### 001_initial_schema.sql
- Creates the initial database schema
- Tables: users, games, player_stats, team_stats
- Sets up basic structure for the application

### 002_disable_rls.sql  
- Disables Row Level Security (RLS) policies
- Required for proper application functionality
- Ensures users can access their data correctly

### 003_create_aggregated_views.sql
- Creates optimized database views for statistics aggregation
- Resolves pagination issues and ensures consistent data
- Views: `player_stats_aggregated`, `team_stats_aggregated`

## Setup Instructions

1. **Run migrations in order** in your Supabase SQL Editor:
   ```sql
   -- First, run the initial schema
   \i 001_initial_schema.sql
   
   -- Then disable RLS
   \i 002_disable_rls.sql
   
   -- Finally, create the aggregated views
   \i 003_create_aggregated_views.sql
   ```

2. **Or run each file manually** by copying the contents into the Supabase SQL Editor

## Views

### player_stats_aggregated
Pre-aggregates player statistics by player name, team, position, and user. This view:
- Eliminates pagination issues when fetching player stats
- Provides consistent aggregation at the database level
- Improves query performance significantly

### team_stats_aggregated  
Pre-aggregates team statistics by team name and user. This view:
- Ensures consistent team statistics across all games
- Eliminates manual aggregation logic in the application
- Provides reliable wins/losses/points calculations

## Benefits

- **Performance**: Database-level aggregation is much faster than application-level
- **Consistency**: Views always return complete, accurate data
- **Reliability**: Eliminates pagination and race condition issues
- **Maintainability**: Centralized aggregation logic in the database