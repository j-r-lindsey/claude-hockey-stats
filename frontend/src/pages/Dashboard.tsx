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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Add, Delete, Sports, Refresh, OpenInNew, Upload } from '@mui/icons-material';
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
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [newGameUrl, setNewGameUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkTaskId, setBulkTaskId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
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

  const handleBulkLoad = async () => {
    if (!bulkUrls.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createBulkGames(bulkUrls);
      setBulkTaskId(response.task_id);
      setBulkUrls('');
      
      // Start polling for progress
      pollBulkProgress(response.task_id);
    } catch (error) {
      setError('Failed to start bulk loading. Please check the URLs and try again.');
      setLoading(false);
    }
  };

  const pollBulkProgress = async (taskId: string) => {
    try {
      const progress = await apiService.getBulkTaskStatus(taskId);
      setBulkProgress(progress);
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        setLoading(false);
        setBulkTaskId(null);
        loadData(); // Refresh the games list
        if (progress.status === 'completed') {
          setOpenBulkDialog(false);
        }
      } else {
        // Continue polling every 2 seconds
        setTimeout(() => pollBulkProgress(taskId), 2000);
      }
    } catch (error) {
      console.error('Failed to get bulk task status:', error);
      setLoading(false);
      setBulkTaskId(null);
    }
  };

  const closeBulkDialog = () => {
    setOpenBulkDialog(false);
    setBulkUrls('');
    setBulkProgress(null);
    setBulkTaskId(null);
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setOpenBulkDialog(true)}
            >
              Bulk Load
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Add Game
            </Button>
          </Box>
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

        <Dialog open={openBulkDialog} onClose={closeBulkDialog} maxWidth="md" fullWidth>
          <DialogTitle>Bulk Load Games</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Hockey Reference URLs"
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={`Paste multiple Hockey Reference URLs, one per line:\n\nhttps://www.hockey-reference.com/boxscores/20250225...\nhttps://www.hockey-reference.com/boxscores/20250301...\nhttps://www.hockey-reference.com/boxscores/20250315...`}
              helperText="Paste multiple URLs, one per line. Game dates will be automatically extracted."
              disabled={loading}
            />
            
            {bulkProgress && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Processing Progress: {bulkProgress.completed_items + bulkProgress.failed_items} / {bulkProgress.total_items}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={bulkProgress.progress} 
                  sx={{ mb: 2 }}
                />
                
                {bulkProgress.results && bulkProgress.results.length > 0 && (
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {bulkProgress.results.map((result: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={result.matchup || result.url}
                            secondary={result.status === 'success' ? 'Successfully added' : result.error}
                          />
                          <Chip 
                            label={result.status} 
                            color={result.status === 'success' ? 'success' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeBulkDialog} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleBulkLoad}
              variant="contained"
              disabled={loading || !bulkUrls.trim()}
            >
              {loading ? 'Processing...' : 'Start Bulk Load'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Dashboard;