import lettaLogo from 'figma:asset/8277ba994e7aa2a6faed0978364ee57b4852b0d8.png';
import vapiLogo from 'figma:asset/0a23b62bdc85870bebaf0ea576f82cfcfe826d2e.png';
import figmaLogo from 'figma:asset/872f41e4c293726b65c290de40221d276bec73f8.png';
import fastApiLogo from 'figma:asset/b02c0947c4e8e2a3c39720ae4eeb6a4f054801c4.png';
import boltLogo from 'figma:asset/6a8ffa74e936065248eccbee550ab208d8d3f48b.png';
import unityLogo from 'figma:asset/c84cb4913ddef31b5a0d3d0773e23e5e714ba67e.png';

const sponsors = [
  { id: 1, logo: lettaLogo, name: 'Letta' },
  { id: 2, logo: vapiLogo, name: 'VAPI' },
  { id: 3, logo: figmaLogo, name: 'Figma' },
  { id: 4, logo: fastApiLogo, name: 'FastAPI' },
  { id: 5, logo: boltLogo, name: 'Bolt' },
  { id: 6, logo: unityLogo, name: 'Unity' },
];

export const SponsorMarquee = () => {
  return (
    <div className="relative overflow-hidden py-12 backdrop-blur-md" style={{ backgroundColor: '#A8B24F' }}>
      <div className="flex gap-20 animate-marquee items-center">
        {/* First set of logos */}
        {sponsors.map((sponsor) => (
          <div
            key={`first-${sponsor.id}`}
            className="flex-shrink-0 flex items-center justify-center w-48 h-16"
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="h-full w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              style={sponsor.name !== 'Unity' ? { filter: 'brightness(0) invert(1)' } : {}}
            />
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {sponsors.map((sponsor) => (
          <div
            key={`second-${sponsor.id}`}
            className="flex-shrink-0 flex items-center justify-center w-48 h-16"
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="h-full w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              style={sponsor.name !== 'Unity' ? { filter: 'brightness(0) invert(1)' } : {}}
            />
          </div>
        ))}
        {/* Third set for extra seamlessness */}
        {sponsors.map((sponsor) => (
          <div
            key={`third-${sponsor.id}`}
            className="flex-shrink-0 flex items-center justify-center w-48 h-16"
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="h-full w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              style={sponsor.name !== 'Unity' ? { filter: 'brightness(0) invert(1)' } : {}}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 35s linear infinite;
          display: flex;
          width: max-content;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
