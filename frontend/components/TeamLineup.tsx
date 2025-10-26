/**
 * TeamLineup - FIFA-style Team of the Season pitch visualization
 * Displays 11 players in tactical formation on a football pitch
 *
 * BACKEND_HOOK:
 * - GET /api/teams/{teamId}/lineup for current formation and starting XI
 * - PUT /api/teams/{teamId}/formation to save formation changes
 */

import { ChevronDown, UserPlus, TrendingUp } from 'lucide-react';
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

interface TeamLineupProps {
    players: Player[];
    onPlayerClick?: (player: Player) => void;
    onAddPlayer?: () => void;
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
    onPlayerClick?: (player: Player) => void;
}

export const TeamLineup = ({ players, onPlayerClick, onAddPlayer }: TeamLineupProps) => {
    const { theme, university } = useTheme();
    const [formation, setFormation] = useState<Formation>('4-3-3');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [isFormationOpen, setIsFormationOpen] = useState(false);
    const [draggedPlayer, setDraggedPlayer] = useState<{ player: Player; position: { x: number; y: number } } | null>(null);
    const [customPositions, setCustomPositions] = useState<Map<number, { x: number; y: number }>>(new Map());

    // Get top 11 players by rating, then organize by position
    const topPlayersUnsorted = [...players]
        .sort((a, b) => b.stats.rating - a.stats.rating)
        .slice(0, 11);
    
    // Organize by position: Goalkeeper -> Defenders -> Midfielders -> Forwards
    const getPositionPriority = (pos: string) => {
        const posLower = pos.toLowerCase();
        if (posLower.includes('goalkeeper') || posLower.includes('keeper')) return 0;
        if (posLower.includes('defender')) return 1;
        if (posLower.includes('midfielder') || posLower.includes('midfield')) return 2;
        if (posLower.includes('forward') || posLower.includes('striker') || posLower.includes('winger')) return 3;
        return 4;
    };
    
    const topPlayers = [...topPlayersUnsorted]
        .sort((a, b) => {
            const posA = getPositionPriority(a.position);
            const posB = getPositionPriority(b.position);
            if (posA !== posB) return posA - posB;
            // If same position, sort by rating
            return b.stats.rating - a.stats.rating;
        });

    // Handle custom position for a player
    const handlePlayerDrag = (player: { player: Player; position: { x: number; y: number } }, newX: number, newY: number) => {
        const newPositions = new Map(customPositions);
        newPositions.set(player.player.id, { x: newX, y: newY });
        setCustomPositions(newPositions);
    };

    // Distribute players across formation positions
    const getPlayerPositions = () => {
        const positions = formations[formation].flat();
        return topPlayers.map((player, index) => {
            // Check if player has custom position
            const customPos = customPositions.get(player.id);
            const defaultPos = positions[index] || { x: 50, y: 50 };
            
            return {
                player,
                position: customPos || defaultPos,
            };
        });
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
                    Team Sheet
                </h2>

                <div className="flex items-center gap-3">
                    {/* Add Player Button */}
                    <button
                        onClick={() => {
                            if (onAddPlayer) {
                                onAddPlayer();
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-2 bg-white border-4 transition-all hover:scale-105"
                        style={{
                            borderColor: theme.accent,
                            fontWeight: 800,
                            fontSize: '0.9375rem',
                        }}
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Player
                    </button>
                </div>
            </div>

            {/* Grid Layout: Formation on left, Player list on right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Football Pitch Formation */}
                <div
                    className="relative border-4 overflow-hidden"
                    style={{
                        borderColor: theme.accent,
                        aspectRatio: '3/4',
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
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setDraggedPlayer({ player, position });
                        }}
                        onMouseMove={(e) => {
                            if (draggedPlayer && draggedPlayer.player.id === player.id) {
                                e.preventDefault();
                                const rect = e.currentTarget.closest('div[className*="grid"]')?.getBoundingClientRect();
                                if (rect) {
                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                    handlePlayerDrag(draggedPlayer, Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
                                }
                            }
                        }}
                        onMouseUp={() => {
                            if (draggedPlayer) {
                                setDraggedPlayer(null);
                            }
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-move transition-all"
                        style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            zIndex: draggedPlayer?.player.id === player.id ? 50 : 10,
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

                {/* Right Side: Player List */}
                <div className="space-y-4">
                    <div
                        className="bg-white border-4 p-4"
                        style={{ borderColor: theme.accent }}
                    >
                        {/* Formation Selector in Team Roster */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 
                                style={{ 
                                    fontSize: '1.25rem', 
                                    fontWeight: 800, 
                                    color: theme.secondary 
                                }}
                            >
                                Team Roster
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setIsFormationOpen(!isFormationOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 transition-all hover:scale-105"
                                    style={{
                                        borderColor: theme.accent,
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <span>{formation}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {isFormationOpen && (
                                    <div
                                        className="absolute right-0 top-full mt-2 bg-white border-4 shadow-xl z-10"
                                        style={{ borderColor: theme.accent, minWidth: '180px' }}
                                    >
                                        {(['4-3-3', '4-4-2', '3-4-3', '4-2-3-1'] as Formation[]).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => {
                                                    setFormation(f);
                                                    setIsFormationOpen(false);
                                                }}
                                                className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors text-sm"
                                                style={{
                                                    fontWeight: formation === f ? 800 : 600,
                                                    backgroundColor: formation === f ? theme.accent + '20' : 'transparent',
                                                }}
                                            >
                                                <span>{f}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {topPlayers.map((player, index) => (
                                <div
                                    key={player.id}
                                    className="w-full flex items-center gap-3 p-3 border-2 transition-all hover:scale-105 hover:shadow-md"
                                    style={{ 
                                        borderColor: '#e5e5e5',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <button
                                        onClick={() => setSelectedPlayer(player)}
                                        className="flex-1 flex items-center gap-3"
                                    >
                                    {/* Rank Badge */}
                                    <div
                                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                                        style={{
                                            backgroundColor: index < 3 ? theme.accent : theme.primary,
                                            color: 'white',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Player Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"
                                        style={{
                                            backgroundImage: `url(${player.avatar})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />

                                    {/* Player Info */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div 
                                            style={{ 
                                                fontWeight: 800, 
                                                fontSize: '0.9375rem',
                                                color: '#000',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {player.name}
                                        </div>
                                        <div 
                                            style={{ 
                                                fontSize: '0.75rem', 
                                                color: '#666',
                                            }}
                                        >
                                            {player.position} • #{player.number}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex-shrink-0 flex gap-3">
                                        <div className="text-center">
                                            <div 
                                                style={{ 
                                                    fontWeight: 800, 
                                                    color: theme.primary,
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {player.stats.rating}
                                            </div>
                                            <div 
                                                style={{ 
                                                    fontSize: '0.625rem', 
                                                    color: '#999' 
                                                }}
                                            >
                                                Rating
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div 
                                                style={{ 
                                                    fontWeight: 800, 
                                                    color: theme.accent,
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {player.stats.goals}
                                            </div>
                                            <div 
                                                style={{ 
                                                    fontSize: '0.625rem', 
                                                    color: '#999' 
                                                }}
                                            >
                                                Goals
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div 
                                                style={{ 
                                                    fontWeight: 800, 
                                                    color: '#FF6B35',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {player.stats.assists}
                                            </div>
                                            <div 
                                                style={{ 
                                                    fontSize: '0.625rem', 
                                                    color: '#999' 
                                                }}
                                            >
                                                Assists
                                            </div>
                                        </div>
                                    </div>
                                    </button>
                                    
                                    {/* Checkbox for multi-select */}
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 cursor-pointer"
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            // Handle multi-select logic here
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
