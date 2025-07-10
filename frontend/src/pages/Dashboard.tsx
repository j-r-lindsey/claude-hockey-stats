import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
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
  TableSortLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Delete, Sports, Refresh, OpenInNew, Upload, Timeline, Map } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
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
  const [openReprocessDialog, setOpenReprocessDialog] = useState(false);
  const [newGameUrl, setNewGameUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setBulkTaskId] = useState<string | null>(null);
  const [reprocessTaskId, setReprocessTaskId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
  const [reprocessProgress, setReprocessProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'date_attended' | 'created_at'>('date_attended');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedGames, setSortedGames] = useState<Game[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [uniqueArenas, setUniqueArenas] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Sort games whenever games, sortColumn, or sortOrder changes
    const sorted = [...games].sort((a, b) => {
      const dateA = new Date(a[sortColumn]).getTime();
      const dateB = new Date(b[sortColumn]).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setSortedGames(sorted);
  }, [games, sortColumn, sortOrder]);

  const loadData = async () => {
    try {
      const [gamesData, summaryData] = await Promise.all([
        apiService.getGames(),
        apiService.getStatsSummary(),
      ]);
      setGames(gamesData);
      setSummary(summaryData);
      
      // Load arena data separately with error handling
      try {
        const arenasData = await apiService.getUniqueArenas();
        setUniqueArenas(arenasData);
      } catch (arenaError) {
        console.warn('Failed to load arena data:', arenaError);
        setUniqueArenas([]);
      }
    } catch (error) {
      setError('Failed to load data');
    }
  };

  const handleSort = (column: 'date_attended' | 'created_at') => {
    if (sortColumn === column) {
      // Same column, toggle sort order
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Different column, set new column and default to desc
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const generateGameCountByYear = () => {
    const yearCounts: { [year: string]: number } = {};
    
    // Count games by year
    games.forEach(game => {
      const year = new Date(game.date_attended).getFullYear().toString();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    // Convert to array and sort by year
    const sortedYears = Object.keys(yearCounts).sort();
    let cumulativeCount = 0;
    
    return sortedYears.map(year => {
      cumulativeCount += yearCounts[year];
      return {
        year: year,
        count: cumulativeCount,
        yearlyCount: yearCounts[year]
      };
    });
  };

  const chartData = generateGameCountByYear();

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

  const handleReprocessAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.reprocessAllGames();
      setReprocessTaskId(response.task_id);
      
      // Start polling for progress
      pollReprocessProgress(response.task_id);
    } catch (error) {
      setError('Failed to start reprocessing. Please try again.');
      setLoading(false);
    }
  };

  const pollReprocessProgress = async (taskId: string) => {
    try {
      const progress = await apiService.getBulkTaskStatus(taskId);
      setReprocessProgress(progress);
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        setLoading(false);
        setReprocessTaskId(null);
        loadData(); // Refresh the games list
        if (progress.status === 'completed') {
          setOpenReprocessDialog(false);
        }
      } else {
        // Continue polling every 2 seconds
        setTimeout(() => pollReprocessProgress(taskId), 2000);
      }
    } catch (error) {
      console.error('Failed to get reprocess task status:', error);
      setLoading(false);
      setReprocessTaskId(null);
    }
  };

  const closeReprocessDialog = () => {
    setOpenReprocessDialog(false);
    setReprocessProgress(null);
    setReprocessTaskId(null);
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
              startIcon={<Refresh />}
              onClick={() => setOpenReprocessDialog(true)}
              disabled={games.length === 0}
            >
              Reprocess All
            </Button>
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

        <Box sx={{ mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="game data tabs">
            <Tab icon={<Sports />} label="Games List" />
            <Tab icon={<Timeline />} label="Growth Chart" />
            <Tab icon={<Map />} label="Game Map" />
          </Tabs>
        </Box>

        <Card>
          <CardContent>
            {/* Tab Panel 0: Games List */}
            {currentTab === 0 && (
              <Box>
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
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Matchup</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'date_attended'}
                              direction={sortColumn === 'date_attended' ? sortOrder : 'desc'}
                              onClick={() => handleSort('date_attended')}
                            >
                              Game Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'created_at'}
                              direction={sortColumn === 'created_at' ? sortOrder : 'desc'}
                              onClick={() => handleSort('created_at')}
                            >
                              Last Parsed
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedGames.map((game) => (
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
              </Box>
            )}

            {/* Tab Panel 1: Growth Chart */}
            {currentTab === 1 && (
              <Box>
                {games.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Timeline sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No games to chart yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add some games to see your attendance growth over time!
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Cumulative Games Attended Over Time
                    </Typography>
                    <Box sx={{ height: 400, width: '100%' }}>
                      <ResponsiveContainer>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value: number, name: string) => [
                              name === 'count' ? `${value} total games` : `${value} games`,
                              name === 'count' ? 'Total Games' : 'Games This Year'
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={{ fill: '#1976d2' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab Panel 2: Game Map */}
            {currentTab === 2 && (
              <Box>
                {uniqueArenas.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Map sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No arenas to map yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add some games to see the arenas you've visited on the map!
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Arenas You've Visited ({uniqueArenas.length})
                    </Typography>
                    <Box sx={{ height: 500, width: '100%', mt: 2 }}>
                      <MapContainer
                        center={[43.6532, -79.3832]} // Center on Toronto
                        zoom={4}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {uniqueArenas.map((arena, index) => (
                          <Marker
                            key={index}
                            position={[arena.latitude, arena.longitude]}
                          >
                            <Popup>
                              <div>
                                <strong>{arena.arena_name}</strong><br />
                                {arena.city}, {arena.state}, {arena.country}<br />
                                <em>Games attended: {arena.games_attended}</em><br />
                                <small>Teams: {arena.teams.join(', ')}</small>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Click on markers to see arena details and games attended.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
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

        <Dialog open={openReprocessDialog} onClose={closeReprocessDialog} maxWidth="md" fullWidth>
          <DialogTitle>Reprocess All Games</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will reprocess all {games.length} games with the latest parsing logic to update team records, player stats, and game outcomes. 
              This process may take several minutes.
            </Typography>
            
            {reprocessProgress && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Processing Progress: {reprocessProgress.completed_items + reprocessProgress.failed_items} / {reprocessProgress.total_items}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={reprocessProgress.progress} 
                  sx={{ mb: 2 }}
                />
                
                {reprocessProgress.results && reprocessProgress.results.length > 0 && (
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {reprocessProgress.results.map((result: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={result.matchup || result.url}
                            secondary={result.status === 'success' ? 'Successfully reprocessed' : result.error}
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
            <Button onClick={closeReprocessDialog} disabled={loading}>
              {loading ? 'Processing...' : 'Close'}
            </Button>
            {!loading && !reprocessTaskId && (
              <Button
                onClick={handleReprocessAll}
                variant="contained"
                color="primary"
              >
                Start Reprocessing
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Dashboard;