import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Sports, Refresh, OpenInNew } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { Game, GameCreate, StatsSummary } from '../types/api';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [games, setGames] = useState<Game[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newGameUrl, setNewGameUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      const [gamesData, summaryData] = await Promise.all([
        apiService.getGames(),
        apiService.getStatsSummary(),
      ]);
      setGames(gamesData);
      setSummary(summaryData);
    } catch (error) {
      setError('Failed to load data');
    }
  };

  const handleAddGame = async () => {
    if (!newGameUrl) return;

    setLoading(true);
    setError(null);

    try {
      const gameData: GameCreate = {
        hockey_reference_url: newGameUrl,
        date_attended: new Date().toISOString(), // Fallback date, will be overridden by URL extraction
      };

      await apiService.createGame(gameData);
      setOpenDialog(false);
      setNewGameUrl('');
      loadData();
    } catch (error) {
      setError('Failed to add game. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await apiService.deleteGame(gameId);
      loadData();
    } catch (error) {
      setError('Failed to delete game');
    }
  };

  const handleRefreshGame = async (gameId: string, gameUrl: string) => {
    try {
      setLoading(true);
      // Delete the old game and re-add it to trigger re-parsing
      await apiService.deleteGame(gameId);
      
      const gameData: GameCreate = {
        hockey_reference_url: gameUrl,
        date_attended: new Date().toISOString(),
      };
      
      await apiService.createGame(gameData);
      loadData();
    } catch (error) {
      setError('Failed to refresh game data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGame = (gameUrl: string) => {
    window.open(gameUrl, '_blank');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
        Dashboard
      </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {summary && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: '1 1 180px', minWidth: 180 }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Games Attended
                </Typography>
                <Typography variant="h5">
                  {summary.total_games}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 180px', minWidth: 180 }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Teams Seen
                </Typography>
                <Typography variant="h5">
                  {summary.teams_seen.length}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 180px', minWidth: 180 }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Goals Witnessed
                </Typography>
                <Typography variant="h5">
                  {summary.total_goals_witnessed}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 180px', minWidth: 180 }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  Favorite Team
                </Typography>
                <Typography variant="h6">
                  {summary.favorite_team || 'None'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" component="h2">
            Your Games
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Add Game
          </Button>
        </Box>

        <Card>
          <CardContent>
            {games.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Sports sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No games added yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add your first game to start tracking statistics!
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small" dense>
                  <TableHead>
                    <TableRow>
                      <TableCell>Matchup</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Game Date</TableCell>
                      <TableCell>Last Parsed</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {games.map((game) => (
                      <TableRow key={game.id} hover>
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
                          <Typography variant="body2">
                            {new Date(game.date_attended).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(game.created_at).toLocaleDateString()} {new Date(game.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Original Game">
                              <IconButton
                                size="small"
                                onClick={() => handleViewGame(game.hockey_reference_url)}
                              >
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Re-parse Game Data">
                              <IconButton
                                size="small"
                                onClick={() => handleRefreshGame(game.id, game.hockey_reference_url)}
                                disabled={loading}
                              >
                                <Refresh fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Game">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteGame(game.id)}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Game</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Hockey Reference URL"
              fullWidth
              variant="outlined"
              value={newGameUrl}
              onChange={(e) => setNewGameUrl(e.target.value)}
              placeholder="https://www.hockey-reference.com/boxscores/..."
              helperText="The game date will be automatically extracted from the URL"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddGame}
              variant="contained"
              disabled={loading || !newGameUrl}
            >
              {loading ? 'Adding...' : 'Add Game'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Dashboard;