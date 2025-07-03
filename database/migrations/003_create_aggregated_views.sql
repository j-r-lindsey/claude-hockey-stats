-- Migration: Create aggregated views for efficient player and team statistics
-- This resolves pagination issues and ensures consistent data aggregation

-- Create aggregated player stats view
CREATE OR REPLACE VIEW player_stats_aggregated AS
SELECT 
    ps.player_name,
    ps.team,
    ps.position,
    g.user_id,
    SUM(ps.goals) as goals,
    SUM(ps.assists) as assists,
    SUM(ps.points) as points,
    SUM(ps.plus_minus) as plus_minus,
    SUM(ps.pim) as pim,
    SUM(ps.shots) as shots,
    SUM(ps.hits) as hits,
    SUM(ps.blocks) as blocks,
    SUM(ps.takeaways) as takeaways,
    SUM(ps.giveaways) as giveaways,
    SUM(ps.faceoff_wins) as faceoff_wins,
    SUM(ps.faceoff_losses) as faceoff_losses,
    SUM(ps.toi_seconds) as toi_seconds,
    COUNT(*) as games_played
FROM player_stats ps
INNER JOIN games g ON ps.game_id = g.id
GROUP BY ps.player_name, ps.team, ps.position, g.user_id
ORDER BY SUM(ps.points) DESC, SUM(ps.goals) DESC, SUM(ps.assists) DESC;

-- Create aggregated team stats view  
CREATE OR REPLACE VIEW team_stats_aggregated AS
SELECT 
    ts.team_name,
    g.user_id,
    SUM(ts.goals) as goals,
    SUM(ts.goals_against) as goals_against,
    SUM(ts.wins) as wins,
    SUM(ts.losses) as losses,
    SUM(ts.ties) as ties,
    SUM(ts.overtime_losses) as overtime_losses,
    SUM(ts.shootout_losses) as shootout_losses,
    COUNT(*) as games_played
FROM team_stats ts
INNER JOIN games g ON ts.game_id = g.id
GROUP BY ts.team_name, g.user_id
ORDER BY (SUM(ts.wins) * 2 + SUM(ts.overtime_losses) + SUM(ts.shootout_losses)) DESC;

-- Grant permissions
GRANT SELECT ON player_stats_aggregated TO PUBLIC;
GRANT SELECT ON team_stats_aggregated TO PUBLIC;