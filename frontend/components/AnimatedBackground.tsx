import { useTheme } from '../contexts/ThemeContext';

export const AnimatedBackground = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          animation: 'gradientShift 8s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
};
