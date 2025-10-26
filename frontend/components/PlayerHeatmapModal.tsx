/**
 * PlayerHeatmapModal Component
 * Modal dialog for displaying player heatmap with match selection
 */

import React, { useState, useEffect } from 'react';
import { X, Target, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlayerHeatmap } from './PlayerHeatmap';
import { usePlayerHeatmap, useAnalyzedMatches } from '../hooks/usePlayerHeatmap';
import type { Player } from '../types/api';
import type { HeatmapData } from '../types/heatmap';

interface PlayerHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  teamId: string;
  isMultiSelect?: boolean;
  selectedPlayers?: Player[];
}

export const PlayerHeatmapModal: React.FC<PlayerHeatmapModalProps> = ({
  isOpen,
  onClose,
  player,
  teamId,
  isMultiSelect = false,
  selectedPlayers = [],
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  // Fetch analyzed matches for the team
  const { matches, loading: matchesLoading } = useAnalyzedMatches(teamId);

  // Set default match when matches load - prioritize most recent match
  useEffect(() => {
    if (matches.length > 0 && !selectedMatchId) {
      // Sort by date and select most recent match
      const sortedMatches = [...matches].sort((a, b) => 
        new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      );
      setSelectedMatchId(sortedMatches[0].id);
    }
  }, [matches, selectedMatchId]);

  // Get tracker ID from player stats or use jersey number as fallback
  // Note: In a real implementation, you'd need to map tracker_id from match analysis
  // For now, we'll use a heuristic based on jersey number
  const trackerId = Math.floor(Math.random() * 50) + 1; // Placeholder - needs proper mapping

  // Fetch heatmap data for selected match
  const { data: heatmapData, loading: dataLoading, error } = usePlayerHeatmap({
    playerId: player.id,
    matchId: selectedMatchId,
    trackerId,
  });

  const isLoading = matchesLoading || dataLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-4 max-w-4xl max-h-[85vh] overflow-y-auto p-6" style={{ borderColor: '#22c55e' }}>
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#22c55e20' }}
              >
                <Activity className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{ color: '#1295D8' }}>
                  {isMultiSelect && selectedPlayers.length > 1 ? 'Team Activity Heatmap' : 'Player Activity Heatmap'}
                </DialogTitle>
                <div className="text-sm text-gray-600 mt-1">
                  {isMultiSelect && selectedPlayers.length > 1 
                    ? `${selectedPlayers.length} players selected`
                    : `${player.name} • ${player.position} #${player.jersey_number}`
                  }
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close heatmap"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Selector - Compact */}
          {matches.length > 0 ? (
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-gray-500" />
              <Select value={selectedMatchId || ''} onValueChange={setSelectedMatchId} >
                <SelectTrigger
                  id="match-select"
                  className="border-2 h-10"
                  style={{ borderColor: '#22c55e' }}
                >
                  <SelectValue placeholder="Select a match">
                    {matches.find((m) => m.id === selectedMatchId)?.opponent || 'Select match'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {matches.map((match) => (
                    <SelectItem key={match.id} value={match.id}>
                      {new Date(match.match_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{match.result ? ' - ' + match.result : ''} vs {match.opponent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-sm">
              No analyzed matches available
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
                <p className="mt-3 text-sm text-gray-600">Loading activity data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm">
              <p className="font-bold">Error loading heatmap</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Heatmap Visualization */}
          {!isLoading && !error && heatmapData && heatmapData.positions.length > 0 && (
            <div className="space-y-3">
              {/* Compact Match Info */}
              <div className="bg-gradient-to-r from-blue-100 via-purple-50 to-pink-50 p-3 rounded-lg border-2 shadow-sm" style={{ borderColor: theme.accent }}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded" style={{ backgroundColor: theme.primary + '20' }}>
                      <Target className="w-4 h-4" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <span className="font-bold" style={{ color: theme.primary }}>vs {heatmapData.matchInfo.opponent}</span>
                      <span className="text-gray-500 ml-2">
                        {new Date(heatmapData.matchInfo.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: theme.accent + '30', color: theme.accent }}>
                    {heatmapData.positions.length} points
                  </span>
                </div>
              </div>
              
              {/* Compact Heatmap - Small and Cute */}
              <div className="flex justify-center">
                <PlayerHeatmap data={heatmapData} width={500} height={330} />
              </div>
              
              {/* Compact Legend */}
              <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-yellow-50 p-3 rounded border-2" style={{ borderColor: theme.accent }}>
                <div className="flex items-center justify-around gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(to right, rgb(13,110,253), rgb(0,221,255), rgb(255,215,0), rgb(255,69,58))' }}></div>
                    <span className="text-gray-700 font-semibold">Low → High Intensity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#1DA1F2' }}></div>
                    <span className="text-gray-700 font-semibold">Movement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#FF6B35' }}></div>
                    <span className="text-gray-700 font-semibold">With ball</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!isLoading && !error && heatmapData && heatmapData.positions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold mb-1">No tracking data available</p>
              <p className="text-sm">This player wasn't tracked in the selected match</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

