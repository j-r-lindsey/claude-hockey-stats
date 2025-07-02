export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Game {
  id: string;
  user_id: string;
  hockey_reference_url: string;
  date_attended: string;
  home_team: string;
  away_team: string;
  final_score_home: number;
  final_score_away: number;
  created_at: string;
}

export interface GameCreate {
  hockey_reference_url: string;
  date_attended: string;
}

export interface PlayerStat {
  id: string;
  game_id: string;
  player_name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plus_minus: number;
  pim: number;
  shots: number;
  hits: number;
  blocks: number;
  takeaways: number;
  giveaways: number;
  faceoff_wins: number;
  faceoff_losses: number;
  toi_seconds: number;
}

export interface TeamStat {
  id: string;
  team_name: string;
  goals: number;
  goals_against: number;
  wins: number;
  losses: number;
  ties: number;
  overtime_losses: number;
  shootout_losses: number;
  games_played: number;
}

export interface PlayerGameStat {
  id: string;
  player_name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plus_minus: number;
  pim: number;
  shots: number;
  hits: number;
  blocks: number;
  takeaways: number;
  giveaways: number;
  faceoff_wins: number;
  faceoff_losses: number;
  toi_seconds: number;
  // Game information
  game_date: string;
  home_team: string;
  away_team: string;
  final_score_home: number;
  final_score_away: number;
  hockey_reference_url: string;
}

export interface StatsSummary {
  total_games: number;
  teams_seen: string[];
  favorite_team: string | null;
  total_goals_witnessed: number;
  team_appearances: Record<string, number>;
}