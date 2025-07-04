import axios from 'axios';
import type { User, UserCreate, UserLogin, Token } from '../types/api';

// Force production URL when not explicitly set and not on localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 
   typeof window !== 'undefined' ? window.location.origin : '');

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

export const authService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async register(userData: UserCreate): Promise<User> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials: UserLogin): Promise<Token> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};