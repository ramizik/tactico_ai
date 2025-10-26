/**
 * Heatmap Data Types
 * TypeScript interfaces for tracking position data and heatmap visualization
 */

export interface TrackedPosition {
  id: string;
  match_id: string;
  frame_number: number;
  timestamp: number;
  tracked_objects: any[];
  ball_position: any;
  created_at: string;
  analysis_scope: string;
  speed: number;
  distance: number;
  has_ball: boolean;
  object_type: string;
  tracker_id: number;
  team_id: number;
  x: number;
  y: number;
  x_transformed: number | null;
  y_transformed: number | null;
}

export interface HeatmapData {
  positions: {
    x: number;
    y: number;
    hasBall?: boolean;
    speed?: number;
  }[];
  matchId: string;
  matchInfo: {
    opponent: string;
    matchDate: string;
  };
}

export interface MatchOption {
  id: string;
  opponent: string;
  match_date: string;
  status: string;
  result?: string;
}

export interface PlayerPosition {
  x: number;
  y: number;
  hasBall: boolean;
  speed: number;
}

