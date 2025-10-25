import { Upload, Brain, Mic, TrendingUp, Zap } from 'lucide-react';
import { GreenOrangeBackground } from './GreenOrangeBackground';
import { SponsorMarquee } from './SponsorMarquee';
import { useState, useEffect } from 'react';
import coachImage from '../assets/03f1d50dd2f0e2ff799c65ce1dde71a77be2e934.png';
import soccerImage from '../assets/cdcbf7f15e4bda1914ab23b84eb97ee3c2d8e36b.png';

interface IntroPageProps {
  onGetStarted: () => void;
}

export const IntroPage = ({ onGetStarted }: IntroPageProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Continuous rotation
      setRotation((elapsed / 20) % 360);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen relative">
      <GreenOrangeBackground />
      
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="text-center max-w-5xl">
          <div className="inline-block relative">
            {/* Animated Soccer Ball - Behind the text */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 0 }}>
              <div className="relative w-[600px] h-[600px]">
                <img
                  src={soccerImage}
                  alt="Soccer Ball"
                  className="absolute inset-0 w-full h-full object-contain opacity-40"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              </div>
            </div>

            {/* Main heading box - In front */}
            <div 
              className="text-white uppercase border-8 border-white px-8 py-6 bg-black/30 backdrop-blur-sm relative"
              style={{
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: 900,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                zIndex: 10,
              }}
            >
              <div className="mb-2">AI TACTICAL</div>
              <div 
                className="border-t-4 pt-2"
                style={{
                  fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                  borderColor: '#E3F26F',
                }}
              >
                ASSISTANT
              </div>
              <div 
                className="mt-2 mb-8"
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                  letterSpacing: '0.15em',
                  color: '#E3F26F',
                }}
              >
                FOR SPORTS TEAMS
              </div>
              <div className="border-t-4 border-white pt-6">
                <button
                  onClick={onGetStarted}
                  className="px-12 py-4 text-white border-4 border-white rounded-none transition-all hover:scale-105 hover:shadow-2xl uppercase"
                  style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    backgroundColor: '#E3F26F',
                    color: '#000000',
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-black/80 backdrop-blur-md px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Description */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="w-8 h-8" style={{ color: '#477023' }} strokeWidth={3} />
              <h2
                className="text-white"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                }}
              >
                ELEVATE YOUR GAME
              </h2>
              <Zap className="w-8 h-8" style={{ color: '#E3F26F' }} strokeWidth={3} />
            </div>
            <p
              className="text-white/90 max-w-3xl mx-auto"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontWeight: 500,
                lineHeight: 1.7,
              }}
            >
              Transform match videos into winning strategies. Get instant AI-powered tactical analysis 
              and voice-driven coaching insights that give your team the competitive edge.
            </p>
          </div>

          {/* Top Features - Full Width */}
          <div className="space-y-6 mb-6">
            {/* Feature 1 */}
            <div className="border-4 border-white/20 p-10 bg-gradient-to-br from-white/5 to-transparent transition-all" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#47702380'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}>
              <div className="flex items-start gap-6">
                <div className="p-4 border-4 border-black flex-shrink-0" style={{ backgroundColor: '#477023' }}>
                  <Upload className="w-12 h-12 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 
                    className="text-white mb-3"
                    style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.01em' }}
                  >
                    Upload Match Videos
                  </h3>
                  <p className="text-white/80" style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>
                    Football videos analyzed in seconds
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border-4 border-white/20 p-10 bg-gradient-to-br from-white/5 to-transparent transition-all" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E3F26F80'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}>
              <div className="flex items-start gap-6">
                <div className="p-4 border-4 border-black flex-shrink-0" style={{ backgroundColor: '#E3F26F' }}>
                  <Brain className="w-12 h-12 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 
                    className="text-white mb-3"
                    style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.01em' }}
                  >
                    Get Instant AI Analysis
                  </h3>
                  <p className="text-white/80" style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>
                    Instant tactical insights for players and teams
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 - Full Width */}
          <div className="mb-6">
            <div className="border-4 border-white/20 p-10 bg-gradient-to-br from-white/5 to-transparent transition-all" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#47702380'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}>
              <div className="flex items-start gap-6">
                <div className="p-4 border-4 border-black flex-shrink-0" style={{ backgroundColor: '#477023' }}>
                  <Mic className="w-12 h-12 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 
                    className="text-white mb-3"
                    style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.01em' }}
                  >
                    Voice Coaching Tips
                  </h3>
                  <p className="text-white/80" style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>
                    Receive voice-driven coaching recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Image Left, Feature Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Coach Image */}
            <div className="flex items-center justify-center relative">
              {/* Circular gradient shadow */}
              <div 
                className="absolute top-1/2 left-1/2"
                style={{
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #E3F26F 0%, #477023 100%)',
                  filter: 'blur(40px)',
                  opacity: 0.6,
                  transform: 'translate(-50%, calc(-50% + 20px))',
                  zIndex: 0,
                }}
              />
              <img 
                src={coachImage} 
                alt="AI Coach" 
                className="w-full max-w-sm object-contain relative z-10"
              />
            </div>

            {/* Right - Feature 4 */}
            <div className="border-4 border-white/20 p-14 bg-gradient-to-br from-white/5 to-transparent transition-all min-h-[350px] flex items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E3F26F80'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}>
              <div className="flex items-start gap-8">
                <div className="p-5 border-4 border-black flex-shrink-0" style={{ backgroundColor: '#E3F26F' }}>
                  <TrendingUp className="w-16 h-16 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 
                    className="text-white mb-4"
                    style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.01em' }}
                  >
                    Track Stats & Trends
                  </h3>
                  <p className="text-white/80" style={{ fontSize: '1.375rem', lineHeight: 1.6 }}>
                    Monitor stats, formations, and strategy trends
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Section */}
      <div className="relative z-10 bg-black/80 backdrop-blur-md">
        <div className="text-center py-8">
          <h3 
            className="text-white inline-block px-8 py-3"
            style={{
              fontSize: 'clamp(1.25rem, 3vw, 2rem)',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            What's used in our website
          </h3>
        </div>
        <SponsorMarquee />
      </div>
    </div>
  );
};
