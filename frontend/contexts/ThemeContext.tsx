import { createContext, ReactNode, useContext, useState } from 'react';

export type University = 'UOP' | 'UC_CALIFORNIA' | null;
export type Sport = 'FOOTBALL' | null;

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ThemeContextType {
  university: University;
  sport: Sport;
  theme: Theme;
  setUniversity: (university: University) => void;
  setSport: (sport: Sport) => void;
}

// Default theme is no longer used since we always have university/sport context

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const getTheme = (university: University, sport: Sport): Theme => {
  let primary = '#1295D8';
  let secondary = '#FFB511';
  let accent = '#477023';
  let gradientFrom = '#477023';
  let gradientTo = '#f97316';

  // Set university colors
  if (university === 'UOP') {
    primary = '#FF671D';
    secondary = '#231F20';
  } else if (university === 'UC_CALIFORNIA') {
    primary = '#1295D8';
    secondary = '#FFB511';
  }

  // Set sport accent
  if (sport === 'FOOTBALL') {
    accent = '#477023';
    gradientFrom = '#477023';
    gradientTo = '#477023';
  }

  return { primary, secondary, accent, gradientFrom, gradientTo };
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [university, setUniversity] = useState<University>(null);
  const [sport, setSport] = useState<Sport>(null);
  const theme = getTheme(university, sport);

  return (
    <ThemeContext.Provider value={{ university, sport, theme, setUniversity, setSport }}>
      {children}
    </ThemeContext.Provider>
  );
};
