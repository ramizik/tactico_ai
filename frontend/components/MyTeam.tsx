import { Award, TrendingUp, UserPlus } from 'lucide-react';
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
      return; // Basic validation
    }

    try {
      const createdPlayer = await playersApi.create(teamId, {
        name: newPlayer.name,
        position: newPlayer.position,
        number: parseInt(newPlayer.number) || 0,
        avatar_url: newPlayer.avatar || undefined
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
      alert('Failed to create player. Please try again.');
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

        {/* Team Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div
            className="bg-white border-4 p-6"
            style={{ borderColor: theme.accent }}
          >
            <div className="flex items-center gap-4">
              <Award className="w-12 h-12" style={{ color: theme.primary }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: theme.primary }}>
                  1st
                </div>
                <div className="text-gray-600">League Position</div>
              </div>
            </div>
          </div>

          <div
            className="bg-white border-4 p-6"
            style={{ borderColor: theme.accent }}
          >
            <div className="flex items-center gap-4">
              <TrendingUp className="w-12 h-12" style={{ color: theme.accent }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: theme.primary }}>
                  8.3
                </div>
                <div className="text-gray-600">Avg Team Rating</div>
              </div>
            </div>
          </div>

          <div
            className="bg-white border-4 p-6"
            style={{ borderColor: theme.accent }}
          >
            <div className="flex items-center gap-4">
              <UserPlus className="w-12 h-12" style={{ color: theme.secondary }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: theme.primary }}>
                  {players.length}
                </div>
                <div className="text-gray-600">Active Players</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team of the Season Lineup */}
        {!isLoading && players.length > 0 && (
          <TeamLineup players={visualizationPlayers} />
        )}

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: theme.secondary,
            }}
          >
            Players
          </h2>
          <button
            onClick={() => setIsAddPlayerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border-4 transition-all hover:scale-105"
            style={{
              borderColor: theme.accent,
              fontWeight: 800,
            }}
          >
            <UserPlus className="w-5 h-5" />
            Add Player
          </button>
        </div>

        {/* Players Grid - 2 Column Layout */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center text-white py-12">
              <div className="text-xl">Loading players...</div>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center text-white py-12">
              <div className="text-xl mb-4">No players yet</div>
              <div className="text-gray-300">Add your first player to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-white border-4 p-5 flex flex-col"
                  style={{ borderColor: theme.accent }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0"
                      style={{
                        backgroundImage: `url(${player.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="flex-1">
                      <div style={{ fontWeight: 900, fontSize: '1.125rem', lineHeight: '1.3' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
                        {player.position}
                      </div>
                      <div
                        className="inline-block px-3 py-1 mt-2 text-white"
                        style={{
                          backgroundColor: theme.primary,
                          fontWeight: 800,
                          fontSize: '0.875rem',
                        }}
                      >
                        #{player.jersey_number}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between" style={{ fontSize: '0.9375rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Goals</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{player.stats.goals}</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '0.9375rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Assists</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{player.stats.assists}</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '0.9375rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Rating</span>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: '1.125rem',
                          color: theme.primary,
                        }}
                      >
                        {player.stats.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Player Dialog */}
        <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
          <DialogContent className="bg-white border-4 max-w-2xl" style={{ borderColor: theme.accent }}>
            <DialogHeader>
              <DialogTitle
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: theme.secondary
                }}
              >
                Add New Player
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Fill in the player details below to add them to your roster.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Avatar URL */}
              <div>
                <Label htmlFor="avatar" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Player Photo URL
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="avatar"
                    placeholder="https://example.com/photo.jpg"
                    value={newPlayer.avatar}
                    onChange={(e) => setNewPlayer({ ...newPlayer, avatar: e.target.value })}
                    className="flex-1 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  Paste an image URL or leave blank for default avatar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Player Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Alex Johnson"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="mt-2 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>

                {/* Jersey Number */}
                <div>
                  <Label htmlFor="number" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Jersey Number *
                  </Label>
                  <Input
                    id="number"
                    type="number"
                    placeholder="10"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    className="mt-2 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="position" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Position *
                </Label>
                <Select
                  value={newPlayer.position}
                  onValueChange={(value: string) => setNewPlayer({ ...newPlayer, position: value })}
                >
                  <SelectTrigger
                    className="mt-2 border-2"
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

              <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
                <p className="text-sm text-blue-800">
                  Player stats (goals, assists, rating) will be automatically calculated from match analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setIsAddPlayerOpen(false)}
                variant="outline"
                className="flex-1 py-6 border-4 transition-all hover:scale-105"
                style={{
                  borderColor: theme.accent,
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayer}
                disabled={!newPlayer.name || !newPlayer.position || !newPlayer.number}
                className="flex-1 py-6 text-white border-4 transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary,
                  fontWeight: 800,
                  fontSize: '1rem',
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
      </div>

      <SportSwitcher />
    </div>
  );
};
