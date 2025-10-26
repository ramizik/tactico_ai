import { ChevronDown, ChevronUp, Maximize2, Minimize2, Plus, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import goalkeeperImage from '../assets/e182018dfac45d64e40e055e6351b8c34ba96aeb.png';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { matchesApi } from '../lib/api';
import type { Match } from '../types/api';
import { AddMatch } from './AddMatch';
import { AIChat } from './AIChat';
import AnalysisProgress from './AnalysisProgress';
import { SportSwitcher } from './SportSwitcher';

export const PastGames = () => {
  const { theme } = useTheme();
  const { teamId } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Match | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [videoPosition, setVideoPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Load matches from backend
  useEffect(() => {
    const loadMatches = async () => {
      if (!teamId) return;

      try {
        setIsLoading(true);
        const teamMatches = await matchesApi.getTeamMatches(teamId, 20);
        setMatches(teamMatches);
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [teamId]);

  // Refresh matches when returning from AddMatch
  const handleAddMatchComplete = () => {
    setShowAddMatch(false);
    // Reload matches
    if (teamId) {
      matchesApi.getTeamMatches(teamId, 20)
        .then(setMatches)
        .catch(console.error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'VIDEO') return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: videoPosition.x,
      initialY: videoPosition.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setVideoPosition({
          x: dragRef.current.initialX + deltaX,
          y: dragRef.current.initialY + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // If AddMatch flow is active, show it instead of the main content
  if (showAddMatch) {
    return (
      <AddMatch
        onBack={() => setShowAddMatch(false)}
        onComplete={handleAddMatchComplete}
        backButtonText="Back to Past Games"
      />
    );
  }



  return (
    <div className="min-h-screen px-6 md:px-12 pb-8" style={{ paddingTop: '60px' }}>
      <div className="max-w-6xl mx-auto">
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
          Past Games
        </h1>

        {/* Content Grid with Table and Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Past Games Table */}
          <div className="bg-white border-4" style={{ borderColor: theme.accent }}>
            <div
              className="p-6 border-b-4"
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.accent,
              }}
            >
              <h2 className="text-white" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                Match History
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                Loading matches...
              </div>
            ) : matches.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="mb-4 text-lg font-bold">No matches yet</p>
                <p>Add your first match to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4" style={{ borderColor: theme.accent }}>
                      <th
                        className="p-4 text-left"
                        style={{
                          fontWeight: 800,
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        Date
                      </th>
                      <th
                        className="p-4 text-left"
                        style={{
                          fontWeight: 800,
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        Opponent
                      </th>
                      <th
                        className="p-4 text-left"
                        style={{
                          fontWeight: 800,
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        Status
                      </th>
                      <th
                        className="p-4 text-left"
                        style={{
                          fontWeight: 800,
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <>
                        <tr
                          key={match.id}
                          className="border-b-2 hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#e5e5e5' }}
                        >
                          <td className="p-4" style={{ fontWeight: 600 }}>
                            {new Date(match.match_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4" style={{ fontWeight: 800 }}>
                            vs {match.opponent}
                          </td>
                          <td className="p-4">
                            <span
                              className="px-3 py-1 text-xs font-bold rounded"
                              style={{
                                backgroundColor:
                                  match.status === 'analyzed' ? '#22c55e' :
                                    match.status === 'processing' ? '#f59e0b' :
                                      match.status === 'uploading' ? '#3b82f6' :
                                        match.status === 'failed' ? '#ef4444' : '#6b7280',
                                color: 'white'
                              }}
                            >
                              {match.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            {match.status === 'analyzed' && match.analyses?.[0]?.enhanced_video_path ? (
                              <button
                                onClick={() => setSelectedGame(match)}
                                className="flex items-center gap-2 px-4 py-2 text-white transition-all hover:scale-105"
                                style={{ backgroundColor: theme.accent, fontWeight: 800 }}
                              >
                                <Video className="w-4 h-4" />
                                Watch
                              </button>
                            ) : match.status === 'processing' || match.status === 'uploading' ? (
                              <button
                                onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                                className="flex items-center gap-2 px-4 py-2 border-2 transition-all hover:bg-gray-100"
                                style={{ borderColor: theme.accent, fontWeight: 800 }}
                              >
                                {expandedMatchId === match.id ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Hide Progress
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    View Progress
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                {match.status === 'failed' ? 'Failed' : 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Progress View */}
                        {expandedMatchId === match.id && (match.status === 'processing' || match.status === 'uploading') && (
                          <tr key={`${match.id}-progress`}>
                            <td colSpan={4} className="p-6 bg-gray-50" style={{ borderColor: '#e5e5e5' }}>
                              <AnalysisProgress
                                matchId={match.id}
                                onComplete={() => {
                                  // Reload matches to update status and collapse
                                  if (teamId) {
                                    matchesApi.getTeamMatches(teamId, 20)
                                      .then(data => {
                                        setMatches(data);
                                        // Collapse the expanded row
                                        setExpandedMatchId(null);
                                      })
                                      .catch(console.error);
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Goalkeeper Visual - Always Visible */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={goalkeeperImage}
              alt="Football Goalkeeper"
              className="w-full max-w-[500px] h-auto object-contain"
            />
          </div>
        </div>



        {/* Add New Game Button */}
        <div className="mb-12">
          <button
            onClick={() => setShowAddMatch(true)}
            className="flex items-center gap-3 px-8 py-4 bg-white border-4 transition-all hover:scale-105 hover:shadow-xl"
            style={{
              borderColor: theme.secondary,
              fontWeight: 800,
              fontSize: '1.125rem',
            }}
            data-testid="add-new-game-button"
          >
            <Plus className="w-6 h-6" />
            Add New Game
          </button>
        </div>
      </div>

      {/* Floating AI Chat Window */}
      {showAIChat && selectedGame && (
        <AIChat
          onClose={() => {
            setShowAIChat(false);
          }}
          matchInfo={`vs ${selectedGame.opponent}`}
        />
      )}

      {/* Floating Video Player Window */}
      {selectedGame && (
        <div
          className="fixed bg-white border-4 shadow-2xl z-50"
          style={{
            borderColor: theme.accent,
            left: `${videoPosition.x}px`,
            top: `${videoPosition.y}px`,
            width: isMinimized ? '450px' : '700px',
            maxWidth: '90vw',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b-4"
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.accent,
            }}
          >
            <h3 className="text-white truncate" style={{ fontWeight: 800, fontSize: '1rem' }}>
              vs {selectedGame.opponent}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                aria-label={isMinimized ? "Maximize video" : "Minimize video"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGame(null);
                  setIsMinimized(false);
                }}
                className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                aria-label="Close video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Content */}
          {!isMinimized && (
            <div className="p-4">
              {selectedGame.analyses?.[0]?.enhanced_video_path ? (
                <video
                  controls
                  autoPlay
                  className="w-full border-2"
                  style={{ borderColor: theme.accent }}
                  src={`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/video/${selectedGame.analyses[0].enhanced_video_path}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="mb-2 font-bold">Video not available</p>
                  <p className="text-sm">Analysis not completed or video path missing</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <SportSwitcher />
    </div>
  );
};
