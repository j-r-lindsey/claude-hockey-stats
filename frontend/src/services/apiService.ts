import axios from 'axios';
import type { Game, GameCreate, PlayerStat, TeamStat, StatsSummary } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Games
  async createGame(gameData: GameCreate): Promise<Game> {
    const response = await api.post('/games/', gameData);
    return response.data;
  },

  async getGames(): Promise<Game[]> {
    const response = await api.get('/games/');
    return response.data;
  },

  async getGame(gameId: string): Promise<Game> {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  async deleteGame(gameId: string): Promise<void> {
    await api.delete(`/games/${gameId}`);
  },

  // Stats
  async getPlayerStats(filters?: {
    player_name?: string;
    team?: string;
    position?: string;
  }): Promise<PlayerStat[]> {
    const params = new URLSearchParams();
    if (filters?.player_name) params.append('player_name', filters.player_name);
    if (filters?.team) params.append('team', filters.team);
    if (filters?.position) params.append('position', filters.position);
    
    const response = await api.get(`/stats/players?${params.toString()}`);
    return response.data;
  },

  async getTeamStats(teamName?: string): Promise<TeamStat[]> {
    const params = teamName ? `?team_name=${teamName}` : '';
    const response = await api.get(`/stats/teams${params}`);
    return response.data;
  },

  async getStatsSummary(): Promise<StatsSummary> {
    const response = await api.get('/stats/summary');
    return response.data;
  },
};