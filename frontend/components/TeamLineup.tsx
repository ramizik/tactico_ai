/**
 * TeamLineup - FIFA-style Team of the Season pitch visualization
 * Displays 11 players in tactical formation on a football pitch
 *
 * BACKEND_HOOK:
 * - GET /api/teams/{teamId}/lineup for current formation and starting XI
 * - PUT /api/teams/{teamId}/formation to save formation changes
 */

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface Player {
    id: number;
    name: string;
    position: string;
    number: number;
    stats: { goals: number; assists: number; rating: number };
    avatar: string;
    club?: string;
}

type Formation = '4-3-3' | '4-4-2' | '3-4-3' | '4-2-3-1';

interface FormationPositions {
    [key: string]: { x: number; y: number }[];
}

const formations: FormationPositions = {
    '4-3-3': [
        // GK
        [{ x: 50, y: 92 }],
        // Defenders
        [{ x: 15, y: 75 }, { x: 37, y: 75 }, { x: 63, y: 75 }, { x: 85, y: 75 }],
        // Midfielders
        [{ x: 25, y: 50 }, { x: 50, y: 50 }, { x: 75, y: 50 }],
        // Forwards
        [{ x: 25, y: 20 }, { x: 50, y: 15 }, { x: 75, y: 20 }],
    ],
    '4-4-2': [
        // GK
        [{ x: 50, y: 92 }],
        // Defenders
        [{ x: 15, y: 75 }, { x: 37, y: 75 }, { x: 63, y: 75 }, { x: 85, y: 75 }],
        // Midfielders
        [{ x: 15, y: 50 }, { x: 37, y: 50 }, { x: 63, y: 50 }, { x: 85, y: 50 }],
        // Forwards
        [{ x: 35, y: 20 }, { x: 65, y: 20 }],
    ],
    '3-4-3': [
        // GK
        [{ x: 50, y: 92 }],
        // Defenders
        [{ x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 }],
        // Midfielders
        [{ x: 15, y: 50 }, { x: 37, y: 50 }, { x: 63, y: 50 }, { x: 85, y: 50 }],
        // Forwards
        [{ x: 25, y: 20 }, { x: 50, y: 15 }, { x: 75, y: 20 }],
    ],
    '4-2-3-1': [
        // GK
        [{ x: 50, y: 92 }],
        // Defenders
        [{ x: 15, y: 75 }, { x: 37, y: 75 }, { x: 63, y: 75 }, { x: 85, y: 75 }],
        // Defensive Midfielders
        [{ x: 35, y: 58 }, { x: 65, y: 58 }],
        // Attacking Midfielders
        [{ x: 25, y: 38 }, { x: 50, y: 38 }, { x: 75, y: 38 }],
        // Forward
        [{ x: 50, y: 15 }],
    ],
};

interface TeamLineupProps {
    players: Player[];
}

