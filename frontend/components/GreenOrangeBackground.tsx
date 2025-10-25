export const GreenOrangeBackground = () => {
  return (
    <>
      {/* Multiple gradient layers that cross-fade for smooth animation */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #477023 0%, #E3F26F 100%)',
          animation: 'fadeGradient1 20s ease-in-out infinite'
        }}
      />
      
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(225deg, #E3F26F 0%, #477023 100%)',
          animation: 'fadeGradient2 20s ease-in-out infinite',
          opacity: 0
        }}
      />
      
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(315deg, #477023 0%, #E3F26F 100%)',
          animation: 'fadeGradient3 20s ease-in-out infinite',
          opacity: 0
        }}
      />
      
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(45deg, #E3F26F 0%, #477023 100%)',
          animation: 'fadeGradient4 20s ease-in-out infinite',
          opacity: 0
        }}
      />
      
      {/* Green Gradient Blob for depth and movement */}
      <div 
        className="fixed z-0"
        style={{
          width: '1000px',
          height: '1000px',
          background: 'radial-gradient(circle, #477023 0%, transparent 60%)',
          filter: 'blur(150px)',
          opacity: 0.6,
          animation: 'float1 20s ease-in-out infinite',
          top: '-300px',
          left: '-300px'
        }}
      />
      
      {/* Yellow Gradient Blob for depth and movement */}
      <div 
        className="fixed z-0"
        style={{
          width: '1000px',
          height: '1000px',
          background: 'radial-gradient(circle, #E3F26F 0%, transparent 60%)',
          filter: 'blur(150px)',
          opacity: 0.6,
          animation: 'float2 25s ease-in-out infinite',
          bottom: '-300px',
          right: '-300px'
        }}
      />
      
      {/* Additional moving blob for more dynamic effect */}
      <div 
        className="fixed z-0"
        style={{
          width: '900px',
          height: '900px',
          background: 'radial-gradient(circle, #477023 0%, transparent 60%)',
          filter: 'blur(140px)',
          opacity: 0.5,
          animation: 'float3 30s ease-in-out infinite',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      <style>{`
        @keyframes fadeGradient1 {
          0%, 100% {
            opacity: 1;
          }
          25%, 75% {
            opacity: 0;
          }
        }
        
        @keyframes fadeGradient2 {
          0%, 50%, 100% {
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
        }
        
        @keyframes fadeGradient3 {
          0%, 25%, 75%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes fadeGradient4 {
          0%, 50%, 100% {
            opacity: 0;
          }
          75% {
            opacity: 1;
          }
        }
        
        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50vw, 30vh) scale(1.2);
          }
          66% {
            transform: translate(20vw, 60vh) scale(0.9);
          }
        }
        
        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-40vw, -20vh) scale(0.8);
          }
          66% {
            transform: translate(-60vw, -50vh) scale(1.3);
          }
        }
        
        @keyframes float3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          33% {
            transform: translate(-30%, -70%) scale(1.1);
          }
          66% {
            transform: translate(-70%, -30%) scale(0.95);
          }
        }
      `}</style>
    </>
  );
};
