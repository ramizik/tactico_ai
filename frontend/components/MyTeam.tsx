import { PlayerHeatmapModal } from './PlayerHeatmapModal';
import { useEffect, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { playersApi } from '../lib/api';
import type { Player as ApiPlayer } from '../types/api';
import { SoccerFieldHeatmap } from './SoccerFieldHeatmap';
import { SportSwitcher } from './SportSwitcher';
import { TeamLineup } from './TeamLineup';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const MyTeam = () => {
  const { theme, university } = useTheme();
  const { teamId } = useSession();
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [selectedPlayerForHeatmap, setSelectedPlayerForHeatmap] = useState<ApiPlayer | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: '',
    number: '',
    avatar: '',
  });

  // Load players from backend
  useEffect(() => {
    const loadPlayers = async () => {
      if (!teamId) return;

      try {
        setIsLoading(true);
        const teamPlayers = await playersApi.getTeamPlayers(teamId);
        setPlayers(teamPlayers);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, [teamId]);

  // Transform API Player to component-compatible format for visualization
  const adaptPlayerForVisualization = (apiPlayer: ApiPlayer) => ({
    id: parseInt(apiPlayer.id) || 0,
    name: apiPlayer.name,
    position: apiPlayer.position,
    number: apiPlayer.jersey_number,
    avatar: apiPlayer.avatar_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150',
    stats: {
      goals: apiPlayer.stats.goals,
      assists: apiPlayer.stats.assists,
      rating: apiPlayer.stats.rating
    }
  });

  // Adapted players for visualization components
  const visualizationPlayers = players.map(adaptPlayerForVisualization);

  const handleAddPlayer = async () => {
    if (!newPlayer.name || !newPlayer.position || !newPlayer.number || !teamId) {
      alert('Please fill in all required fields (Name, Number, and Position)');
      return;
    }

    // Validate number range
    const number = parseInt(newPlayer.number);
    if (isNaN(number) || number < 1 || number > 99) {
      alert('Jersey number must be between 1 and 99');
      return;
    }

    try {
      const createdPlayer = await playersApi.create(teamId, {
        name: newPlayer.name.trim(),
        position: newPlayer.position,
        number: number,
        avatar_url: newPlayer.avatar?.trim() || undefined
      });

      setPlayers([...players, createdPlayer]);
      setIsAddPlayerOpen(false);
      setNewPlayer({
        name: '',
        position: '',
        number: '',
        avatar: '',
      });
    } catch (error) {
      console.error('Failed to create player:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create player. Please try again.';
      alert(errorMessage);
    }
  };

  // Note: Remove player functionality is not currently implemented in the UI
  // const handleRemovePlayer = (playerId: number) => {
  //   setPlayers(players.filter(p => p.id !== playerId));
  // };

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  // Get university display name
  const getUniversityName = () => {
    if (university === 'UOP') return 'UOP';
    if (university === 'UC_CALIFORNIA') return 'UC California';
    return 'My Team';
  };

  return (
    <div className="min-h-screen px-6 md:px-12 pb-8" style={{ paddingTop: '60px' }}>
      <div className="max-w-7xl mx-auto">
        <h1
          className="mb-12 text-center"
          style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 400,
            color: '#ffffff',
            textShadow: '-0.5px 0 #c5d94a, 0.5px 0 #c5d94a, 0 -0.5px #c5d94a, 0 0.5px #c5d94a, -0.5px -0.5px #c5d94a, 0.5px -0.5px #c5d94a, -0.5px 0.5px #c5d94a, 0.5px 0.5px #c5d94a',
            letterSpacing: '0.05em',
          }}
        >
          {getUniversityName()}
        </h1>

        {/* Team of the Season Lineup */}
        {!isLoading && players.length > 0 && (
          <TeamLineup
            players={visualizationPlayers}
            onPlayerClick={(player) => {
              // Find the original player object
              const originalPlayer = players.find(p => String(p.id) === String(player.id));
              if (originalPlayer) {
                setSelectedPlayerForHeatmap(originalPlayer);
              }
            }}
            onAddPlayer={() => setIsAddPlayerOpen(true)}
          />
        )}

        {/* Add Player Dialog */}
        <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
          <DialogContent className="bg-white border-4 max-w-xl max-h-[85vh] overflow-y-auto" style={{ borderColor: theme.accent }}>
            <DialogHeader>
              <DialogTitle
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: theme.secondary
                }}
              >
                Add New Player
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Add a player to your team roster
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Name and Jersey Number Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Alex Johnson"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="h-10 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>

                {/* Jersey Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="number" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Number *
                  </Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="10"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    className="h-10 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <Label htmlFor="position" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Position *
                </Label>
                <Select
                  value={newPlayer.position}
                  onValueChange={(value: string) => setNewPlayer({ ...newPlayer, position: value })}
                >
                  <SelectTrigger
                    className="h-10 border-2"
                    style={{ borderColor: theme.accent }}
                  >
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <Label htmlFor="avatar" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#6b7280' }}>
                  Photo URL <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/photo.jpg"
                  value={newPlayer.avatar}
                  onChange={(e) => setNewPlayer({ ...newPlayer, avatar: e.target.value })}
                  className="h-10 border-2"
                  style={{ borderColor: theme.accent }}
                />
              </div>

              <div className="p-3 bg-blue-50 border-l-3 border-blue-500 rounded text-xs text-blue-700">
                <span style={{ fontWeight: 600 }}>ℹ️</span> Stats will be calculated from match analysis
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t-2" style={{ borderColor: '#e5e5e5' }}>
              <Button
                onClick={() => setIsAddPlayerOpen(false)}
                variant="outline"
                className="flex-1 h-11 border-2 transition-all hover:scale-105"
                style={{
                  borderColor: '#d1d5db',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayer}
                disabled={!newPlayer.name || !newPlayer.position || !newPlayer.number}
                className="flex-1 h-11 text-white border-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary,
                  fontWeight: 800,
                  fontSize: '0.875rem',
                }}
              >
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Soccer Field Heatmap Section */}
        {!isLoading && players.length > 0 && (
          <div className="mb-12">
            <SoccerFieldHeatmap
              players={visualizationPlayers.map(p => ({
                id: p.id,
                name: p.name,
                number: p.number
              }))}
            />
          </div>
        )}

        {/* Player Heatmap Modal */}
        {selectedPlayerForHeatmap && (
          <PlayerHeatmapModal
            isOpen={!!selectedPlayerForHeatmap}
            onClose={() => setSelectedPlayerForHeatmap(null)}
            player={selectedPlayerForHeatmap}
            teamId={teamId || ''}
          />
        )}
      </div>

      <SportSwitcher />
    </div>
  );
};
