import { Award, TrendingUp, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SportSwitcher } from './SportSwitcher';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Player {
  id: number;
  name: string;
  position: string;
  number: number;
  stats: { goals: number; assists: number; rating: number };
  avatar: string;
}

const initialPlayers: Player[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    position: 'Forward',
    number: 10,
    stats: { goals: 12, assists: 8, rating: 8.5 },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    position: 'Midfielder',
    number: 7,
    stats: { goals: 5, assists: 15, rating: 8.2 },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    id: 3,
    name: 'James Smith',
    position: 'Defender',
    number: 4,
    stats: { goals: 2, assists: 3, rating: 7.8 },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 4,
    name: 'Emma Davis',
    position: 'Goalkeeper',
    number: 1,
    stats: { goals: 0, assists: 0, rating: 8.7 },
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  },
  {
    id: 5,
    name: 'Michael Chen',
    position: 'Forward',
    number: 9,
    stats: { goals: 18, assists: 6, rating: 9.1 },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  {
    id: 6,
    name: 'Sarah Wilson',
    position: 'Midfielder',
    number: 8,
    stats: { goals: 7, assists: 11, rating: 8.0 },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
];

export const MyTeam = () => {
  const { theme, university } = useTheme();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: '',
    number: '',
    goals: '',
    assists: '',
    rating: '',
    avatar: '',
  });

  /**
   * BACKEND_HOOK (Add Player):
   * - POST /api/teams/{teamId}/players with player data
   * - Upload avatar to Supabase Storage if file is provided
   * - Return created player with ID
   */
  const handleAddPlayer = () => {
    if (!newPlayer.name || !newPlayer.position || !newPlayer.number) {
      return; // Basic validation
    }

    const player: Player = {
      id: Math.max(...players.map(p => p.id), 0) + 1,
      name: newPlayer.name,
      position: newPlayer.position,
      number: parseInt(newPlayer.number) || 0,
      stats: {
        goals: parseInt(newPlayer.goals) || 0,
        assists: parseInt(newPlayer.assists) || 0,
        rating: parseFloat(newPlayer.rating) || 0,
      },
      avatar: newPlayer.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150',
    };

    setPlayers([...players, player]);
    setIsAddPlayerOpen(false);
    setNewPlayer({
      name: '',
      position: '',
      number: '',
      goals: '',
      assists: '',
      rating: '',
      avatar: '',
    });
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
                      backgroundImage: `url(${player.avatar})`,
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
                      #{player.number}
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

              <div className="grid grid-cols-3 gap-4">
                {/* Goals */}
                <div>
                  <Label htmlFor="goals" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Goals
                  </Label>
                  <Input
                    id="goals"
                    type="number"
                    placeholder="0"
                    value={newPlayer.goals}
                    onChange={(e) => setNewPlayer({ ...newPlayer, goals: e.target.value })}
                    className="mt-2 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>

                {/* Assists */}
                <div>
                  <Label htmlFor="assists" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Assists
                  </Label>
                  <Input
                    id="assists"
                    type="number"
                    placeholder="0"
                    value={newPlayer.assists}
                    onChange={(e) => setNewPlayer({ ...newPlayer, assists: e.target.value })}
                    className="mt-2 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label htmlFor="rating" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Rating
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    placeholder="8.0"
                    value={newPlayer.rating}
                    onChange={(e) => setNewPlayer({ ...newPlayer, rating: e.target.value })}
                    className="mt-2 border-2"
                    style={{ borderColor: theme.accent }}
                  />
                </div>
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
      </div>

      <SportSwitcher />
    </div>
  );
};
