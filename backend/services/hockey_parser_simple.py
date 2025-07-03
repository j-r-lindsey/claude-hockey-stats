import requests
from bs4 import BeautifulSoup, Tag
import re
from typing import Dict, List, Any

def parse_hockey_reference_url(url: str) -> Dict[str, Any]:
    """
    Parse a hockey-reference.com box score URL and extract game data.
    """
    
    # Extract game date from URL
    game_date = extract_date_from_url(url)
    
    # Fetch the page content
    response = requests.get(url)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract basic game information
    game_data = {
        "home_team": extract_home_team(soup),
        "away_team": extract_away_team(soup),
        "final_score_home": extract_home_score(soup),
        "final_score_away": extract_away_score(soup),
        "game_date": game_date,
        "player_stats": extract_player_stats(soup),
        "team_stats": extract_team_stats(soup)
    }
    
    return game_data

def extract_date_from_url(url: str) -> str:
    """Extract game date from hockey-reference URL"""
    try:
        # Hockey Reference URLs typically follow pattern: 
        # https://www.hockey-reference.com/boxscores/YYYYMMDDXXX.html
        # where YYYYMMDD is the date
        
        # Extract filename from URL
        filename = url.split('/')[-1]
        
        # Extract date pattern (first 8 digits)
        date_match = re.search(r'(\d{8})', filename)
        if date_match:
            date_str = date_match.group(1)
            # Convert YYYYMMDD to YYYY-MM-DD
            if len(date_str) == 8:
                year = date_str[:4]
                month = date_str[4:6]
                day = date_str[6:8]
                return f"{year}-{month}-{day}"
        
        # Fallback: try to extract date from page content
        return None
        
    except Exception as e:
        print(f"Error extracting date from URL: {e}")
        return None

def extract_home_team(soup: BeautifulSoup) -> str:
    """Extract home team name from the page"""
    try:
        # Method 1: Look for team names in the scorebox
        scorebox = soup.find("div", {"class": "scorebox"})
        if scorebox:
            # Find strong tags or team name elements
            team_elements = scorebox.find_all("strong")
            if len(team_elements) >= 2:
                return team_elements[1].text.strip()
            
            # Alternative: look for links to team pages
            team_links = scorebox.find_all("a", href=re.compile(r"/teams/"))
            if len(team_links) >= 2:
                return team_links[1].text.strip()
        
        # Method 2: Check page title format "Away @ Home"
        title = soup.find("title")
        if title:
            title_text = title.text
            # Pattern: "Team1 @ Team2" where Team2 is home
            at_match = re.search(r'@\s+([^,\-]+)', title_text)
            if at_match:
                return at_match.group(1).strip()
            
            # Pattern: "Team1 vs Team2" where Team2 is home  
            vs_match = re.search(r'vs\s+([^,\-]+)', title_text)
            if vs_match:
                return vs_match.group(1).strip()
        
        # Method 3: Look in table IDs for team abbreviations
        tables = soup.find_all("table", {"id": lambda x: x and x.endswith('_skaters')})
        if len(tables) >= 2:
            # Second table should be home team
            table_id = tables[1].get('id', '')
            team_abbr = table_id.replace('_skaters', '').upper()
            if team_abbr:
                return team_abbr
        
        return "Unknown Home Team"
    except Exception as e:
        print(f"Error extracting home team: {e}")
        return "Unknown Home Team"

def extract_away_team(soup: BeautifulSoup) -> str:
    """Extract away team name from the page"""
    try:
        # Method 1: Look for team names in the scorebox
        scorebox = soup.find("div", {"class": "scorebox"})
        if scorebox:
            # Find strong tags or team name elements
            team_elements = scorebox.find_all("strong")
            if len(team_elements) >= 1:
                return team_elements[0].text.strip()
            
            # Alternative: look for links to team pages
            team_links = scorebox.find_all("a", href=re.compile(r"/teams/"))
            if len(team_links) >= 1:
                return team_links[0].text.strip()
        
        # Method 2: Check page title format "Away @ Home"
        title = soup.find("title")
        if title:
            title_text = title.text
            # Pattern: "Team1 @ Team2" where Team1 is away
            at_match = re.search(r'^([^@]+)@', title_text)
            if at_match:
                return at_match.group(1).strip()
            
            # Pattern: "Team1 vs Team2" where Team1 is away
            vs_match = re.search(r'^([^v]+)vs', title_text)
            if vs_match:
                return vs_match.group(1).strip()
        
        # Method 3: Look in table IDs for team abbreviations
        tables = soup.find_all("table", {"id": lambda x: x and x.endswith('_skaters')})
        if len(tables) >= 1:
            # First table should be away team
            table_id = tables[0].get('id', '')
            team_abbr = table_id.replace('_skaters', '').upper()
            if team_abbr:
                return team_abbr
        
        return "Unknown Away Team"
    except Exception as e:
        print(f"Error extracting away team: {e}")
        return "Unknown Away Team"

