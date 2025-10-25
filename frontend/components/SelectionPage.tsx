import { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { University, useTheme } from '../contexts/ThemeContext';
import { teamsApi } from '../lib/api';
import { GreenOrangeBackground } from './GreenOrangeBackground';

interface SelectionPageProps {
  onComplete: () => void;
}

export const SelectionPage = ({ onComplete }: SelectionPageProps) => {
  const { setUniversity, setSport } = useTheme();
  const { setCurrentTeam } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleUniversitySelect = async (uni: University) => {
    setIsLoading(true);
    try {
      // Load teams from backend
      const teams = await teamsApi.getAll();

      // Find team matching the selected university
      const matchingTeam = teams.find((team: any) => team.university === uni);

      if (matchingTeam) {
        // Save team to session
        setCurrentTeam(matchingTeam);

        // Update theme
        setUniversity(uni);
        setSport('FOOTBALL'); // Always set to football

        setTimeout(() => {
          onComplete();
        }, 300);
      } else {
        console.error('No team found for university:', uni);
        alert('No team found for this university. Please contact support.');
      }
    } catch (error) {
      console.error('Failed to load team:', error);
      alert('Failed to load team. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <GreenOrangeBackground />
      <div className="w-full max-w-3xl relative z-10">
        <h2
          className="text-white text-center mb-12"
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          Select Your University
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleUniversitySelect('UOP')}
            disabled={isLoading}
            className="p-8 bg-white border-4 border-black rounded-none transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-black" style={{ fontSize: '2rem', fontWeight: 900 }}>
              UOP
            </div>
            <div className="text-gray-600 mt-2">University of the Pacific</div>
          </button>

          <button
            onClick={() => handleUniversitySelect('UC_CALIFORNIA')}
            disabled={isLoading}
            className="p-8 bg-white border-4 border-black rounded-none transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-black" style={{ fontSize: '2rem', fontWeight: 900 }}>
              UC California
            </div>
            <div className="text-gray-600 mt-2">University of California</div>
          </button>
        </div>

        {isLoading && (
          <div className="text-white text-center mt-6">
            Loading team data...
          </div>
        )}
      </div>
    </div>
  );
};
