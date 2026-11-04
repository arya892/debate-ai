import React, { useState } from 'react';
import { EvidenceItem } from '../types/debate';
import { CheckCircle2, AlertTriangle, MessageSquare, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  evidence: EvidenceItem;
  showDetails?: boolean;
}

export const EvidenceBadge: React.FC<Props> = ({ evidence, showDetails = false }) => {
  const [expanded, setExpanded] = useState(showDetails);

  const getBadgeConfig = () => {
    switch (evidence.status) {
      case 'verified':
        return {
          label: 'VERIFIED SOURCE',
          badgeClass: 'bg-cobalt-50 text-cobalt-700 border-cobalt-500/30 hover:border-cobalt-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-cobalt-600 shrink-0" />,
          dotClass: 'bg-cobalt-600',
          tooltip: 'Directly corroborated by an authoritative search source with HTTP 200 verification.',
        };
      case 'unverified':
        return {
          label: 'UNVERIFIED CLAIM',
          badgeClass: 'bg-vibrant-50 text-vibrant-700 border-vibrant-500/30 hover:border-vibrant-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-vibrant-600 shrink-0" />,
          dotClass: 'bg-vibrant-600',
          tooltip: 'Empirical claim without direct verified citation. Needs verification.',
        };
      case 'opinion':
        return {
          label: 'NORMATIVE OPINION',
          badgeClass: 'bg-[#F0EDE4] text-charcoal-700 border-charcoal/20 hover:border-charcoal/40',
          icon: <MessageSquare className="w-3.5 h-3.5 text-charcoal-600 shrink-0" />,
          dotClass: 'bg-charcoal-500',
          tooltip: 'Normative, ethical, or deductive reasoning — not a factual claim.',
        };
      case 'unavailable':
      default:
        return {
          label: 'DATA UNAVAILABLE',
          badgeClass: 'bg-stone-100 text-stone-700 border-stone-300 hover:border-stone-400',
          icon: <HelpCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />,
          dotClass: 'bg-stone-500',
          tooltip: 'Empirical data was sought but could not be reliably established.',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="my-2.5 text-xs font-sans">
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-sm border cursor-pointer select-none transition-colors duration-150 ${config.badgeClass}`}
        title={config.tooltip}
      >
        {config.icon}
        <span className="font-mono font-semibold tracking-wider text-[10px] uppercase">{config.label}</span>
        <span className="text-charcoal font-medium truncate max-w-sm sm:max-w-md">{evidence.claim}</span>
        {expanded ? <ChevronUp className="w-3 h-3 text-charcoal-500 ml-1" /> : <ChevronDown className="w-3 h-3 text-charcoal-500 ml-1" />}
      </div>

      {expanded && (
        <div className="mt-2 p-3.5 rounded-sm bg-white border border-[#252525]/15 text-charcoal space-y-2 text-xs shadow-editorial animate-in fade-in duration-150">
          <div className="font-semibold text-charcoal-900 leading-relaxed text-sm">{evidence.claim}</div>
          {evidence.explanation && (
            <p className="text-charcoal-600 text-xs leading-relaxed">{evidence.explanation}</p>
          )}

          {evidence.status === 'verified' && (
            <div className="pt-2 border-t border-[#252525]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-charcoal-600 font-mono">
              <div className="flex items-center gap-3">
                {evidence.publisher && (
                  <span>
                    Publisher: <strong className="text-charcoal-900 font-semibold">{evidence.publisher}</strong>
                  </span>
                )}
                {evidence.publication_date && (
                  <span>
                    Date: <strong className="text-charcoal-900 font-semibold">{evidence.publication_date}</strong>
                  </span>
                )}
              </div>

              {evidence.url && (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-cobalt-50 border border-cobalt-200 text-cobalt-700 hover:bg-cobalt-100 transition-colors"
                >
                  <span>{evidence.source_title || 'Inspect Source'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {evidence.status === 'unverified' && (
            <div className="pt-1.5 text-[11px] text-vibrant-700 flex items-center gap-1.5 font-medium font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Plausible empirical claim not corroborated by current index. Marked for audit.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

