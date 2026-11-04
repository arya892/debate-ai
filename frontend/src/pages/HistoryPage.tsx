import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History, Search, Trash2, ExternalLink, Calendar,
  Sparkles, RefreshCw, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { listDebates, deleteDebate, regenerateDebate } from '../api/client';
import { DebateSummary } from '../types/debate';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = (query?: string) => {
    setLoading(true);
    listDebates(1, 50, query)
      .then((data) => {
        setDebates(data.items);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory(search);
  }, [search]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this debate record?')) return;

    setDeletingId(id);
    try {
      await deleteDebate(id);
      setDebates((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete debate record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = async (d: DebateSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await regenerateDebate(d.id, d.settings);
      navigate(`/debate/${d.id}`);
    } catch (err) {
      alert('Failed to regenerate debate');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EA] text-[#252525] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 font-sans">
        {/* Header */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal text-xs font-mono font-bold uppercase tracking-wider">
                <History className="w-3.5 h-3.5 text-cobalt" />
                <span>ARCHIVE & REPOSITORY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-charcoal">
                Debate Dossier Archive
              </h1>
              <p className="text-xs text-charcoal-500 font-mono">
                {total} indexed records cataloged in database storage.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search past editions..."
                className="w-full pl-9 pr-4 py-2 rounded-sm bg-[#FAF8F3] border border-[#252525]/15 text-xs text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt font-mono transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Debates List / Empty State */}
        {loading ? (
          <div className="py-20 text-center space-y-3 font-mono">
            <RefreshCw className="w-8 h-8 animate-spin text-cobalt mx-auto" />
            <p className="text-xs text-charcoal-500">Retrieving catalog records...</p>
          </div>
        ) : debates.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white border border-[#252525]/15 rounded-sm p-8 shadow-editorial">
            <History className="w-10 h-10 text-charcoal-400 mx-auto" />
            <h3 className="text-lg font-bold text-charcoal">No Archive Records Found</h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              {search ? 'No saved debates match your query.' : 'Generate your first balanced debate from the home page.'}
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white text-xs font-semibold shadow-editorial transition-colors"
            >
              Dispatch New Debate
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {debates.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/debate/${d.id}`)}
                className="p-5 rounded-sm bg-white hover:bg-[#FAF8F3] border border-[#252525]/15 hover:border-cobalt transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-editorial"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold ${
                      d.status === 'completed'
                        ? 'bg-cobalt-50 text-cobalt border border-cobalt-200'
                        : d.status === 'failed'
                        ? 'bg-vibrant-50 text-vibrant border border-vibrant-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {d.status}
                    </span>

                    <span className="text-charcoal-500 text-[11px]">
                      {d.settings?.difficulty} &bull; {d.settings?.style} &bull; {d.argument_count || d.settings?.argument_count || 5} Args
                    </span>

                    <span className="text-charcoal-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-charcoal-400" />
                      {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-charcoal group-hover:text-cobalt transition-colors leading-snug">
                    "{d.topic}"
                  </h3>

                  {d.interpretation && (
                    <p className="text-xs text-charcoal-600 line-clamp-1 italic font-sans">
                      {d.interpretation}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleRegenerate(d, e)}
                    className="p-2 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(d.id, e)}
                    disabled={deletingId === d.id}
                    className="p-2 rounded-sm bg-[#FAF8F3] hover:bg-vibrant-50 text-charcoal-500 hover:text-vibrant border border-[#252525]/15 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="pl-1">
                    <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-cobalt transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

