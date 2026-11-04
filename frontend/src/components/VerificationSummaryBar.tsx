import React from 'react';
import { VerificationSummary } from '../types/debate';
import { CheckCircle2, AlertTriangle, MessageSquare, HelpCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface Props {
  summary: VerificationSummary;
  onOpenSources?: () => void;
  sourcesCount?: number;
}

export const VerificationSummaryBar: React.FC<Props> = ({
  summary,
  onOpenSources,
  sourcesCount = 0,
}) => {
  return (
    <div className="w-full bg-white border border-[#252525]/15 rounded-sm p-4 shadow-editorial">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 flex items-center justify-center text-charcoal shrink-0">
            <ShieldCheck className="w-4 h-4 text-cobalt" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
              EDITORIAL VERIFICATION LEDGER
            </div>
            <div className="text-[11px] text-charcoal-500 font-mono">
              Indexed {summary.retrieval_date} &bull; Engine: {summary.search_engine_used}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Verified */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-cobalt-50 border border-cobalt-200 text-cobalt-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-cobalt-600" />
            <span>{summary.verified_count} VERIFIED</span>
          </div>

          {/* Unverified */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-vibrant-50 border border-vibrant-200 text-vibrant-700 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-vibrant-600" />
            <span>{summary.unverified_count} UNVERIFIED</span>
          </div>

          {/* Opinion */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal-700 font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-charcoal-600" />
            <span>{summary.opinion_count} OPINION</span>
          </div>

          {/* Unavailable */}
          {summary.unavailable_count > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-stone-100 border border-stone-300 text-stone-700 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
              <span>{summary.unavailable_count} UNAVAILABLE</span>
            </div>
          )}

          {/* Sources button */}
          {onOpenSources && (
            <button
              onClick={onOpenSources}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#252525] hover:bg-charcoal-700 text-white text-xs font-medium font-sans transition-colors"
            >
              <span>Sources ({sourcesCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

