import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components 
import LandingPage from './components/LandingPage';
import LibraryEntrance from './components/Library/LibraryEntrance';
import StudyHall from './components/StudyHall/StudyHall';
import LibraryStacks from './components/LibraryStacks/LibraryStacks';
import SermonGenerator from './components/SermonGenerator/SermonGenerator';
import SocialMediaStudio from './components/SocialMediaStudio/SocialMediaStudio';
import BibleReader from './components/Bible/BibleReader';
import SettingsPage from './components/Settings/SettingsPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen font-serif">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/entrance" element={<LibraryEntrance />} />
            <Route path="/library" element={<LibraryEntrance />} />
            <Route path="/study" element={<StudyHall />} />
            <Route path="/stacks" element={<LibraryStacks />} />
            <Route path="/workshop" element={<SermonGenerator />} />
            <Route path="/social" element={<SocialMediaStudio />} />
            <Route path="/bible" element={<BibleReader />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;