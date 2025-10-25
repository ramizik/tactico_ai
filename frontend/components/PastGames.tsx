import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Video, Plus, X, Minimize2, Maximize2 } from 'lucide-react';
import { SportSwitcher } from './SportSwitcher';
import { AddMatch } from './AddMatch';
import { AIChat } from './AIChat';
import goalkeeperImage from 'figma:asset/e182018dfac45d64e40e055e6351b8c34ba96aeb.png';

const pastGames = [
  {
    id: 1,
    date: 'Oct 15, 2025',
    teams: 'Home Team vs Away Team',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 2,
    date: 'Oct 12, 2025',
    teams: 'Tigers vs Lions',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 3,
    date: 'Oct 8, 2025',
    teams: 'Eagles vs Hawks',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 4,
    date: 'Oct 5, 2025',
    teams: 'Warriors vs Knights',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 5,
    date: 'Oct 1, 2025',
    teams: 'Spartans vs Trojans',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
];

export const PastGames = () => {
  const { theme, sport } = useTheme();
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [selectedGame, setSelectedGame] = useState<typeof pastGames[0] | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [videoPosition, setVideoPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

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
        onComplete={() => setShowAddMatch(false)}
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
                      Teams
                    </th>
                    <th
                      className="p-4 text-left"
                      style={{
                        fontWeight: 800,
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      Video
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pastGames.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b-2 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#e5e5e5' }}
                    >
                      <td className="p-4" style={{ fontWeight: 600 }}>
                        {game.date}
                      </td>
                      <td className="p-4" style={{ fontWeight: 800 }}>
                        {game.teams}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedGame(game)}
                          className="flex items-center gap-2 px-4 py-2 text-white transition-all hover:scale-105"
                          style={{ backgroundColor: theme.accent, fontWeight: 800 }}
                        >
                          <Video className="w-4 h-4" />
                          Watch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          matchInfo={selectedGame.teams}
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
              {selectedGame.teams}
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
              <video
                controls
                autoPlay
                className="w-full border-2"
                style={{ borderColor: theme.accent }}
                src={selectedGame.videoUrl}
                onClick={(e) => e.stopPropagation()}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      )}
      
      <SportSwitcher />
    </div>
  );
};
