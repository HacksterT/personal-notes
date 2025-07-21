import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components 
import LandingPage from './components/LandingPage';
import LibraryEntrance from './components/Library/LibraryEntrance';
import StudyHall from './components/Library/StudyHall';
import LibraryStacks from './components/Library/LibraryStacks';
import SermonGenerator from './components/SermonGenerator';
import SettingsPage from './components/SettingsPage'; // Import the new settings page

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Import navigation for Social Media
import NavigationMenu from './components/Library/NavigationMenu';

// Placeholder components for new routes
const SocialMedia = () => (
  <div className="min-h-screen bg-library-gradient">
    {/* Header */}
    <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <NavigationMenu />
        
        <div className="h-6 w-px bg-brass/30" />
        
        <h1 className="text-2xl font-cormorant text-brass">
          📱 Social Media Studio
        </h1>
      </div>
    </div>
    
    {/* Content */}
    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
      <div className="text-center">
        <div className="text-6xl mb-6 opacity-60">📱</div>
        <h2 className="text-4xl font-cormorant text-brass mb-4">Social Media Studio</h2>
        <p className="text-brass-light text-lg">Coming Soon - Content Publishing & Distribution</p>
        <div className="mt-8 text-brass/60">
          <p className="text-sm">Feature roadmap includes:</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <span>📝 Post Creation</span>
            <span>📅 Scheduling</span>
            <span>📊 Analytics</span>
            <span>🔗 Multi-Platform</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen font-serif">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/entrance" element={<LibraryEntrance />} />
            <Route path="/study" element={<StudyHall />} />
            <Route path="/stacks" element={<LibraryStacks />} />
            <Route path="/workshop" element={<SermonGenerator />} />
            <Route path="/social" element={<SocialMedia />} />
            <Route path="/settings" element={<SettingsPage />} /> {/* Add the new settings route */}
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;