#!/usr/bin/env python3
"""
LocalDataExporter - Export tracking data to local files for analysis
"""

import csv
import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

class LocalDataExporter:
    """Export tracking data to local files for analysis"""

    def __init__(self, output_dir: str = "tracking_data",
                 custom_csv_path: str = None,
                 custom_stats_path: str = None,
                 custom_summary_path: str = None):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # Generate timestamp for this run
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # File paths - use custom paths if provided, otherwise generate default ones
        if custom_csv_path:
            self.positions_csv = Path(custom_csv_path)
        else:
            self.positions_csv = self.output_dir / f"positions_{self.timestamp}.csv"

        if custom_summary_path:
            self.summary_json = Path(custom_summary_path)
        else:
            self.summary_json = self.output_dir / f"summary_{self.timestamp}.json"

        if custom_stats_path:
            self.stats_txt = Path(custom_stats_path)
        else:
            self.stats_txt = self.output_dir / f"stats_{self.timestamp}.txt"

        # Data buffers
        self.position_buffer = []
        self.player_stats = {}  # tracker_id -> stats

        print(f"✓ Local data export initialized: {self.output_dir}")

    def add_position(self, frame_idx: int, timestamp: float, tracker_id: int,
                    jersey_num: int, team_id: int, player_name: str,
                    video_x: float, video_y: float,
                    pitch_x: float, pitch_y: float,
                    board_x: float, board_y: float,
                    confidence: float):
        """Add position data point"""

        self.position_buffer.append({
            'frame': frame_idx,
            'timestamp': timestamp,
            'tracker_id': tracker_id,
            'jersey': jersey_num,
            'team_id': team_id,
            'player_name': player_name,
            'video_x': video_x,
            'video_y': video_y,
            'pitch_x': pitch_x,
            'pitch_y': pitch_y,
            'board_x': board_x,
            'board_y': board_y,
            'confidence': confidence
        })

        # Update stats
        if tracker_id not in self.player_stats:
            self.player_stats[tracker_id] = {
                'jersey': jersey_num,
                'name': player_name,
                'team_id': team_id,
                'total_frames': 0,
                'avg_x': 0,
                'avg_y': 0,
                'positions': []
            }

        stats = self.player_stats[tracker_id]
        stats['total_frames'] += 1
        stats['positions'].append((pitch_x, pitch_y))

    def add_ball_position(self, frame_idx: int, timestamp: float,
                         video_x: float, video_y: float,
                         pitch_x: float, pitch_y: float,
                         board_x: float, board_y: float,
                         confidence: float):
        """Add ball position data point"""

        self.position_buffer.append({
            'frame': frame_idx,
            'timestamp': timestamp,
            'tracker_id': -1,  # Special ID for ball
            'jersey': 'BALL',  # Special jersey for ball
            'team_id': None,   # Ball has no team
            'player_name': 'Ball',
            'video_x': video_x,
            'video_y': video_y,
            'pitch_x': pitch_x,
            'pitch_y': pitch_y,
            'board_x': board_x,
            'board_y': board_y,
            'confidence': confidence
        })

    def write_csv(self):
        """Write positions to CSV file"""
        if not self.position_buffer:
            return

        with open(self.positions_csv, 'w', newline='') as f:
            fieldnames = ['frame', 'timestamp', 'tracker_id', 'jersey', 'team_id',
                         'player_name', 'video_x', 'video_y', 'pitch_x', 'pitch_y',
                         'board_x', 'board_y', 'confidence']

            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.position_buffer)

        print(f"✓ Exported {len(self.position_buffer)} positions to CSV: {self.positions_csv}")

    def write_summary(self):
        """Write summary statistics to JSON"""

        # Calculate stats
        summary = {
            'timestamp': self.timestamp,
            'total_positions': len(self.position_buffer),
            'total_frames': max([p['frame'] for p in self.position_buffer]) if self.position_buffer else 0,
            'players': {}
        }

        for tracker_id, stats in self.player_stats.items():
            positions = np.array(stats['positions'])

            player_summary = {
                'jersey': int(stats['jersey']),
                'name': str(stats['name']),
                'team_id': str(stats['team_id']),
                'frames_tracked': int(stats['total_frames']),
                'avg_position': {
                    'x': float(np.mean(positions[:, 0])),
                    'y': float(np.mean(positions[:, 1]))
                },
                'position_variance': {
                    'x': float(np.var(positions[:, 0])),
                    'y': float(np.var(positions[:, 1]))
                }
            }

            summary['players'][str(tracker_id)] = player_summary

        with open(self.summary_json, 'w') as f:
            json.dump(summary, f, indent=2)

        print(f"✓ Exported summary to JSON: {self.summary_json}")

    def write_stats_report(self):
        """Write human-readable stats report"""

        with open(self.stats_txt, 'w') as f:
            f.write("="*60 + "\n")
            f.write("TRACKING DATA ANALYSIS REPORT\n")
            f.write("="*60 + "\n\n")

            f.write(f"Generated: {self.timestamp}\n")
            f.write(f"Total Positions Tracked: {len(self.position_buffer)}\n")
            f.write(f"Total Players: {len(self.player_stats)}\n\n")

            f.write("-"*60 + "\n")
            f.write("PLAYER STATISTICS\n")
            f.write("-"*60 + "\n\n")

            for tracker_id, stats in sorted(self.player_stats.items(),
                                           key=lambda x: x[1]['jersey']):
                positions = np.array(stats['positions'])

                f.write(f"Player: {stats['name']} (Jersey #{stats['jersey']})\n")
                f.write(f"  Team ID: {stats['team_id']}\n")
                f.write(f"  Frames Tracked: {stats['total_frames']}\n")
                f.write(f"  Average Position: ({np.mean(positions[:, 0]):.2f}, "
                       f"{np.mean(positions[:, 1]):.2f})\n")
                f.write(f"  Position Range: X=[{np.min(positions[:, 0]):.2f}, "
                       f"{np.max(positions[:, 0]):.2f}], "
                       f"Y=[{np.min(positions[:, 1]):.2f}, {np.max(positions[:, 1]):.2f}]\n")
                f.write("\n")

        print(f"✓ Exported stats report: {self.stats_txt}")

    def export_all(self):
        """Export all data files"""
        self.write_csv()
        self.write_summary()
        self.write_stats_report()
