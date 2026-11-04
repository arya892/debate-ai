import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { History, ShieldCheck, Key, Plus } from 'lucide-react';
import { fetchHealth } from '../api/client';
import { HealthStatus } from '../types/debate';
import { ApiKeyModal } from './ApiKeyModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const refreshHealth = () => {
    fetchHealth().then(setHealth).catch(() => null);
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F6F3EA] border-b border-[#252525]/15 px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Simple Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-sm bg-cobalt text-white flex items-center justify-center font-black text-lg">
            D
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-charcoal">
              Debate<span className="text-cobalt">AI</span>
            </span>
          </div>
        </Link>

        {/* Clean Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-sans">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Debate</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-colors ${
              location.pathname === '/history'
                ? 'bg-charcoal text-white border-charcoal'
                : 'bg-white border-[#252525]/15 text-charcoal hover:border-charcoal'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </Link>

          <Link
            to="/about"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-colors ${
              location.pathname === '/about'
                ? 'bg-charcoal text-white border-charcoal'
                : 'bg-white border-[#252525]/15 text-charcoal hover:border-charcoal'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verification</span>
          </Link>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-white hover:bg-stone-100 border border-[#252525]/15 text-charcoal-700 transition-colors"
            title="Configure API Keys (Optional)"
          >
            <Key className="w-3.5 h-3.5 text-cobalt" />
            <span className="hidden md:inline">API Keys</span>
            <span className={`w-1.5 h-1.5 rounded-full ${health?.llm_configured ? 'bg-cobalt' : 'bg-charcoal-400'}`} />
          </button>
        </div>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeysUpdated={refreshHealth}
      />
    </header>
  );
};

