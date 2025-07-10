from typing import Dict, List, Optional, Any
from data.nhl_arenas import get_home_arena_location, NHL_ARENAS, TEAM_ALIASES

class ArenaService:
    """Service for getting arena location information."""
    
    @staticmethod
    def get_game_location(home_team: str) -> Optional[Dict[str, Any]]:
        """
        Get location data for a game based on the home team.
        
        Args:
            home_team: Name of the home team
            
        Returns:
            Dict containing arena location data or None if not found
        """
        return get_home_arena_location(home_team)
    
    @staticmethod
    def get_games_with_locations(games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich a list of games with arena location data.
        
        Args:
            games: List of game dictionaries
            
        Returns:
            List of games with added location data
        """
        enriched_games = []
        
        for game in games:
            enriched_game = game.copy()
            
            # Get arena location for home team
            location_data = ArenaService.get_game_location(game.get('home_team', ''))
            
            if location_data:
                enriched_game.update({
                    'arena_name': location_data['arena'],
                    'arena_city': location_data['city'],
                    'arena_state': location_data['state'],
                    'arena_country': location_data['country'],
                    'arena_latitude': location_data['latitude'],
                    'arena_longitude': location_data['longitude']
                })
            else:
                # Add null values for missing location data
                enriched_game.update({
                    'arena_name': None,
                    'arena_city': None,
                    'arena_state': None,
                    'arena_country': None,
                    'arena_latitude': None,
                    'arena_longitude': None
                })
            
            enriched_games.append(enriched_game)
        
        return enriched_games
    
    @staticmethod
    def get_unique_arenas_from_games(games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Get unique arenas visited from a list of games.
        
        Args:
            games: List of game dictionaries
            
        Returns:
            List of unique arena locations with game counts
        """
        arena_counts = {}
        
        for game in games:
            home_team = game.get('home_team', '')
            location_data = ArenaService.get_game_location(home_team)
            
            if location_data:
                arena_key = location_data['arena']
                if arena_key not in arena_counts:
                    arena_counts[arena_key] = {
                        'arena_name': location_data['arena'],
                        'city': location_data['city'],
                        'state': location_data['state'],
                        'country': location_data['country'],
                        'latitude': location_data['latitude'],
                        'longitude': location_data['longitude'],
                        'games_attended': 0,
                        'teams': set()
                    }
                
                arena_counts[arena_key]['games_attended'] += 1
                arena_counts[arena_key]['teams'].add(home_team)
        
        # Convert sets to lists for JSON serialization
        result = []
        for arena_data in arena_counts.values():
            arena_data['teams'] = list(arena_data['teams'])
            result.append(arena_data)
        
        # Sort by games attended (descending)
        result.sort(key=lambda x: x['games_attended'], reverse=True)
        
        return result
    
    @staticmethod
    def get_all_nhl_arenas() -> List[Dict[str, Any]]:
        """
        Get all NHL arena locations.
        
        Returns:
            List of all NHL arenas with their location data
        """
        arenas = []
        for team, data in NHL_ARENAS.items():
            arenas.append({
                'team': team,
                'arena_name': data['arena'],
                'city': data['city'],
                'state': data['state'],
                'country': data['country'],
                'latitude': data['latitude'],
                'longitude': data['longitude']
            })
        
        return sorted(arenas, key=lambda x: x['team'])
    
    @staticmethod
    def search_team(query: str) -> List[str]:
        """
        Search for teams by name or abbreviation.
        
        Args:
            query: Search query
            
        Returns:
            List of matching team names
        """
        query_lower = query.lower()
        matches = []
        
        # Search in main team names
        for team in NHL_ARENAS.keys():
            if query_lower in team.lower():
                matches.append(team)
        
        # Search in aliases
        for alias, team in TEAM_ALIASES.items():
            if query_lower in alias.lower() and team not in matches:
                matches.append(team)
        
        return sorted(matches)