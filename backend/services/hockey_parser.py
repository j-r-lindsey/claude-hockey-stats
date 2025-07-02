import requests
from bs4 import BeautifulSoup, Tag
import pandas as pd
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

def extract_team_stats(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract team-level statistics including season records"""
    try:
        team_stats = []
        
        # Get team names
        home_team = extract_home_team(soup)
        away_team = extract_away_team(soup)
        
        # Get goals from the game
        home_goals = extract_home_score(soup)
        away_goals = extract_away_score(soup)
        
        # Look for team record information in various locations
        away_record = extract_team_record(soup, away_team)
        home_record = extract_team_record(soup, home_team)
        
        # Create team stat entries with record information
        away_stat = {
            "team_name": away_team,
            "is_home": False,
            "goals": away_goals,
            "goals_against": home_goals,  # Goals against = opponent's goals
            "wins": away_record.get("wins", 0),
            "losses": away_record.get("losses", 0),
            "ties": away_record.get("ties", 0),
            "overtime_losses": away_record.get("overtime_losses", 0),
            "shootout_losses": away_record.get("shootout_losses", 0)
        }
        
        home_stat = {
            "team_name": home_team,
            "is_home": True,
            "goals": home_goals,
            "goals_against": away_goals,  # Goals against = opponent's goals
            "wins": home_record.get("wins", 0),
            "losses": home_record.get("losses", 0),
            "ties": home_record.get("ties", 0),
            "overtime_losses": home_record.get("overtime_losses", 0),
            "shootout_losses": home_record.get("shootout_losses", 0)
        }
        
        return [away_stat, home_stat]
    
    except Exception as e:
        print(f"Error parsing team stats: {e}")
        return []

def extract_team_record(soup: BeautifulSoup, team_name: str) -> Dict[str, int]:
    """Extract team's season record (W-L-T-OTL-SOL) from the page"""
    try:
        record = {
            "wins": 0,
            "losses": 0,
            "ties": 0,
            "overtime_losses": 0,
            "shootout_losses": 0
        }
        
        # Look for team record in scorebox or team info sections
        scorebox = soup.find("div", {"class": "scorebox"})
        if scorebox:
            # Look for record patterns like "(25-15-8)" or "(W-L-OTL)"
            record_elements = scorebox.find_all(string=re.compile(r'\(\d+-\d+'))
            for element in record_elements:
                record_match = re.search(r'\((\d+)-(\d+)(?:-(\d+))?(?:-(\d+))?(?:-(\d+))?\)', element)
                if record_match:
                    wins = int(record_match.group(1)) if record_match.group(1) else 0
                    losses = int(record_match.group(2)) if record_match.group(2) else 0
                    
                    # Third number could be ties or overtime losses depending on era
                    third = int(record_match.group(3)) if record_match.group(3) else 0
                    fourth = int(record_match.group(4)) if record_match.group(4) else 0
                    fifth = int(record_match.group(5)) if record_match.group(5) else 0
                    
                    # Modern NHL format is typically W-L-OTL or W-L-T-OTL-SOL
                    record.update({
                        "wins": wins,
                        "losses": losses,
                        "overtime_losses": third if not fourth else fourth,
                        "ties": third if fourth else 0,
                        "shootout_losses": fifth
                    })
                    break
        
        # Alternative: look for standings table or team info
        team_links = soup.find_all("a", href=re.compile(r"/teams/"))
        for link in team_links:
            if team_name.upper() in link.text.upper():
                # Look for record info near team name
                parent = link.parent
                if parent:
                    record_text = parent.get_text()
                    record_match = re.search(r'\((\d+)-(\d+)(?:-(\d+))?(?:-(\d+))?(?:-(\d+))?\)', record_text)
                    if record_match:
                        wins = int(record_match.group(1)) if record_match.group(1) else 0
                        losses = int(record_match.group(2)) if record_match.group(2) else 0
                        third = int(record_match.group(3)) if record_match.group(3) else 0
                        fourth = int(record_match.group(4)) if record_match.group(4) else 0
                        fifth = int(record_match.group(5)) if record_match.group(5) else 0
                        
                        record.update({
                            "wins": wins,
                            "losses": losses,
                            "overtime_losses": third if not fourth else fourth,
                            "ties": third if fourth else 0,
                            "shootout_losses": fifth
                        })
                        break
        
        return record
        
    except Exception as e:
        print(f"Error extracting team record for {team_name}: {e}")
        return {
            "wins": 0,
            "losses": 0,
            "ties": 0,
            "overtime_losses": 0,
            "shootout_losses": 0
        }


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