#!/usr/bin/env python3
"""
Enhanced Jersey Manager with Database Integration
Manages jersey assignments with database integration for player tracking
"""

from typing import Dict, Optional
from supabase_database_manager import SupabaseDatabaseManager

class EnhancedJerseyManager:
    """
    Manages jersey assignments with database integration
    """

    def __init__(self, db: SupabaseDatabaseManager):
        self.db = db
        self.tracker_to_jersey = {}  # tracker_id -> jersey_number
        self.available_jerseys = {
            db.team_a_id: set(range(1, 21)),  # Team A: 1-20
            db.team_b_id: set(range(21, 41))  # Team B: 21-40
        }

    def assign_jersey(self, tracker_id: int, classified_team: int) -> int:
        """
        Assign jersey and register with database

        Args:
            tracker_id: ByteTrack ID
            classified_team: 0 or 1 from team classifier

        Returns:
            jersey_number (1-15)
        """
        # Check if already assigned
        if tracker_id in self.tracker_to_jersey:
            return self.tracker_to_jersey[tracker_id]

        # Get actual team_id
        team_id = self.db.get_team_id_from_classification(classified_team)

        if team_id is None or team_id not in self.available_jerseys:
            return tracker_id  # Fallback for referee

        # Assign next available jersey
        if self.available_jerseys[team_id]:
            jersey_num = min(self.available_jerseys[team_id])
            self.available_jerseys[team_id].remove(jersey_num)

            # Store assignment
            self.tracker_to_jersey[tracker_id] = jersey_num

            # Register with database
            player_info = self.db.assign_tracker_to_jersey(
                tracker_id, jersey_num, classified_team
            )

            if player_info:
                print(f"✓ Assigned: Tracker {tracker_id} → #{jersey_num} ({player_info['name']})")

            return jersey_num
        else:
            # All jerseys taken
            return tracker_id

    def get_jersey(self, tracker_id: int) -> int:
        """Get jersey number for tracker"""
        return self.tracker_to_jersey.get(tracker_id, tracker_id)

    def get_player_name(self, tracker_id: int) -> str:
        """Get player name from database"""
        player_info = self.db.get_player_info(tracker_id)
        if player_info:
            return player_info['name']
        return f"Player {tracker_id}"

    def get_player_position(self, tracker_id: int) -> str:
        """Get player position from database"""
        player_info = self.db.get_player_info(tracker_id)
        if player_info:
            return player_info['position']
        return "Unknown"

    def get_assigned_jerseys(self) -> Dict[int, int]:
        """Get all assigned jersey mappings"""
        return self.tracker_to_jersey.copy()

    def reset_assignments(self):
        """Reset all jersey assignments (for new match)"""
        self.tracker_to_jersey.clear()
        self.available_jerseys = {
            self.db.team_a_id: set(range(1, 21)),  # Team A: 1-20
            self.db.team_b_id: set(range(21, 41))   # Team B: 21-40
        }
        print("✓ Jersey assignments reset")
