import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { DebateResultsPage } from './pages/DebateResultsPage';
import { RebuttalArenaPage } from './pages/RebuttalArenaPage';
import { DebatePrepPage } from './pages/DebatePrepPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F6F3EA] text-[#252525] antialiased selection:bg-cobalt-50 selection:text-cobalt">
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/debate/:id" element={<DebateResultsPage />} />
            <Route path="/debate/:id/rebuttals" element={<RebuttalArenaPage />} />
            <Route path="/debate/:id/prep" element={<DebatePrepPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="border-t border-[#252525]/15 py-8 text-xs font-mono text-charcoal-500 bg-[#FAF8F3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-charcoal tracking-tight">DEBATE.AI</span>
              <span>&bull;</span>
              <span>THE DIALECTICAL DISPATCH &bull; THINK BOTH SIDES</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-charcoal-400">
              <span>SWISS EDITORIAL SYSTEM</span>
              <span>&bull;</span>
              <span>BALANCED SOURCED GROUNDING</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;

