import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, History, Users } from 'lucide-react';
import uopLogo from 'figma:asset/6f52a6f51b1118f22614d64aa4f3ac3088637952.png';
import ucLogo from 'figma:asset/9717c66175f8bd785a58b86d4b7ddb44dd1476d2.png';

type Page = 'dashboard' | 'past-games' | 'my-team';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Navigation = ({ currentPage, onNavigate }: NavigationProps) => {
  const { theme, sport, university } = useTheme();

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'past-games' as Page, label: 'Past Games', icon: History },
    { id: 'my-team' as Page, label: 'My Team', icon: Users },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b-4 mb-4" style={{ backgroundColor: '#000000', borderColor: theme.accent }}>
      <div 
        className="w-full px-6 py-4" 
        style={{ 
          backgroundColor: '#000000'
        }}
      >
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 mr-auto">
            {university && (
              <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                <img 
                  src={university === 'UOP' ? uopLogo : ucLogo} 
                  alt={`${university} Logo`} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#FFFFFF',
              }}
            >
              TacticoAI
            </div>
          </div>
          
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center gap-2 px-6 py-3 border-2 transition-all hover:scale-105"
                  style={{
                    backgroundColor: isActive ? theme.primary : 'white',
                    color: isActive ? 'white' : 'black',
                    borderColor: isActive ? theme.secondary : theme.accent,
                    fontWeight: 800,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
