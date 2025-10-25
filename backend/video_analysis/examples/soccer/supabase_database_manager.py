#!/usr/bin/env python3
"""
Supabase Database Manager for Soccer Analysis
Integrates with Supabase for comprehensive match tracking
"""

from supabase import create_client, Client
from typing import List, Dict, Optional, Tuple
import numpy as np
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseDatabaseManager:
    """
    Database manager for soccer tactical analysis using Supabase
    Uses existing schema with teams, matches, players, tracked_positions
    """

    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")

        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Caches
        self.tracker_to_player = {}  # tracker_id -> {'player_id', 'jersey_number', 'team_id'}
        self.jersey_to_player = {}   # (team_id, jersey_number) -> player_id

        # Current match context
        self.current_match_id = None
        self.team_a_id = None
        self.team_b_id = None

    def connect(self):
        """Establish database connection"""
        print("✓ Supabase client initialized")

    def disconnect(self):
        """Close database connection"""
        print("✓ Database session closed")

    def setup_match(self, match_id: str):
        """
        Setup match context - load teams and players
        MUST be called before processing video
        """
        self.current_match_id = match_id

        # Get match details
        match_result = self.supabase.table("matches").select("*").eq("id", match_id).execute()

        if not match_result.data or len(match_result.data) == 0:
            raise ValueError(f"Match {match_id} not found in database")

        match = match_result.data[0]

        self.team_a_id = match['team_id']
        # For now, we need to determine team_b_id from context or set it manually
        # In a real scenario, matches table should have both team_a_id and team_b_id
        # For demo purposes, we'll load all teams and assign second team as team_b

        teams_result = self.supabase.table("teams").select("id, name").limit(2).execute()
        if len(teams_result.data) >= 2:
            team_ids = [t['id'] for t in teams_result.data]
            self.team_a_id = team_ids[0] if self.team_a_id == team_ids[0] else team_ids[0]
            self.team_b_id = team_ids[1] if team_ids[1] != self.team_a_id else (team_ids[0] if team_ids[0] != self.team_a_id else None)

        print(f"✓ Match setup: Match ID {match_id}")
        print(f"  Sport: {match.get('sport', 'soccer')}, Opponent: {match.get('opponent', 'Unknown')}")

        # Load all players for both teams
        self._load_players()

    def _load_players(self):
        """Load all players for both teams in current match"""
        team_ids = [tid for tid in [self.team_a_id, self.team_b_id] if tid is not None]

        if not team_ids:
            print("⚠ No team IDs available for loading players")
            return []

        players_result = self.supabase.table("players").select("*").in_("team_id", team_ids).execute()

        players = players_result.data

        for player in players:
            key = (player['team_id'], player['jersey_number'])
            self.jersey_to_player[key] = player

        print(f"✓ Loaded {len(players)} players from database")
        return players

    def get_team_id_from_classification(self, classified_team: int) -> Optional[str]:
        """
        Convert team classifier output (0 or 1) to actual database team_id

        Args:
            classified_team: 0 or 1 from team classifier

        Returns:
            Actual team_id from database (UUID string)
        """
        if classified_team == 0:
            return self.team_a_id
        elif classified_team == 1:
            return self.team_b_id
        else:
            return None  # Referee or unknown

    def assign_tracker_to_jersey(self, tracker_id: int, jersey_number: int,
                                 classified_team: int) -> Optional[Dict]:
        """
        Map tracker_id to jersey_number and get player info

        Args:
            tracker_id: ByteTrack tracker ID
            jersey_number: Assigned jersey (1-11)
            classified_team: Team classification (0 or 1)

        Returns:
            Dict with player_id, jersey_number, team_id, name, position
        """
        # Check if already mapped
        if tracker_id in self.tracker_to_player:
            return self.tracker_to_player[tracker_id]

        # Convert classified team to actual team_id
        team_id = self.get_team_id_from_classification(classified_team)

        if team_id is None:
            return None

        # Get player from cache
        key = (team_id, jersey_number)
        player = self.jersey_to_player.get(key)

        if not player:
            print(f"⚠ Warning: Player not found for Team {team_id}, Jersey #{jersey_number}")
            # Create a placeholder mapping
            mapping = {
                'player_id': None,
                'jersey_number': jersey_number,
                'team_id': team_id,
                'name': f'Player {jersey_number}',
                'position': 'Unknown'
            }
            self.tracker_to_player[tracker_id] = mapping
            return mapping

        # Cache the mapping
        mapping = {
            'player_id': player['id'],
            'jersey_number': player['jersey_number'],
            'team_id': player['team_id'],
            'name': player['name'],
            'position': player['position']
        }
        self.tracker_to_player[tracker_id] = mapping

        print(f"✓ Mapped tracker {tracker_id} → Jersey #{jersey_number} ({player['name']}, {player['position']})")

        return mapping

    def get_player_info(self, tracker_id: int) -> Optional[Dict]:
        """Get player info for tracker_id"""
        return self.tracker_to_player.get(tracker_id)

    def insert_tracked_positions_batch(self, positions: List[Dict]):
        """
        Batch insert tracked positions

        Args:
            positions: List of position dicts with:
                - frame_id: int
                - timestamp: float (seconds)
                - jersey_number: int
                - team_id: str (UUID)
                - x: float (homography transformed)
                - y: float (homography transformed)
                - confidence: float
                - tracker_id: int
        """
        if not positions:
            return

        if self.current_match_id is None:
            raise ValueError("No match setup. Call setup_match() first.")

        # Add match_id to all positions
        for pos in positions:
            pos['match_id'] = self.current_match_id
            # Convert jersey_number to string if it's not 'BALL'
            if 'jersey_number' in pos and isinstance(pos['jersey_number'], int):
                pos['jersey_number'] = str(pos['jersey_number'])

        try:
            # Supabase batch insert
            self.supabase.table("tracked_positions").insert(positions).execute()
            print(f"✓ Inserted {len(positions)} position records to Supabase")
        except Exception as e:
            print(f"✗ Error inserting positions to Supabase: {e}")

    def insert_event(self, event_type: str, team_id: str, timestamp: str,
                    jersey_number: int, details: dict = None):
        """
        Insert match event (goal, card, assist, etc.)

        Args:
            event_type: 'GOAL', 'YELLOW_CARD', 'RED_CARD', 'ASSIST', 'SUBSTITUTION'
            team_id: Database team_id (UUID)
            timestamp: Time string (e.g., '45:30')
            jersey_number: Player's jersey number
            details: Additional event data (JSON)
        """
        # Get player_id from jersey_number and team_id
        key = (team_id, jersey_number)
        player = self.jersey_to_player.get(key)
        player_id = player['id'] if player else None

        event_data = {
            'match_id': self.current_match_id,
            'event_type': event_type,
            'team_id': team_id,
            'timestamp': timestamp,
            'player_id': player_id,
            'jersey_number': jersey_number,
            'details': details or {}
        }

        try:
            self.supabase.table("events").insert(event_data).execute()
            print(f"✓ Event recorded: {event_type} - Jersey #{jersey_number} at {timestamp}")
        except Exception as e:
            print(f"✗ Error recording event: {e}")

    def insert_substitution(self, team_id: str, jersey_out: int, jersey_in: int,
                          timestamp: str):
        """
        Record player substitution

        Args:
            team_id: Database team_id (UUID)
            jersey_out: Player leaving the field
            jersey_in: Player entering the field
            timestamp: Time string (e.g., '60:00')
        """
        # Get player IDs
        key_out = (team_id, jersey_out)
        key_in = (team_id, jersey_in)

        player_out = self.jersey_to_player.get(key_out)
        player_in = self.jersey_to_player.get(key_in)

        player_out_id = player_out['id'] if player_out else None
        player_in_id = player_in['id'] if player_in else None

        sub_data = {
            'match_id': self.current_match_id,
            'team_id': team_id,
            'player_out': player_out_id,
            'player_in': player_in_id,
            'jersey_out': jersey_out,
            'jersey_in': jersey_in,
            'timestamp': timestamp
        }

        try:
            self.supabase.table("substitutions").insert(sub_data).execute()
            out_name = player_out['name'] if player_out else f"#{jersey_out}"
            in_name = player_in['name'] if player_in else f"#{jersey_in}"
            print(f"✓ Substitution: {out_name} ➔ {in_name} at {timestamp}")
        except Exception as e:
            print(f"✗ Error recording substitution: {e}")

    def get_formation(self, team_id: str) -> Optional[str]:
        """Get formation type for team"""
        try:
            result = self.supabase.table("teams").select("name").eq("id", team_id).execute()
            if result.data:
                # For demo, return default formation
                # In production, this could be stored in a formations table
                return "4-3-3"
            return None
        except Exception as e:
            print(f"⚠ Error getting formation: {e}")
            return "4-4-2"

    def get_team_color(self, team_id: str) -> Optional[str]:
        """Get team color hex code"""
        try:
            result = self.supabase.table("teams").select("theme_colors").eq("id", team_id).execute()
            if result.data and result.data[0].get('theme_colors'):
                # Extract primary color from theme_colors JSON
                return result.data[0]['theme_colors'].get('primary', '#1295D8')
            return '#1295D8'  # Default blue
        except Exception as e:
            print(f"⚠ Error getting team color: {e}")
            return '#1295D8'

    def get_team_name(self, team_id: str) -> Optional[str]:
        """Get team name"""
        try:
            result = self.supabase.table("teams").select("name").eq("id", team_id).execute()
            if result.data:
                return result.data[0]['name']
            return f"Team {team_id}"
        except Exception as e:
            print(f"⚠ Error getting team name: {e}")
            return f"Team {team_id}"
