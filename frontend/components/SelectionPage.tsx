import { University, useTheme } from '../contexts/ThemeContext';
import { GreenOrangeBackground } from './GreenOrangeBackground';

interface SelectionPageProps {
  onComplete: () => void;
}

export const SelectionPage = ({ onComplete }: SelectionPageProps) => {
  const { setUniversity, setSport } = useTheme();

  const handleUniversitySelect = (uni: University) => {
    setUniversity(uni);
    setSport('FOOTBALL'); // Always set to football
    setTimeout(() => {
      onComplete();
    }, 300);
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
            className="p-8 bg-white border-4 border-black rounded-none transition-all hover:scale-105"
          >
            <div className="text-black" style={{ fontSize: '2rem', fontWeight: 900 }}>
              UOP
            </div>
            <div className="text-gray-600 mt-2">University of the Pacific</div>
          </button>

          <button
            onClick={() => handleUniversitySelect('UC_CALIFORNIA')}
            className="p-8 bg-white border-4 border-black rounded-none transition-all hover:scale-105"
          >
            <div className="text-black" style={{ fontSize: '2rem', fontWeight: 900 }}>
              UC California
            </div>
            <div className="text-gray-600 mt-2">University of California</div>
          </button>
        </div>
      </div>
    </div>
  );
};
