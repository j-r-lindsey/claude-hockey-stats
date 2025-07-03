import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  Button,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { apiService } from '../services/apiService';
import type { TeamGameStat } from '../types/api';

const TeamDetail: React.FC = () => {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const [games, setGames] = useState<TeamGameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamName) {
      loadTeamGames();
    }
  }, [teamName]);

  const loadTeamGames = async () => {
    if (!teamName) return;
    
    try {
      setLoading(true);
      const data = await apiService.getTeamGameStats(teamName);
      // Sort by game date (most recent first)
      data.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());
      setGames(data);
    } catch (error) {
      setError('Failed to load team games');
      console.error('Error loading team games:', error);
    } finally {
      setLoading(false);
    }
  };


  const getGameResult = (game: TeamGameStat): string => {
    if (game.wins > 0) return 'W';
    if (game.losses > 0) return 'L';
    if (game.overtime_losses > 0) return 'OTL';
    if (game.shootout_losses > 0) return 'SOL';
    if (game.ties > 0) return 'T';
    return '-';
  };

  const getGameResultColor = (result: string): 'success' | 'error' | 'warning' | 'default' => {
    if (result === 'W') return 'success';
    if (result === 'L') return 'error';
    if (result === 'OTL' || result === 'SOL') return 'warning';
    return 'default';
  };

  const getOpponent = (game: TeamGameStat): string => {
    return game.is_home ? game.away_team : game.home_team;
  };

  const getGameLocation = (game: TeamGameStat): string => {
    return game.is_home ? 'vs' : '@';
  };

  const columns: GridColDef[] = [
    {
      field: 'game_date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value: any) => {
        if (!value) return '';
        // Handle ISO date format like "2024-06-18T00:00:00+00:00"
        if (typeof value === 'string' && value.includes('T')) {
          const dateOnly = value.split('T')[0];
          // Format YYYY-MM-DD as MM/DD/YYYY
          const [year, month, day] = dateOnly.split('-');
          return `${month}/${day}/${year}`;
        }
        return String(value);
      }
    },
    {
      field: 'opponent',
      headerName: 'Opponent',
      width: 180,
      valueGetter: (_: any, row: any) => `${getGameLocation(row)} ${getOpponent(row)}`
    },
    {
      field: 'result',
      headerName: 'Result',
      width: 80,
      renderCell: (params: GridRenderCellParams) => {
        const result = getGameResult(params.row);
        return (
          <Chip
            label={result}
            color={getGameResultColor(result)}
            size="small"
            variant="filled"
          />
        );
      }
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 100,
      valueGetter: (_: any, row: any) => `${row.goals}-${row.goals_against}`
    },
    {
      field: 'goals',
      headerName: 'GF',
      width: 60,
      type: 'number'
    },
    {
      field: 'goals_against',
      headerName: 'GA',
      width: 60,
      type: 'number'
    },
    {
      field: 'actions',
      headerName: 'View',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          startIcon={<OpenInNew />}
          onClick={() => window.open(params.row.hockey_reference_url, '_blank')}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Calculate team stats summary
  const totalGames = games.length;
  const totalWins = games.reduce((sum, game) => sum + game.wins, 0);
  const totalLosses = games.reduce((sum, game) => sum + game.losses, 0);
  const totalOTL = games.reduce((sum, game) => sum + game.overtime_losses, 0);
  const totalSOL = games.reduce((sum, game) => sum + game.shootout_losses, 0);
  const totalTies = games.reduce((sum, game) => sum + game.ties, 0);
  const totalGoalsFor = games.reduce((sum, game) => sum + game.goals, 0);
  const totalGoalsAgainst = games.reduce((sum, game) => sum + game.goals_against, 0);
  const points = (totalWins * 2) + totalOTL + totalSOL + totalTies;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header with breadcrumbs */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/stats?tab=1')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              Team Statistics
            </Link>
            <Typography variant="body2" color="text.primary">
              {teamName}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
            {teamName} - Game Log
          </Typography>
        </Box>
        <IconButton onClick={() => navigate('/stats?tab=1')} size="large">
          <ArrowBack />
        </IconButton>
      </Box>

      {/* Team Summary Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Season Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body1">
              <strong>Record:</strong> {totalWins}-{totalLosses}-{totalOTL}-{totalSOL}
              {totalTies > 0 && `-${totalTies}`}
            </Typography>
            <Typography variant="body1">
              <strong>Points:</strong> {points}
            </Typography>
            <Typography variant="body1">
              <strong>Games:</strong> {totalGames}
            </Typography>
            <Typography variant="body1">
              <strong>Goals For:</strong> {totalGoalsFor}
            </Typography>
            <Typography variant="body1">
              <strong>Goals Against:</strong> {totalGoalsAgainst}
            </Typography>
            <Typography variant="body1">
              <strong>Goal Differential:</strong> {totalGoalsFor - totalGoalsAgainst > 0 ? '+' : ''}{totalGoalsFor - totalGoalsAgainst}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Games Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Individual Games ({games.length})
          </Typography>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={games}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              disableRowSelectionOnClick
              density="compact"
              getRowId={(row) => row.id}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TeamDetail;