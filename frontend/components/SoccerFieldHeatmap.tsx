/**
 * SoccerFieldHeatmap Component
 * Displays a soccer field with a heatmap overlay showing player activity zones
 *
 * BACKEND_HOOK:
 * - GET /api/matches/:matchId/heatmap/:playerId for player heatmap data
 * - Data should include array of coordinate points with intensity values
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface HeatmapPoint {
    x: number; // 0-100 (percentage of field width)
    y: number; // 0-100 (percentage of field height)
    intensity: number; // 0-1
}

interface Player {
    id: number;
    name: string;
    number: number;
}

interface Match {
    id: number;
    opponent: string;
    date: string;
    result: string;
}

interface SoccerFieldHeatmapProps {
    players: Player[];
}

// Mock match data
const mockMatches: Match[] = [
    { id: 1, opponent: 'Stanford', date: '2024-10-20', result: 'W 3-1' },
    { id: 2, opponent: 'UCLA', date: '2024-10-15', result: 'L 1-2' },
    { id: 3, opponent: 'USC', date: '2024-10-10', result: 'W 2-0' },
    { id: 4, opponent: 'Berkeley', date: '2024-10-05', result: 'D 2-2' },
    { id: 5, opponent: 'Oregon', date: '2024-09-28', result: 'W 4-1' },
];

// Generate mock heatmap data based on player position
const generateMockHeatmap = (playerId: number, matchId: number): HeatmapPoint[] => {
    const points: HeatmapPoint[] = [];
    const seed = playerId * 100 + matchId;

    // Simple random generator with seed
    const random = (min: number, max: number, offset: number = 0) => {
        const x = Math.sin(seed + offset) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
    };

    // Generate different patterns based on player ID (simulating different positions)
    const playerType = playerId % 4;

    if (playerType === 0) {
        // Goalkeeper - mostly in defensive third
        for (let i = 0; i < 80; i++) {
            points.push({
                x: random(0, 30, i),
                y: random(20, 80, i * 2),
                intensity: random(0.3, 1, i * 3),
            });
        }
    } else if (playerType === 1) {
        // Defender - defensive and middle third
        for (let i = 0; i < 120; i++) {
            points.push({
                x: random(10, 50, i),
                y: random(10, 90, i * 2),
                intensity: random(0.4, 1, i * 3),
            });
        }
    } else if (playerType === 2) {
        // Midfielder - all over the field
        for (let i = 0; i < 150; i++) {
            points.push({
                x: random(20, 80, i),
                y: random(5, 95, i * 2),
                intensity: random(0.3, 1, i * 3),
            });
        }
    } else {
        // Forward - attacking third
        for (let i = 0; i < 100; i++) {
            points.push({
                x: random(60, 100, i),
                y: random(15, 85, i * 2),
                intensity: random(0.4, 1, i * 3),
            });
        }
    }

    return points;
};

export const SoccerFieldHeatmap = ({ players }: SoccerFieldHeatmapProps) => {
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);

    // Generate heatmap data when both player and match are selected
    useEffect(() => {
        if (selectedPlayer && selectedMatch) {
            const playerId = parseInt(selectedPlayer);
            const matchId = parseInt(selectedMatch);
            const data = generateMockHeatmap(playerId, matchId);
            setHeatmapData(data);
        } else {
            setHeatmapData([]);
        }
    }, [selectedPlayer, selectedMatch]);

    // Draw heatmap on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (heatmapData.length === 0) return;

        // Draw heatmap points
        heatmapData.forEach((point) => {
            const x = (point.x / 100) * width;
            const y = (point.y / 100) * height;
            const radius = 40 * point.intensity;

            // Create gradient
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

            // Green to yellow to red gradient based on intensity
            if (point.intensity < 0.33) {
                gradient.addColorStop(0, `rgba(34, 197, 94, ${point.intensity * 0.6})`); // Green
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
            } else if (point.intensity < 0.66) {
                gradient.addColorStop(0, `rgba(234, 179, 8, ${point.intensity * 0.7})`); // Yellow
                gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
            } else {
                gradient.addColorStop(0, `rgba(239, 68, 68, ${point.intensity * 0.8})`); // Red
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        });
    }, [heatmapData]);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h2
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: theme.secondary,
                        marginBottom: '0.5rem',
                    }}
                >
                    Player Activity Heatmap
                </h2>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Selector */}
                <div>
                    <Label htmlFor="player-select" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                        Select Player
                    </Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                        <SelectTrigger
                            id="player-select"
                            className="border-4"
                            style={{ borderColor: theme.accent }}
                        >
                            <SelectValue placeholder="Choose a player..." />
                        </SelectTrigger>
                        <SelectContent>
                            {players.map((player) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                    #{player.number} {player.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Match Selector */}
                <div>
                    <Label htmlFor="match-select" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                        Select Match
                    </Label>
                    <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                        <SelectTrigger
                            id="match-select"
                            className="border-4"
                            style={{ borderColor: theme.accent }}
                        >
                            <SelectValue placeholder="Choose a match..." />
                        </SelectTrigger>
                        <SelectContent>
                            {mockMatches.map((match) => (
                                <SelectItem key={match.id} value={match.id.toString()}>
                                    vs {match.opponent} ({match.date}) - {match.result}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Soccer Field with Heatmap */}
            <div
                className="relative border-4 bg-white overflow-hidden"
                style={{ borderColor: theme.accent }}
            >
                {/* Field Background */}
                <div
                    className="relative w-full"
                    style={{
                        aspectRatio: '2 / 3',
                        background: '#477023',
                    }}
                >
                    {/* Field markings */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 150"
                        preserveAspectRatio="none"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Outer boundary */}
                        <rect
                            x="2"
                            y="2"
                            width="96"
                            height="146"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Center line */}
                        <line
                            x1="2"
                            y1="75"
                            x2="98"
                            y2="75"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Center circle */}
                        <circle
                            cx="50"
                            cy="75"
                            r="10"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Center spot */}
                        <circle
                            cx="50"
                            cy="75"
                            r="0.5"
                            fill="white"
                            opacity="0.8"
                        />

                        {/* Top penalty area */}
                        <rect
                            x="25"
                            y="2"
                            width="50"
                            height="18"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Top goal area */}
                        <rect
                            x="37.5"
                            y="2"
                            width="25"
                            height="6"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Bottom penalty area */}
                        <rect
                            x="25"
                            y="130"
                            width="50"
                            height="18"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Bottom goal area */}
                        <rect
                            x="37.5"
                            y="142"
                            width="25"
                            height="6"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.8"
                        />

                        {/* Top penalty spot */}
                        <circle
                            cx="50"
                            cy="14"
                            r="0.5"
                            fill="white"
                            opacity="0.8"
                        />

                        {/* Bottom penalty spot */}
                        <circle
                            cx="50"
                            cy="136"
                            r="0.5"
                            fill="white"
                            opacity="0.8"
                        />
                    </svg>

                    {/* Heatmap Canvas Overlay */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                        style={{
                            mixBlendMode: 'multiply',
                            opacity: 0.85,
                        }}
                    />

                    {/* Empty State Message */}
                    {!selectedPlayer || !selectedMatch ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className="bg-white/95 border-4 px-8 py-6 text-center"
                                style={{ borderColor: theme.accent }}
                            >
                                <p
                                    style={{
                                        fontWeight: 800,
                                        fontSize: '1.125rem',
                                        color: theme.primary,
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    No Heatmap Selected
                                </p>
                                <p className="text-gray-600 text-sm">
                                    Choose a player and match above to view activity zones
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Legend */}
                {heatmapData.length > 0 && (
                    <div
                        className="absolute bottom-4 right-4 bg-white/95 border-4 px-4 py-3"
                        style={{ borderColor: theme.accent }}
                    >
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Activity Level
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Low</span>
                            <div className="flex gap-1">
                                <div
                                    className="w-6 h-6 border-2 border-gray-300"
                                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}
                                />
                                <div
                                    className="w-6 h-6 border-2 border-gray-300"
                                    style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }}
                                />
                                <div
                                    className="w-6 h-6 border-2 border-gray-300"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}
                                />
                            </div>
                            <span className="text-xs text-gray-600">High</span>
                        </div>
                    </div>
                )}

                {/* Stats Panel */}
                {heatmapData.length > 0 && selectedPlayer && selectedMatch && (
                    <div
                        className="absolute top-4 left-4 bg-white/95 border-4 px-4 py-3"
                        style={{ borderColor: theme.accent, minWidth: '200px' }}
                    >
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Match Statistics
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Data Points:</span>
                                <span style={{ fontWeight: 700 }}>{heatmapData.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Coverage:</span>
                                <span style={{ fontWeight: 700 }}>
                                    {Math.round((heatmapData.length / 150) * 100)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Peak Zone:</span>
                                <span style={{ fontWeight: 700, color: theme.primary }}>
                                    {heatmapData.length > 100 ? 'High' : heatmapData.length > 50 ? 'Medium' : 'Low'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
