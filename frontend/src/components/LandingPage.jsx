import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lightbulb, Feather } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-library-gradient text-brass-light font-serif">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center p-8 pt-24 md:pt-32">
        <header className="mb-12">
          <h1 className="text-5xl md:text-7xl font-cormorant text-brass mb-4 leading-tight">
            Amplify Your Message, Deepen Your Study
          </h1>
          <p className="text-xl md:text-2xl text-brass-light max-w-3xl mx-auto">
            Partner with an AI companion to explore texts, organize insights, and craft sermons that resonate.
          </p>
        </header>

        <main className="flex flex-col items-center space-y-4">
          <Link
            to="/entrance"
            className="bg-brass hover:bg-brass/80 text-library-dark font-bold py-4 px-10 rounded-lg text-xl transition-colors duration-300 shadow-lg transform hover:scale-105"
          >
            Explore the Library
          </Link>
          <a
            href="https://cortivus.com/#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brass hover:bg-brass/80 text-library-dark font-bold py-4 px-10 rounded-lg text-xl transition-colors duration-300 shadow-lg transform hover:scale-105"
          >
            Request Pilot Access
          </a>
          <p className="text-brass-light/90 mt-6 max-w-2xl text-center text-lg">
            At Cortivus, we are accepting requests for a limited number of seats as pilot users. We are designing features based on user input. Participants will get a 1 year subscription for free once it goes live. Please note the request form takes you to our primary website <a href="https://cortivus.com" target="_blank" rel="noopener noreferrer" className="text-brass hover:underline">Cortivus.com</a>.
          </p>
        </main>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-cormorant text-center text-brass mb-12">Your Ministry Assistant that just happens to be powered by AI!</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="bg-library-dark/30 p-8 rounded-lg shadow-md">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-brass" />
              <h3 className="text-2xl font-cormorant text-brass mb-2">AI Study Partner</h3>
              <p className="text-brass-light/80">
                Dive deeper into scripture with contextual insights, historical background, and thematic connections, all curated by your AI companion.
              </p>
            </div>
            <div className="bg-library-dark/30 p-8 rounded-lg shadow-md">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-brass" />
              <h3 className="text-2xl font-cormorant text-brass mb-2">Intelligent Sermon Crafting</h3>
              <p className="text-brass-light/80">
                Move from inspiration to outline seamlessly. Organize your thoughts, find illustrations, and structure your message with clarity and impact.
              </p>
            </div>
            <div className="bg-library-dark/30 p-8 rounded-lg shadow-md">
              <Feather className="w-12 h-12 mx-auto mb-4 text-brass" />
              <h3 className="text-2xl font-cormorant text-brass mb-2">Your Private Workspace</h3>
              <p className="text-brass-light/80">
                A dedicated and secure space to build your personal library of sermons, notes, and research, accessible anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center text-brass/60 text-sm pb-8">
        <p>&copy; {new Date().getFullYear()} Sermon Organizer. All Rights Reserved.</p>
        <p className="mt-2">Securely deployed on Microsoft Azure.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
