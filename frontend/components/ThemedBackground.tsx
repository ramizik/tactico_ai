import { useTheme } from '../contexts/ThemeContext';

export const ThemedBackground = () => {
  const { theme } = useTheme();

  // For Football: Green-dominant gradient mixed with university colors
  const sportBase = '#477023';
  const sportSecondary = '#477023';
  const sportTertiary = '#477023';

  return (
    <>
      {/* Multiple gradient layers that cross-fade for smooth animation */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, ${sportBase} 0%, ${theme.primary} 50%, ${theme.secondary} 100%)`,
          animation: 'fadeThemeGradient1 25s ease-in-out infinite'
        }}
      />

      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(180deg, ${theme.primary} 0%, ${sportBase} 50%, ${theme.secondary} 100%)`,
          animation: 'fadeThemeGradient2 25s ease-in-out infinite',
          opacity: 0
        }}
      />

      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(225deg, ${theme.secondary} 0%, ${sportSecondary} 50%, ${theme.primary} 100%)`,
          animation: 'fadeThemeGradient3 25s ease-in-out infinite',
          opacity: 0
        }}
      />

      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(270deg, ${sportBase} 0%, ${theme.secondary} 50%, ${theme.primary} 100%)`,
          animation: 'fadeThemeGradient4 25s ease-in-out infinite',
          opacity: 0
        }}
      />

      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(315deg, ${theme.primary} 0%, ${sportSecondary} 50%, ${theme.secondary} 100%)`,
          animation: 'fadeThemeGradient5 25s ease-in-out infinite',
          opacity: 0
        }}
      />

      {/* Sport color blob - dominant */}
      <div
        className="fixed z-0"
        style={{
          width: '1200px',
          height: '1200px',
          background: `radial-gradient(circle, ${sportBase} 0%, transparent 60%)`,
          filter: 'blur(160px)',
          opacity: 0.7,
          animation: 'floatTheme1 22s ease-in-out infinite',
          top: '-350px',
          left: '-350px'
        }}
      />

      {/* Primary university color blob */}
      <div
        className="fixed z-0"
        style={{
          width: '1000px',
          height: '1000px',
          background: `radial-gradient(circle, ${theme.primary} 0%, transparent 60%)`,
          filter: 'blur(160px)',
          opacity: 0.6,
          animation: 'floatTheme2 28s ease-in-out infinite',
          top: '20%',
          right: '-300px'
        }}
      />

      {/* Secondary university color blob */}
      <div
        className="fixed z-0"
        style={{
          width: '950px',
          height: '950px',
          background: `radial-gradient(circle, ${theme.secondary} 0%, transparent 60%)`,
          filter: 'blur(140px)',
          opacity: 0.5,
          animation: 'floatTheme3 24s ease-in-out infinite',
          bottom: '-250px',
          left: '35%'
        }}
      />

      {/* Additional sport color blob for emphasis */}
      <div
        className="fixed z-0"
        style={{
          width: '1100px',
          height: '1100px',
          background: `radial-gradient(circle, ${sportTertiary} 0%, transparent 60%)`,
          filter: 'blur(170px)',
          opacity: 0.6,
          animation: 'floatTheme4 26s ease-in-out infinite',
          bottom: '10%',
          right: '20%'
        }}
      />

      <style>{`
        @keyframes fadeThemeGradient1 {
          0%, 100% {
            opacity: 1;
          }
          20%, 80% {
            opacity: 0;
          }
        }

        @keyframes fadeThemeGradient2 {
          0%, 40%, 100% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
        }

        @keyframes fadeThemeGradient3 {
          0%, 20%, 60%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }

        @keyframes fadeThemeGradient4 {
          0%, 40%, 80%, 100% {
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
        }

        @keyframes fadeThemeGradient5 {
          0%, 60%, 100% {
            opacity: 0;
          }
          80% {
            opacity: 1;
          }
        }

        @keyframes floatTheme1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40vw, 25vh) scale(1.2);
          }
          66% {
            transform: translate(15vw, 50vh) scale(0.95);
          }
        }

        @keyframes floatTheme2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-35vw, 30vh) scale(0.85);
          }
          66% {
            transform: translate(-50vw, -15vh) scale(1.15);
          }
        }

        @keyframes floatTheme3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-20vw, -30vh) scale(1.2);
          }
          66% {
            transform: translate(25vw, -40vh) scale(0.9);
          }
        }

        @keyframes floatTheme4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-30vw, -25vh) scale(1.1);
          }
          66% {
            transform: translate(20vw, 35vh) scale(0.95);
          }
        }
      `}</style>
    </>
  );
};