def extract_home_score(soup: BeautifulSoup) -> int:
    """Extract home team final score"""
    try:
        # Look for final score in the scorebox
        scorebox = soup.find("div", {"class": "scorebox"})
        if scorebox:
            score_divs = scorebox.find_all("div", {"class": "score"})
            if len(score_divs) >= 2:
                # Second score is usually home team
                home_score_text = score_divs[1].text.strip()
                return int(re.search(r'\d+', home_score_text).group())
        
        return 0
    except Exception:
        return 0

def extract_away_score(soup: BeautifulSoup) -> int:
    """Extract away team final score"""
    try:
        # Look for final score in the scorebox
        scorebox = soup.find("div", {"class": "scorebox"})
        if scorebox:
            score_divs = scorebox.find_all("div", {"class": "score"})
            if len(score_divs) >= 1:
                # First score is usually away team
                away_score_text = score_divs[0].text.strip()
                return int(re.search(r'\d+', away_score_text).group())
        
        return 0
    except Exception:
        return 0

def extract_player_stats(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract individual player statistics using Beautiful Soup"""
    try:
        player_stats = []
        
        # Find all skater tables (both teams)  
        skater_tables = soup.find_all("table", {"id": lambda x: x and x.endswith('_skaters')})
        
        for table in skater_tables:
            # Extract team name from table ID
            table_id = table.get('id', '')
            team_name = table_id.replace('_skaters', '').upper()
            
            # Get header row to identify columns
            thead = table.find('thead')
            if not thead:
                continue
                
            header_rows = thead.find_all('tr')
            header_row = None
            
            # Find the row with actual column headers (not just "Basic Stats" etc.)
            for row in header_rows:
                if row.find('th', string='Player'):
                    header_row = row
                    break
                    
            if not header_row:
                continue
                
            # Extract column names
            headers = []
            for th in header_row.find_all('th'):
                header_text = th.get_text(strip=True)
                if header_text and header_text != 'Rk':
                    headers.append(header_text)
            
            # Get table body
            tbody = table.find('tbody')
            if not tbody:
                continue
                
            # Process each player row
            for tr in tbody.find_all('tr'):
                if tr.get('class') and 'thead' in tr.get('class'):
                    continue  # Skip header rows in tbody
                    
                cells = tr.find_all(['td', 'th'])
                if len(cells) < 2:
                    continue
                    
                # Create dictionary mapping headers to values
                row_data = {}
                for i, cell in enumerate(cells[1:], 1):  # Skip rank column
                    if i-1 < len(headers):
                        row_data[headers[i-1]] = cell.get_text(strip=True)
                
                # Skip if no player name
                if not row_data.get('Player'):
                    continue
                    
                try:
                    # Map to database fields
                    player_stat = {
                        "player_name": str(row_data.get('Player', '')),
                        "team": team_name,
                        "position": str(row_data.get('Pos', '')),
                        "goals": parse_int(row_data.get('G', 0)),
                        "assists": parse_int(row_data.get('A', 0)),
                        "points": parse_int(row_data.get('PTS', 0)),
                        "plus_minus": parse_int(row_data.get('+/-', 0)),
                        "pim": parse_int(row_data.get('PIM', 0)),
                        "shots": parse_int(row_data.get('S', 0)),
                        "hits": parse_int(row_data.get('H', 0)),
                        "blocks": parse_int(row_data.get('BLK', 0)),
                        "takeaways": parse_int(row_data.get('TK', 0)),
                        "giveaways": parse_int(row_data.get('GV', 0)),
                        "faceoff_wins": parse_int(row_data.get('FO', 0)),
                        "faceoff_losses": 0,
                        "toi_seconds": parse_toi_to_seconds(row_data.get('TOI', '0:00'))
                    }
                    
                    # Calculate faceoff losses if we have faceoff percentage
                    fo_pct = row_data.get('FO%', '')
                    if fo_pct and player_stat["faceoff_wins"] > 0:
                        try:
                            fo_percentage = float(fo_pct.replace('%', '')) / 100
                            if fo_percentage > 0:
                                total_fos = int(player_stat["faceoff_wins"] / fo_percentage)
                                player_stat["faceoff_losses"] = total_fos - player_stat["faceoff_wins"]
                        except:
                            pass
                    
                    player_stats.append(player_stat)
                    
                except Exception as e:
                    print(f"Error processing player row: {e}")
                    continue
        
        return player_stats
    
    except Exception as e:
        print(f"Error parsing player stats: {e}")
        return []

def extract_game_outcome(soup: BeautifulSoup, home_team: str, away_team: str, home_goals: int, away_goals: int) -> str:
    """Extract game outcome (regulation, OT, SO) from league scores section"""
    try:
        # Look for the scores section that shows games around the league
        scores_section = soup.find("div", {"class": "scores"}) or soup.find("div", {"id": "scores"})
        
        if scores_section:
            # Look for the current game in the scores list
            score_links = scores_section.find_all("a", href=True)
            
            for link in score_links:
                link_text = link.get_text(strip=True)
                
                # Check if this is our game by looking for team names
                if (home_team.lower() in link_text.lower() or away_team.lower() in link_text.lower()):
                    # Check for shootout indicator (SO)
                    if "SO" in link_text:
                        return "SO"
                    # Check for overtime indicator (OT) 
                    elif "OT" in link_text:
                        return "OT"
                    # If no special indicator, it's regulation
                    else:
                        return "REG"
        
        # Fallback: if we can't find the outcome, assume regulation
        return "REG"
    
    except Exception as e:
        print(f"Error extracting game outcome: {e}")
        return "REG"

def extract_team_stats(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract team-level statistics with proper game outcome"""
    try:
        team_stats = []
        
        # Get team names
        home_team = extract_home_team(soup)
        away_team = extract_away_team(soup)
        
        # Get goals from the game
        home_goals = extract_home_score(soup)
        away_goals = extract_away_score(soup)
        
        # Determine game outcome (REG, OT, SO)
        game_outcome = extract_game_outcome(soup, home_team, away_team, home_goals, away_goals)
        
        # Determine winner
        home_won = home_goals > away_goals
        away_won = away_goals > home_goals
        tie_game = home_goals == away_goals
        
        # Calculate wins/losses based on outcome
        away_stat = {
            "team_name": away_team,
            "is_home": False,
            "goals": away_goals,
            "goals_against": home_goals,
            "wins": 1 if away_won else 0,
            "losses": 1 if (home_won and game_outcome == "REG") else 0,
            "ties": 1 if tie_game else 0,
            "overtime_losses": 1 if (home_won and game_outcome == "OT") else 0,
            "shootout_losses": 1 if (home_won and game_outcome == "SO") else 0
        }
        
        home_stat = {
            "team_name": home_team,
            "is_home": True,
            "goals": home_goals,
            "goals_against": away_goals,
            "wins": 1 if home_won else 0,
            "losses": 1 if (away_won and game_outcome == "REG") else 0,
            "ties": 1 if tie_game else 0,
            "overtime_losses": 1 if (away_won and game_outcome == "OT") else 0,
            "shootout_losses": 1 if (away_won and game_outcome == "SO") else 0
        }
        
        return [away_stat, home_stat]
    
    except Exception as e:
        print(f"Error parsing team stats: {e}")
        return []

def parse_int(value) -> int:
    """Safely parse integer values"""
    try:
        if isinstance(value, str):
            # Remove any non-digit characters except minus sign
            cleaned = re.sub(r'[^\d-]', '', value)
            return int(cleaned) if cleaned else 0
        return int(value)
    except:
        return 0

def parse_toi_to_seconds(toi_str: str) -> int:
    """Convert time on ice (MM:SS) to total seconds"""
    try:
        if ':' in str(toi_str):
            parts = str(toi_str).split(':')
            minutes = int(parts[0])
            seconds = int(parts[1])
            return (minutes * 60) + seconds
        return 0
    except:
        return 0