import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { AddMatch } from './components/AddMatch';
import { AIChat } from './components/AIChat';
import { Dashboard } from './components/Dashboard';
import { IntroPage } from './components/IntroPage';
import { MyTeam } from './components/MyTeam';
import { Navigation } from './components/Navigation';
import { PastGames } from './components/PastGames';
import { SelectionPage } from './components/SelectionPage';
import { ThemedBackground } from './components/ThemedBackground';
import { SessionProvider } from './contexts/SessionContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

type AppState = 'intro' | 'selection' | 'app';
type Page = 'dashboard' | 'past-games' | 'my-team' | 'add-match';

/**
 * Floating AI Chat Button
 * Positioned at bottom-right corner to open AI Coach chat interface
 */
function AIChatButton({ onClick }: { onClick: () => void }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] border-4 z-50"
      style={{
        backgroundColor: theme.primary,
        borderColor: theme.accent,
      }}
      aria-label="Open AI Coach Chat"
    >
      <MessageCircle className="w-8 h-8 text-white" />
    </button>
  );
}

function AppContent() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showAIChat, setShowAIChat] = useState(false);

  if (appState === 'intro') {
    return <IntroPage onGetStarted={() => setAppState('selection')} />;
  }

  if (appState === 'selection') {
    return <SelectionPage onComplete={() => setAppState('app')} />;
  }

  return (
    <div className="min-h-screen relative">
      <ThemedBackground />
      <div className="relative z-10">
        {currentPage !== 'add-match' && (
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        )}

        <div style={{ paddingTop: currentPage === 'add-match' ? '60px' : '110px' }}>
          {currentPage === 'dashboard' && (
            <Dashboard
              onMatchClick={() => setCurrentPage('past-games')}
            />
          )}
          {currentPage === 'past-games' && <PastGames />}
          {currentPage === 'my-team' && <MyTeam />}
          {currentPage === 'add-match' && (
            <AddMatch
              onBack={() => setCurrentPage('dashboard')}
              onComplete={() => setCurrentPage('past-games')}
            />
          )}
        </div>

        {/* Floating AI Chat Button - Hidden when chat is open */}
        {!showAIChat && <AIChatButton onClick={() => setShowAIChat(true)} />}

        {/* Floating AI Chat Window */}
        {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SessionProvider>
  );
}
