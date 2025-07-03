import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { PlayerGameStat } from '../types/api';
import { useNavigate, useParams } from 'react-router-dom';

const PlayerDetail: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { playerName } = useParams<{ playerName: string }>();
  
  const [playerGames, setPlayerGames] = useState<PlayerGameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!playerName) {
      navigate('/stats');
      return;
    }
    
    loadPlayerGames();
  }, [isAuthenticated, navigate, playerName]);

  const loadPlayerGames = async () => {
    if (!playerName) return;
    
    try {
      setLoading(true);
      const data = await apiService.getPlayerGameStats(playerName);
      setPlayerGames(data);
    } catch (error) {
      console.error('Failed to load player games:', error);
      setError('Failed to load player game statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGame = (gameUrl: string) => {
    window.open(gameUrl, '_blank');
  };

  const formatTOI = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateFaceoffPct = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Typography>Loading player details...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header with breadcrumbs */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/stats')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              Statistics
            </Link>
            <Typography variant="body2" color="text.primary">
              {playerName}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
            {playerName}
          </Typography>
        </Box>
        <IconButton onClick={() => navigate('/stats')} size="large">
          <ArrowBack />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      {playerGames.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Career Summary ({playerGames.length} games)
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="body2">
                <strong>Goals:</strong> {playerGames.reduce((sum, game) => sum + game.goals, 0)}
              </Typography>
              <Typography variant="body2">
                <strong>Assists:</strong> {playerGames.reduce((sum, game) => sum + game.assists, 0)}
              </Typography>
              <Typography variant="body2">
                <strong>Points:</strong> {playerGames.reduce((sum, game) => sum + game.points, 0)}
              </Typography>
              <Typography variant="body2">
                <strong>+/-:</strong> {playerGames.reduce((sum, game) => sum + game.plus_minus, 0)}
              </Typography>
              <Typography variant="body2">
                <strong>PIM:</strong> {playerGames.reduce((sum, game) => sum + game.pim, 0)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Games Table */}
      <Card>
        <CardContent>
          {playerGames.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No games found for this player
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This player may not have appeared in any of your tracked games.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Matchup</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell align="center">G</TableCell>
                    <TableCell align="center">A</TableCell>
                    <TableCell align="center">P</TableCell>
                    <TableCell align="center">+/-</TableCell>
                    <TableCell align="center">PIM</TableCell>
                    <TableCell align="center">SOG</TableCell>
                    <TableCell align="center">Hits</TableCell>
                    <TableCell align="center">Blks</TableCell>
                    <TableCell align="center">TK</TableCell>
                    <TableCell align="center">GV</TableCell>
                    <TableCell align="center">FO%</TableCell>
                    <TableCell align="center">TOI</TableCell>
                    <TableCell align="center">Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerGames.map((game) => (
                    <TableRow key={game.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(game.game_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {game.away_team} @ {game.home_team}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {game.final_score_away} - {game.final_score_home}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {game.team}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{game.goals}</TableCell>
                      <TableCell align="center">{game.assists}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {game.points}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{game.plus_minus}</TableCell>
                      <TableCell align="center">{game.pim}</TableCell>
                      <TableCell align="center">{game.shots}</TableCell>
                      <TableCell align="center">{game.hits}</TableCell>
                      <TableCell align="center">{game.blocks}</TableCell>
                      <TableCell align="center">{game.takeaways}</TableCell>
                      <TableCell align="center">{game.giveaways}</TableCell>
                      <TableCell align="center">
                        {calculateFaceoffPct(game.faceoff_wins, game.faceoff_losses)}%
                      </TableCell>
                      <TableCell align="center">{formatTOI(game.toi_seconds)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Original Game">
                          <IconButton
                            size="small"
                            onClick={() => handleViewGame(game.hockey_reference_url)}
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlayerDetail;