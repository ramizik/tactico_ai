import { useTheme } from '../contexts/ThemeContext';
import uopLogo from 'figma:asset/6f52a6f51b1118f22614d64aa4f3ac3088637952.png';
import ucLogo from 'figma:asset/9717c66175f8bd785a58b86d4b7ddb44dd1476d2.png';

export const GlobalHeader = () => {
  const { university } = useTheme();

  if (!university) return null;

  return (
    <div className="fixed top-1 left-6 z-50 max-w-7xl">
      <div className="w-14 h-14 flex items-center justify-center">
        <img 
          src={university === 'UOP' ? uopLogo : ucLogo} 
          alt={`${university} Logo`} 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
