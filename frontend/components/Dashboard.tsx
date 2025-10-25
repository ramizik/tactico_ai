import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp } from 'lucide-react';
import coachImage from 'figma:asset/7bfaab3066f6ffb1c8b4b53ce7e35a1b4a681d8a.png';

interface DashboardProps {
  onMatchClick: () => void;
}

const recentMatches = [
  {
    id: 1,
    date: 'Oct 15, 2025',
    team1: 'Home Team',
    team2: 'Away Team',
    score: '3-2',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
  },
  {
    id: 2,
    date: 'Oct 12, 2025',
    team1: 'Tigers',
    team2: 'Lions',
    score: '1-1',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
  },
  {
    id: 3,
    date: 'Oct 8, 2025',
    team1: 'Eagles',
    team2: 'Hawks',
    score: '4-0',
    thumbnail: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400',
  },
];



export const Dashboard = ({ onMatchClick }: DashboardProps) => {
  const { theme, sport } = useTheme();

  return (
    <div className="min-h-screen px-6 md:px-12 pb-8" style={{ paddingTop: '60px' }}>
      <div className="max-w-7xl mx-auto">
        <h1
          className="text-center mb-12"
          style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 400,
            color: '#ffffff',
            textShadow: '-0.5px 0 #c5d94a, 0.5px 0 #c5d94a, 0 -0.5px #c5d94a, 0 0.5px #c5d94a, -0.5px -0.5px #c5d94a, 0.5px -0.5px #c5d94a, -0.5px 0.5px #c5d94a, 0.5px 0.5px #c5d94a',
            letterSpacing: '0.05em',
          }}
        >
          Dashboard
        </h1>

        {/* First Row: Recent Matches (Full Width) */}
        <div className="mb-12">
          <h2
            className="mb-6"
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: theme.secondary,
            }}
          >
            Recent Matches
          </h2>
          <div className="space-y-4">
            {recentMatches.map((match) => (
              <button
                key={match.id}
                onClick={onMatchClick}
                className="w-full bg-white border-4 p-4 flex gap-4 items-center transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{ borderColor: theme.accent }}
              >
                <div
                  className="w-32 h-20 bg-gray-200 flex-shrink-0"
                  style={{
                    backgroundImage: `url(${match.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="flex-1 text-left">
                  <div className="text-gray-600 text-sm mb-1">{match.date}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>
                    {match.team1} vs {match.team2}
                  </div>
                </div>
                <div
                  className="text-white px-6 py-3"
                  style={{
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    backgroundColor: theme.primary,
                  }}
                >
                  {match.score}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Performance Widget & Coach Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Performance Widget */}
          <div>
            <h2
              className="mb-6"
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: theme.secondary,
              }}
            >
              Performance
            </h2>
            <div
              className="bg-white border-4 p-8 h-96 flex flex-col items-center justify-center"
              style={{ borderColor: theme.accent }}
            >
              <TrendingUp className="w-24 h-24 mb-6" style={{ color: theme.primary }} />
              <div className="text-center">
                <div style={{ fontWeight: 900, fontSize: '3rem', color: theme.primary }}>
                  78%
                </div>
                <div className="text-gray-600 mt-2">Win Rate</div>
              </div>
              <div className="mt-8 w-full space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Offense</span>
                    <span className="text-sm" style={{ fontWeight: 800 }}>85%</span>
                  </div>
                  <div className="h-3 bg-gray-200">
                    <div
                      className="h-full"
                      style={{ width: '85%', backgroundColor: theme.accent }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Defense</span>
                    <span className="text-sm" style={{ fontWeight: 800 }}>72%</span>
                  </div>
                  <div className="h-3 bg-gray-200">
                    <div
                      className="h-full"
                      style={{ width: '72%', backgroundColor: theme.primary }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coach Image */}
          <div className="flex items-center justify-center">
            <img 
              src={coachImage} 
              alt="AI Football Coach"
              className="h-[450px] w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
