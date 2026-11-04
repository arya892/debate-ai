import React from 'react';
import { SourceItem } from '../types/debate';
import { X, ExternalLink, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceItem[];
}

export const SourcesPanel: React.FC<Props> = ({ isOpen, onClose, sources }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-ivory-50 border-l border-[#252525]/15 h-full overflow-y-auto flex flex-col p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#252525]/15">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cobalt" />
            <h3 className="text-lg font-bold text-charcoal">
              Editorial Source Archive
            </h3>
            <span className="px-2 py-0.5 rounded-sm text-[11px] font-mono bg-white border border-[#252525]/15 text-charcoal-700">
              {sources.length} SOURCES
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-charcoal-500 hover:text-charcoal hover:bg-[#252525]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-charcoal-600 mt-3 mb-4 leading-relaxed font-sans">
          All factual citations, empirical statistics, and quotes are cross-referenced with this verified research ledger. The backend independently confirms HTTP 2xx accessibility.
        </p>

        {sources.length === 0 ? (
          <div className="my-auto text-center py-12 text-charcoal-500 text-sm">
            No external indexed sources were retrieved for this specific motion. Factual claims are marked as <span className="text-vibrant-600 font-semibold font-mono">unverified</span>.
          </div>
        ) : (
          <div className="space-y-3.5 flex-1">
            {sources.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-sm bg-white border border-[#252525]/15 space-y-2 text-xs shadow-editorial"
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-charcoal hover:text-cobalt transition-colors text-sm flex items-center gap-1.5 group"
                  >
                    <span className="line-clamp-2">{s.title || s.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-cobalt shrink-0" />
                  </a>

                  {s.verified ? (
                    <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-cobalt-50 text-cobalt-700 border border-cobalt-200 text-[10px] font-mono font-semibold">
                      <ShieldCheck className="w-3 h-3 text-cobalt" />
                      HTTP 200 OK
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-vibrant-50 text-vibrant-700 border border-vibrant-200 text-[10px] font-mono font-semibold">
                      <ShieldAlert className="w-3 h-3 text-vibrant" />
                      UNRESOLVED
                    </span>
                  )}
                </div>

                {s.snippet && (
                  <p className="text-charcoal-600 text-xs line-clamp-3 leading-relaxed bg-[#F6F3EA] p-2.5 rounded-sm border border-[#252525]/10 font-sans">
                    "{s.snippet}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1 font-mono">
                  <span>
                    Publisher: <strong className="text-charcoal-800">{s.publisher || 'Web Publication'}</strong>
                  </span>
                  {s.published_date && <span>Date: {s.published_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-[#252525]/15 mt-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-sm bg-[#252525] hover:bg-charcoal-700 text-white text-xs font-medium transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

