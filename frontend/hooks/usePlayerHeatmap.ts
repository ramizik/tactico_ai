/**
 * usePlayerHeatmap Hook
 * Fetches and processes player tracking data from Supabase for heatmap visualization
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { HeatmapData, MatchOption } from '../types/heatmap';

interface UsePlayerHeatmapOptions {
  playerId: string;
  matchId: string | null;
  trackerId?: number;
}

interface UsePlayerHeatmapReturn {
  data: HeatmapData | null;
  loading: boolean;
  error: string | null;
}

export function usePlayerHeatmap({ 
  playerId, 
  matchId, 
  trackerId 
}: UsePlayerHeatmapOptions): UsePlayerHeatmapReturn {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId || !trackerId) {
      setLoading(false);
      return;
    }

    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch match info
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('id, opponent, match_date')
          .eq('id', matchId)
          .single();

        if (matchError) throw matchError;
        if (!matchData) throw new Error('Match not found');

        // Fetch tracked positions for this player in this match
        const { data: positions, error: posError } = await supabase
          .from('tracked_positions')
          .select('x_transformed, y_transformed, has_ball, speed, frame_number')
          .eq('match_id', matchId)
          .eq('tracker_id', trackerId)
          .eq('object_type', 'player')
          .not('x_transformed', 'is', null)
          .not('y_transformed', 'is', null)
          .order('frame_number', { ascending: true });

        if (posError) throw posError;

        // Process positions into heatmap data
        const processedPositions = (positions || []).map((pos: any) => ({
          x: pos.x_transformed,
          y: pos.y_transformed,
          hasBall: pos.has_ball || false,
          speed: pos.speed || 0,
        }));

        const heatmapData: HeatmapData = {
          positions: processedPositions,
          matchId: matchId,
          matchInfo: {
            opponent: matchData.opponent,
            matchDate: matchData.match_date,
          },
        };

        setData(heatmapData);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch heatmap data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [playerId, matchId, trackerId]);

  return { data, loading, error };
}

/**
 * Hook to fetch available analyzed matches for a team
 */
export function useAnalyzedMatches(teamId: string | null) {
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('id, opponent, match_date, status')
          .eq('team_id', teamId)
          .eq('status', 'analyzed')
          .order('match_date', { ascending: false });

        if (matchError) throw matchError;

        setMatches((matchData || []) as MatchOption[]);
      } catch (err) {
        console.error('Error fetching analyzed matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [teamId]);

  return { matches, loading, error };
}

