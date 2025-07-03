import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { PlayerStat, TeamStat } from '../types/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

// CSS for goal differential colors
const styles = `
  .positive-differential {
    color: #2e7d32 !important;
    font-weight: bold;
  }
  .negative-differential {
    color: #d32f2f !important;
    font-weight: bold;
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Stats: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [tabValue, setTabValue] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam ? parseInt(tabParam, 10) : 0;
  });
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [playerFilters, setPlayerFilters] = useState({
    player_name: '',
    team: '',
    position: '',
  });
  const [teamFilter, setTeamFilter] = useState('');
  const [dataGridKey, setDataGridKey] = useState(0);
  const [sortingModel, setSortingModel] = useState([
    { field: 'points', sort: 'desc' as const }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPlayerStats();
    loadTeamStats();
  }, [isAuthenticated, navigate]);

  const loadPlayerStats = async () => {
    try {
      const data = await apiService.getPlayerStats(playerFilters);
      // Ensure each row has a stable unique ID to prevent duplicates
      const dataWithUniqueIds = data.map(player => ({
        ...player,
        id: `${player.player_name}-${player.team}-${player.position}`.replace(/\s+/g, '-')
      }));
      setPlayerStats(dataWithUniqueIds);
      // Only reset sort and key when filters change, not on every load
      if (Object.values(playerFilters).some(filter => filter !== '')) {
        setSortingModel([{ field: 'points', sort: 'desc' }]);
        setDataGridKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load player stats:', error);
    }
  };

  const loadTeamStats = async () => {
    try {
      const data = await apiService.getTeamStats(teamFilter || undefined);
      // Ensure each row has a stable unique ID
      const dataWithUniqueIds = data.map(team => ({
        ...team,
        id: `team-${team.team_name}`.replace(/\s+/g, '-')
      }));
      setTeamStats(dataWithUniqueIds);
    } catch (error) {
      console.error('Failed to load team stats:', error);
    }
  };

  const handleSortModelChange = (newSortModel: any) => {
    // Only update if it's actually different
    if (JSON.stringify(newSortModel) !== JSON.stringify(sortingModel)) {
      setSortingModel(newSortModel);
    }
  };

  useEffect(() => {
    loadPlayerStats();
  }, [playerFilters]);

  useEffect(() => {
    loadTeamStats();
  }, [teamFilter]);

  const playerColumns: GridColDef[] = [
    { 
      field: 'player_name', 
      headerName: 'Player', 
      width: 150,
      renderCell: (params) => (
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate(`/players/${encodeURIComponent(params.value)}`)}
          sx={{ 
            textDecoration: 'underline', 
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 'medium'
          }}
        >
          {params.value}
        </Link>
      ),
      sortComparator: (v1, v2) => {
        // Force string comparison to be consistent
        const a = String(v1 || '').toLowerCase();
        const b = String(v2 || '').toLowerCase();
        return a.localeCompare(b);
      }
    },
    { 
      field: 'team', 
      headerName: 'Team', 
      width: 100,
      sortComparator: (v1, v2) => {
        // Force string comparison to be consistent
        const a = String(v1 || '').toLowerCase();
        const b = String(v2 || '').toLowerCase();
        return a.localeCompare(b);
      }
    },
    { 
      field: 'position', 
      headerName: 'Pos', 
      width: 80,
      sortComparator: (v1, v2) => {
        // Force string comparison to be consistent
        const a = String(v1 || '').toLowerCase();
        const b = String(v2 || '').toLowerCase();
        return a.localeCompare(b);
      }
    },
    { field: 'games_played', headerName: 'GP', width: 60, type: 'number' },
    { field: 'goals', headerName: 'G', width: 60, type: 'number' },
    { field: 'assists', headerName: 'A', width: 60, type: 'number' },
    { field: 'points', headerName: 'P', width: 60, type: 'number' },
    { field: 'plus_minus', headerName: '+/-', width: 70, type: 'number' },
    { field: 'pim', headerName: 'PIM', width: 70, type: 'number' },
    { field: 'shots', headerName: 'SOG', width: 70, type: 'number' },
    { field: 'hits', headerName: 'Hits', width: 70, type: 'number' },
    { field: 'blocks', headerName: 'Blks', width: 70, type: 'number' },
    { field: 'takeaways', headerName: 'TK', width: 60, type: 'number' },
    { field: 'giveaways', headerName: 'GV', width: 60, type: 'number' },
    { 
      field: 'faceoff_percentage', 
      headerName: 'FO%', 
      width: 80, 
      type: 'number',
      valueGetter: (_, row) => {
        const wins = row.faceoff_wins;
        const losses = row.faceoff_losses;
        const total = wins + losses;
        return total > 0 ? Math.round((wins / total) * 100) : 0;
      }
    },
    { 
      field: 'toi_seconds', 
      headerName: 'TOI', 
      width: 80,
      type: 'number',
      valueFormatter: (value) => {
        const seconds = value || 0;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    },
  ];

  const teamColumns: GridColDef[] = [
    { 
      field: 'team_name', 
      headerName: 'Team', 
      width: 150,
      renderCell: (params) => (
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate(`/teams/${encodeURIComponent(params.value)}`)}
          sx={{ textAlign: 'left', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {params.value}
        </Link>
      ),
      sortComparator: (v1, v2) => {
        // Force string comparison to be consistent
        const a = String(v1 || '').toLowerCase();
        const b = String(v2 || '').toLowerCase();
        return a.localeCompare(b);
      }
    },
    { 
      field: 'games_played', 
      headerName: 'GP', 
      width: 60, 
      type: 'number',
      valueGetter: (_, row) => {
        return row.wins + row.losses + row.ties + row.overtime_losses + row.shootout_losses;
      }
    },
    { field: 'wins', headerName: 'W', width: 60, type: 'number' },
    { field: 'losses', headerName: 'L', width: 60, type: 'number' },
    { field: 'overtime_losses', headerName: 'OTL', width: 70, type: 'number' },
    { field: 'shootout_losses', headerName: 'SOL', width: 70, type: 'number' },
    { field: 'ties', headerName: 'T', width: 60, type: 'number' },
    { 
      field: 'points', 
      headerName: 'PTS', 
      width: 70, 
      type: 'number',
      valueGetter: (_, row) => {
        // Standard NHL point system: 2 for win, 1 for OTL/SOL, 0 for loss
        return (row.wins * 2) + row.overtime_losses + row.shootout_losses;
      }
    },
    { 
      field: 'win_percentage', 
      headerName: 'WIN%', 
      width: 80, 
      type: 'number',
      valueGetter: (_, row) => {
        const totalGames = row.wins + row.losses + row.ties + row.overtime_losses + row.shootout_losses;
        return totalGames > 0 ? Math.round((row.wins / totalGames) * 100) : 0;
      }
    },
    { field: 'goals', headerName: 'GF', width: 70, type: 'number' },
    { field: 'goals_against', headerName: 'GA', width: 70, type: 'number' },
    { 
      field: 'goal_differential', 
      headerName: 'DIFF', 
      width: 80, 
      type: 'number',
      valueGetter: (_, row) => row.goals - row.goals_against,
      cellClassName: (params) => {
        const diff = params.value as number;
        return diff > 0 ? 'positive-differential' : diff < 0 ? 'negative-differential' : '';
      }
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <style>{styles}</style>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
        Statistics
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Player Stats" />
          <Tab label="Team Stats" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 1.5 }}>
          <CardContent sx={{ py: 1.5, pb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Filters
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Player Name"
                  value={playerFilters.player_name}
                  onChange={(e) => setPlayerFilters({
                    ...playerFilters,
                    player_name: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Team"
                  value={playerFilters.team}
                  onChange={(e) => setPlayerFilters({
                    ...playerFilters,
                    team: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={playerFilters.position}
                    label="Position"
                    onChange={(e) => setPlayerFilters({
                      ...playerFilters,
                      position: e.target.value
                    })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="C">Center</MenuItem>
                    <MenuItem value="LW">Left Wing</MenuItem>
                    <MenuItem value="RW">Right Wing</MenuItem>
                    <MenuItem value="D">Defense</MenuItem>
                    <MenuItem value="G">Goalie</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div style={{ height: 'calc(100vh - 240px)', width: '100%' }}>
              <DataGrid
                key={`player-grid-${dataGridKey}`}
                rows={playerStats}
                columns={playerColumns}
                sortModel={sortingModel}
                onSortModelChange={handleSortModelChange}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 },
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                density="compact"
                sortingOrder={['desc', 'asc']}
                sx={{
                  '& .MuiDataGrid-cell': {
                    padding: '4px 8px',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '4px 8px',
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card sx={{ mb: 1.5 }}>
          <CardContent sx={{ py: 1.5, pb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Filters
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Team Name"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
              <DataGrid
                key={`team-grid-${dataGridKey}`}
                rows={teamStats}
                columns={teamColumns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 },
                  },
                  sorting: {
                    sortModel: [
                      { field: 'points', sort: 'desc' }
                    ],
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                density="compact"
                sortingOrder={['desc', 'asc']}
                sx={{
                  '& .MuiDataGrid-cell': {
                    padding: '4px 8px',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '4px 8px',
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default Stats;