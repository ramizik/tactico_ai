import { useTheme } from '../contexts/ThemeContext';

/**
 * SportSwitcher component
 * Note: Sport switching UI has been removed as the app now focuses exclusively on football.
 * Sport is automatically set to FOOTBALL when university is selected.
 */
export const SportSwitcher = () => {
  const { sport } = useTheme();

  // No UI needed - sport is managed automatically
  if (!sport) return null;

  return null;
};