export const TeamLineup = ({ players }: TeamLineupProps) => {
    const { theme, university } = useTheme();
    const [formation, setFormation] = useState<Formation>('4-3-3');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [isFormationOpen, setIsFormationOpen] = useState(false);

    // Get top 11 players by rating
    const topPlayers = [...players]
        .sort((a, b) => b.stats.rating - a.stats.rating)
        .slice(0, 11);

    // Distribute players across formation positions
    const getPlayerPositions = () => {
        const positions = formations[formation].flat();
        return topPlayers.map((player, index) => ({
            player,
            position: positions[index] || { x: 50, y: 50 },
        }));
    };

    const playerPositions = getPlayerPositions();

    // Get university display name
    const getUniversityName = () => {
        if (university === 'UOP') return 'UOP';
        if (university === 'UC_CALIFORNIA') return 'UC California';
        return 'My Team';
    };

    return (
        <div className="mb-12">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6">
                <h2
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: theme.secondary,
                    }}
                >
                    Team of the Season
                </h2>

                {/* Formation Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsFormationOpen(!isFormationOpen)}
                        className="flex items-center gap-3 px-6 py-3 bg-white border-4 transition-all hover:scale-105"
                        style={{
                            borderColor: theme.accent,
                            fontWeight: 800,
                        }}
                    >
                        {/* Mini Formation Visualization */}
                        <div
                            className="relative flex-shrink-0"
                            style={{
                                width: '32px',
                                height: '48px',
                                backgroundColor: '#1a4d2e',
                                borderRadius: '2px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            {/* Formation dots */}
                            {formations[formation].flat().map((pos, i) => (
                                <div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                        width: '4px',
                                        height: '4px',
                                        backgroundColor: '#ffffff',
                                        left: `${pos.x * 0.32 - 2}px`,
                                        top: `${pos.y * 0.48 - 2}px`,
                                        boxShadow: '0 0 2px rgba(0, 0, 0, 0.5)',
                                    }}
                                />
                            ))}
                        </div>

                        <span style={{ fontSize: '1rem' }}>Formation: {formation}</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {isFormationOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 bg-white border-4 shadow-xl z-10"
                            style={{ borderColor: theme.accent, minWidth: '200px' }}
                        >
                            {(['4-3-3', '4-4-2', '3-4-3', '4-2-3-1'] as Formation[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setFormation(f);
                                        setIsFormationOpen(false);
                                    }}
                                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                                    style={{
                                        fontWeight: formation === f ? 800 : 600,
                                        backgroundColor: formation === f ? theme.accent + '20' : 'transparent',
                                    }}
                                >
                                    {/* Mini Formation Visualization */}
                                    <div
                                        className="relative flex-shrink-0"
                                        style={{
                                            width: '28px',
                                            height: '42px',
                                            backgroundColor: '#1a4d2e',
                                            borderRadius: '2px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                        }}
                                    >
                                        {formations[f].flat().map((pos, i) => (
                                            <div
                                                key={i}
                                                className="absolute rounded-full"
                                                style={{
                                                    width: '3px',
                                                    height: '3px',
                                                    backgroundColor: '#ffffff',
                                                    left: `${pos.x * 0.28 - 1.5}px`,
                                                    top: `${pos.y * 0.42 - 1.5}px`,
                                                    boxShadow: '0 0 1px rgba(0, 0, 0, 0.5)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span>{f}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Football Pitch Container */}
            <div
                className="relative w-full border-4 overflow-hidden"
                style={{
                    borderColor: theme.accent,
                    aspectRatio: '2/5',
                    maxHeight: '1100px',
                    backgroundColor: '#1a4d2e',
                    backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent)
          `,
                    backgroundSize: '40px 40px',
                }}
            >
                {/* Pitch Markings */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 150"
                    preserveAspectRatio="none"
                >
                    {/* Outer boundary */}
                    <rect
                        x="2"
                        y="2"
                        width="96"
                        height="146"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Center line */}
                    <line
                        x1="2"
                        y1="75"
                        x2="98"
                        y2="75"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Center circle */}
                    <circle
                        cx="50"
                        cy="75"
                        r="10"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Top penalty area */}
                    <rect
                        x="20"
                        y="2"
                        width="60"
                        height="18"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Top goal area */}
                    <rect
                        x="35"
                        y="2"
                        width="30"
                        height="8"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Bottom penalty area */}
                    <rect
                        x="20"
                        y="130"
                        width="60"
                        height="18"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />

                    {/* Bottom goal area */}
                    <rect
                        x="35"
                        y="140"
                        width="30"
                        height="8"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="0.3"
                    />
                </svg>

                {/* Player Cards */}
                {playerPositions.map(({ player, position }, index) => (
                    <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                        }}
                    >
                        {/* Card Container */}
                        <div
                            className="relative transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-2"
                            style={{
                                width: '85px',
                                filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
                            }}
                        >
                            {/* Main Card */}
                            <div
                                className="relative border-2 overflow-hidden"
                                style={{
                                    borderColor: theme.accent,
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                }}
                            >
                                {/* Rating Badge - Top Left */}
                                <div
                                    className="absolute top-1 left-1 px-1.5 py-0.5 z-10"
                                    style={{
                                        backgroundColor: theme.primary,
                                        borderRadius: '3px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                            color: '#ffffff',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {player.stats.rating}
                                    </div>
                                </div>

                                {/* Position Badge - Top Right */}
                                <div
                                    className="absolute top-1 right-1 px-1.5 py-0.5 z-10"
                                    style={{
                                        backgroundColor: theme.accent,
                                        borderRadius: '3px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.5rem',
                                            fontWeight: 800,
                                            color: '#ffffff',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {player.position.substring(0, 3).toUpperCase()}
                                    </div>
                                </div>

                                {/* Player Photo */}
                                <div
                                    className="w-full h-16 bg-gradient-to-b from-transparent to-black/20 mt-1"
                                    style={{
                                        backgroundImage: `url(${player.avatar})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center top',
                                    }}
                                />

                                {/* Player Info */}
                                <div
                                    className="px-1.5 py-1.5"
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
                                    }}
                                >
                                    {/* Player Name */}
                                    <div
                                        style={{
                                            fontSize: '0.625rem',
                                            fontWeight: 900,
                                            color: '#000000',
                                            lineHeight: 1.2,
                                            textAlign: 'center',
                                            marginBottom: '2px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {player.name}
                                    </div>

                                    {/* Club/Number */}
                                    <div
                                        style={{
                                            fontSize: '0.5rem',
                                            fontWeight: 700,
                                            color: '#666666',
                                            textAlign: 'center',
                                            marginBottom: '3px',
                                        }}
                                    >
                                        #{player.number}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex justify-around pt-1.5 border-t border-gray-300">
                                        <div className="text-center">
                                            <div
                                                style={{
                                                    fontSize: '0.625rem',
                                                    fontWeight: 900,
                                                    color: theme.primary,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {player.stats.goals}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.4rem',
                                                    fontWeight: 600,
                                                    color: '#666666',
                                                    marginTop: '1px',
                                                }}
                                            >
                                                G
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div
                                                style={{
                                                    fontSize: '0.625rem',
                                                    fontWeight: 900,
                                                    color: theme.accent,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {player.stats.assists}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.4rem',
                                                    fontWeight: 600,
                                                    color: '#666666',
                                                    marginTop: '1px',
                                                }}
                                            >
                                                A
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shine effect on hover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                                        borderRadius: '8px',
                                    }}
                                />
                            </div>

                            {/* Glow effect on hover */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"
                                style={{
                                    backgroundColor: theme.accent,
                                    zIndex: -1,
                                }}
                            />
                        </div>
                    </button>
                ))}
            </div>

            {/* Player Detail Modal */}
            <Dialog open={selectedPlayer !== null} onOpenChange={() => setSelectedPlayer(null)}>
                <DialogContent
                    className="bg-white border-4 max-w-md"
                    style={{ borderColor: theme.accent }}
                >
                    {selectedPlayer && (
                        <>
                            <DialogHeader>
                                <DialogTitle
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        color: theme.secondary,
                                    }}
                                >
                                    Player Details
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    View detailed statistics and information for this player
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Player Photo */}
                                <div
                                    className="w-32 h-32 mx-auto rounded-full border-4"
                                    style={{
                                        borderColor: theme.accent,
                                        backgroundImage: `url(${selectedPlayer.avatar})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />

                                {/* Player Info */}
                                <div className="text-center">
                                    <div
                                        style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 900,
                                            color: theme.primary,
                                        }}
                                    >
                                        {selectedPlayer.name}
                                    </div>
                                    <div
                                        className="mt-2"
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: '#666666',
                                        }}
                                    >
                                        {selectedPlayer.position} • #{selectedPlayer.number}
                                    </div>
                                    <div
                                        className="mt-1"
                                        style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: '#999999',
                                        }}
                                    >
                                        {selectedPlayer.club || getUniversityName()}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div
                                        className="text-center p-4 border-2"
                                        style={{ borderColor: theme.accent }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '2rem',
                                                fontWeight: 900,
                                                color: theme.primary,
                                            }}
                                        >
                                            {selectedPlayer.stats.rating}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#666666',
                                                marginTop: '4px',
                                            }}
                                        >
                                            RATING
                                        </div>
                                    </div>
                                    <div
                                        className="text-center p-4 border-2"
                                        style={{ borderColor: theme.accent }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '2rem',
                                                fontWeight: 900,
                                                color: theme.accent,
                                            }}
                                        >
                                            {selectedPlayer.stats.goals}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#666666',
                                                marginTop: '4px',
                                            }}
                                        >
                                            GOALS
                                        </div>
                                    </div>
                                    <div
                                        className="text-center p-4 border-2"
                                        style={{ borderColor: theme.accent }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '2rem',
                                                fontWeight: 900,
                                                color: theme.secondary,
                                            }}
                                        >
                                            {selectedPlayer.stats.assists}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#666666',
                                                marginTop: '4px',
                                            }}
                                        >
                                            ASSISTS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
