#!/usr/bin/env python3
"""
Seed Demo Data for TacticoAI
Creates UOP and UC California teams with sample players
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_supabase_client() -> Client:
    """Create Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)
    
    return create_client(url, key)

def seed_teams(supabase: Client):
    """Create demo teams"""
    print("🏈 Creating demo teams...")
    
    teams_data = [
        {
            "name": "UOP Tigers",
            "university": "UOP",
            "sport": "soccer",
            "theme_colors": {
                "primary": "#FF671D",  # Orange
                "secondary": "#231F20",  # Black
                "accent": "#22c55e"  # Green
            }
        },
        {
            "name": "UC California Bears",
            "university": "UC_CALIFORNIA", 
            "sport": "soccer",
            "theme_colors": {
                "primary": "#1295D8",  # Blue
                "secondary": "#FFB511",  # Gold
                "accent": "#22c55e"  # Green
            }
        }
    ]
    
    created_teams = []
    for team_data in teams_data:
        # Check if team already exists
        existing = supabase.table("teams").select("*").eq("university", team_data["university"]).execute()
        
        if existing.data:
            print(f"  ✓ Team {team_data['name']} already exists")
            # Use existing team - DON'T delete it to preserve IDs and localStorage references
            created_teams.append(existing.data[0])
        else:
            result = supabase.table("teams").insert(team_data).execute()
            team_id = result.data[0]["id"]
            print(f"  ✓ Created team: {team_data['name']} (ID: {team_id})")
            created_teams.append(result.data[0])
    
    return created_teams

def seed_players(supabase: Client, teams):
    """Create sample players for each team"""
    print("👥 Creating sample players...")
    
    # Sample players for each team
    players_data = {
        "UOP": [
            {"name": "Alex Rodriguez", "position": "Forward", "jersey_number": 9},
            {"name": "Marcus Johnson", "position": "Midfielder", "jersey_number": 10},
            {"name": "David Chen", "position": "Defender", "jersey_number": 4},
            {"name": "James Wilson", "position": "Goalkeeper", "jersey_number": 1},
            {"name": "Ryan Smith", "position": "Defender", "jersey_number": 5},
        ],
        "UC_CALIFORNIA": [
            {"name": "Carlos Martinez", "position": "Forward", "jersey_number": 7},
            {"name": "Ethan Brown", "position": "Midfielder", "jersey_number": 8},
            {"name": "Liam Davis", "position": "Defender", "jersey_number": 3},
            {"name": "Noah Garcia", "position": "Goalkeeper", "jersey_number": 12},
            {"name": "Owen Miller", "position": "Defender", "jersey_number": 6},
        ]
    }
    
    for team in teams:
        university = team["university"]
        team_id = team["id"]
        
        # Check if players already exist
        existing_players = supabase.table("players").select("id").eq("team_id", team_id).execute()
        
        if existing_players.data:
            print(f"  ✓ Team {team['name']} already has players")
            continue
        
        # Create players
        for player_data in players_data[university]:
            player_data["team_id"] = team_id
            player_data["stats"] = {
                "goals": 0,
                "assists": 0,
                "shots": 0,
                "passes": 0,
                "tackles": 0,
                "rating": 0.0,
                "minutes_played": 0
            }
            
            supabase.table("players").insert(player_data).execute()
        
        print(f"  ✓ Created {len(players_data[university])} players for {team['name']}")

def seed_sample_matches(supabase: Client, teams):
    """Create sample matches"""
    print("⚽ Creating sample matches...")
    
    if len(teams) < 2:
        print("  ⚠️  Need at least 2 teams to create matches")
        return
    
    # Sample matches
    matches_data = [
        {
            "team_id": teams[0]["id"],
            "opponent": "Stanford Cardinals",
            "sport": "soccer",
            "match_date": "2024-01-15",
            "status": "analyzed",
            "upload_status": "uploaded",
            "video_chunks_total": 5,
            "video_chunks_uploaded": 5,
            "score_home": 2,
            "score_away": 1,
            "is_home_game": True
        },
        {
            "team_id": teams[1]["id"],
            "opponent": "UCLA Bruins",
            "sport": "soccer", 
            "match_date": "2024-01-20",
            "status": "analyzed",
            "upload_status": "uploaded",
            "video_chunks_total": 3,
            "video_chunks_uploaded": 3,
            "score_home": 1,
            "score_away": 3,
            "is_home_game": False
        }
    ]
    
    for match_data in matches_data:
        # Check if match already exists
        existing = supabase.table("matches").select("id").eq("team_id", match_data["team_id"]).eq("opponent", match_data["opponent"]).execute()
        
        if existing.data:
            print(f"  ✓ Match vs {match_data['opponent']} already exists")
            continue
        
        result = supabase.table("matches").insert(match_data).execute()
        match_id = result.data[0]["id"]
        print(f"  ✓ Created match: {match_data['opponent']} (ID: {match_id})")

def main():
    """Main seeding function"""
    print("🌱 Seeding TacticoAI demo data...")
    
    try:
        supabase = create_supabase_client()
        
        # Create teams
        teams = seed_teams(supabase)
        
        # Create players
        seed_players(supabase, teams)
        
        # Create sample matches
        seed_sample_matches(supabase, teams)
        
        print("\n✅ Demo data seeding completed successfully!")
        print("\nTeams created:")
        for team in teams:
            print(f"  - {team['name']} ({team['university']})")
        
        print("\nYou can now:")
        print("1. Start the backend: python main.py")
        print("2. Start the frontend: npm run dev")
        print("3. Select a team and view matches")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
