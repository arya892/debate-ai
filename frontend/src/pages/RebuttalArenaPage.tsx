import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Swords, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, Mic, RefreshCw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { getDebate } from '../api/client';
import { DebateRecord, RebuttalItem } from '../types/debate';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const RebuttalArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [debate, setDebate] = useState<DebateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideFilter, setSideFilter] = useState<'Both' | 'FOR' | 'AGAINST'>('Both');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDebate(id)
      .then((data) => {
        setDebate(data);
        const initialExpanded: Record<string, boolean> = {};
        if (data.result?.for_rebuttals) {
          data.result.for_rebuttals.forEach((r, idx) => {
            if (idx < 2) initialExpanded[r.argument_id] = true;
          });
        }
        if (data.result?.against_rebuttals) {
          data.result.against_rebuttals.forEach((r, idx) => {
            if (idx < 2) initialExpanded[r.argument_id] = true;
          });
        }
        setExpandedIds(initialExpanded);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load rebuttals');
        setLoading(false);
      });
  }, [id]);

  const toggleExpand = (argId: string) => {
    setExpandedIds((prev) => ({ ...prev, [argId]: !prev[argId] }));
  };

  const expandAll = (expand: boolean) => {
    if (!debate?.result) return;
    const next: Record<string, boolean> = {};
    const all = [...(debate.result.for_rebuttals || []), ...(debate.result.against_rebuttals || [])];
    all.forEach((r) => {
      next[r.argument_id] = expand;
    });
    setExpandedIds(next);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cobalt mx-auto" />
        <p className="text-charcoal-600 text-sm font-mono tracking-wider">CALIBRATING REBUTTAL CLASH ARENA...</p>
      </div>
    );
  }

  if (error || !debate || !debate.result) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-sm bg-white border border-[#252525]/15 text-center space-y-4 shadow-editorial">
        <AlertTriangle className="w-8 h-8 text-vibrant mx-auto" />
        <h3 className="text-xl font-bold text-charcoal">Rebuttals Unavailable</h3>
        <p className="text-xs text-charcoal-600 font-sans">{error || 'Rebuttal data could not be retrieved.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-sm bg-[#252525] text-white text-xs font-mono font-medium hover:bg-charcoal-700 transition-colors"
        >
          Return to Editions
        </Link>
      </div>
    );
  }

  const { result, topic } = debate;
  const { for_rebuttals = [], against_rebuttals = [] } = result;

  const renderRebuttalCard = (r: RebuttalItem, side: 'FOR' | 'AGAINST', index: number) => {
    const isExpanded = !!expandedIds[r.argument_id];
    const isFor = side === 'FOR';

    return (
      <div
        key={r.argument_id || index}
        className={`rounded-sm bg-white border transition-all duration-150 overflow-hidden shadow-editorial ${
          isFor
            ? 'border-cobalt/30 hover:border-cobalt'
            : 'border-vibrant/30 hover:border-vibrant'
        }`}
      >
        {/* Accordion Trigger */}
        <div
          onClick={() => toggleExpand(r.argument_id)}
          className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#FAF8F3] select-none transition-colors"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 font-mono">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                  isFor
                    ? 'bg-cobalt-50 text-cobalt border border-cobalt-200'
                    : 'bg-vibrant-50 text-vibrant border border-vibrant-200'
                }`}
              >
                Defending {isFor ? 'Proposition' : 'Opposition'} #{index + 1}
              </span>
              <span className="text-xs text-charcoal-500 font-medium line-clamp-1">
                "{r.original_claim}"
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-charcoal flex items-start gap-2.5 leading-snug">
              <span className={`font-mono text-xs uppercase tracking-wider shrink-0 mt-1 font-bold ${isFor ? 'text-vibrant' : 'text-cobalt'}`}>
                Clash Attack:
              </span>
              <span>{r.counter_challenge}</span>
            </h4>
          </div>

          <button
            type="button"
            className="p-1 rounded-sm text-charcoal-400 hover:text-charcoal bg-[#F6F3EA] border border-[#252525]/15 shrink-0 mt-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Drawer */}
        {isExpanded && (
          <div className="px-6 pb-6 pt-3 border-t border-[#252525]/10 space-y-4 text-xs font-sans animate-in fade-in duration-150">
            {/* The Counter Challenge */}
            <div className="p-4 rounded-sm bg-vibrant-50 border border-vibrant/20 space-y-1.5">
              <div className="flex items-center gap-2 text-vibrant font-mono font-bold text-xs uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5" />
                <span>Opposing Challenge & Critique</span>
              </div>
              <p className="text-charcoal-800 text-sm leading-relaxed font-sans">
                "{r.counter_challenge}"
              </p>
            </div>

            {/* Turnaround / Logical Response */}
            <div className="p-4 rounded-sm bg-cobalt-50 border border-cobalt/20 space-y-2">
              <div className="flex items-center gap-2 text-cobalt font-mono font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dialectical Defense & Structural Turnaround</span>
              </div>
              <p className="text-charcoal-800 text-sm leading-relaxed font-sans">
                {r.logical_response}
              </p>
            </div>

            {/* Supporting Evidence Item */}
            {r.supporting_evidence && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-charcoal-500 block">
                  Grounding Evidence for Turnaround:
                </span>
                <EvidenceBadge evidence={r.supporting_evidence} showDetails />
              </div>
            )}

            {/* Vulnerability / Weak Point Note */}
            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/15 flex items-start gap-3 text-charcoal-700">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-vibrant" />
              <div className="space-y-0.5 font-sans">
                <span className="font-mono font-bold text-[11px] uppercase tracking-wider block text-charcoal">
                  Vulnerability Analysis (Where the original argument remains exposed):
                </span>
                <p className="text-charcoal-600 text-xs leading-relaxed">
                  {r.weak_point}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F3EA] text-[#252525] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 font-sans">
        {/* Header & Subnav */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal text-xs font-mono font-bold uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5 text-vibrant" />
                <span>CROSS-EXAMINATION & REBUTTAL CLASH ARENA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-charcoal">
                Dialectical Counter-Challenges
              </h1>
              <p className="text-xs text-charcoal-600 font-mono">
                Motion: <span className="font-semibold text-charcoal">"{topic}"</span>
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => expandAll(true)}
                className="px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => expandAll(false)}
                className="px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Editorial Swiss Subnav */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#252525]/10 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Link
                to={`/debate/${debate.id}`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cobalt" />
                <span>Dual Perspectives</span>
              </Link>

              <Link
                to={`/debate/${debate.id}/rebuttals`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-charcoal text-white font-semibold shadow-sm"
              >
                <Swords className="w-3.5 h-3.5 text-vibrant" />
                <span>Rebuttal Arena</span>
              </Link>

              <Link
                to={`/debate/${debate.id}/prep`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-cobalt" />
                <span>Speeches & Prep</span>
              </Link>
            </div>

            {/* Side Filter */}
            <div className="flex items-center bg-[#FAF8F3] p-0.5 rounded-sm border border-[#252525]/15 text-xs font-mono">
              <button
                onClick={() => setSideFilter('Both')}
                className={`px-3 py-1 rounded-sm ${
                  sideFilter === 'Both' ? 'bg-charcoal text-white font-semibold' : 'text-charcoal-600'
                }`}
              >
                Both Sides
              </button>
              <button
                onClick={() => setSideFilter('FOR')}
                className={`px-3 py-1 rounded-sm ${
                  sideFilter === 'FOR' ? 'bg-cobalt text-white font-semibold' : 'text-charcoal-600'
                }`}
              >
                Proposition ({for_rebuttals.length})
              </button>
              <button
                onClick={() => setSideFilter('AGAINST')}
                className={`px-3 py-1 rounded-sm ${
                  sideFilter === 'AGAINST' ? 'bg-vibrant text-white font-semibold' : 'text-charcoal-600'
                }`}
              >
                Opposition ({against_rebuttals.length})
              </button>
            </div>
          </div>
        </div>

        {/* Rebuttal Cards */}
        <div className="space-y-6">
          {(sideFilter === 'Both' || sideFilter === 'FOR') && for_rebuttals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-cobalt pb-2 font-mono">
                <span className="w-2.5 h-2.5 bg-cobalt inline-block" />
                <h2 className="text-xs uppercase tracking-widest text-cobalt font-bold">
                  Defending Proposition Arguments (Counter-Response to Opposition)
                </h2>
              </div>
              <div className="space-y-4">
                {for_rebuttals.map((r, idx) => renderRebuttalCard(r, 'FOR', idx))}
              </div>
            </div>
          )}

          {(sideFilter === 'Both' || sideFilter === 'AGAINST') && against_rebuttals.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 border-b-2 border-vibrant pb-2 font-mono">
                <span className="w-2.5 h-2.5 bg-vibrant inline-block" />
                <h2 className="text-xs uppercase tracking-widest text-vibrant font-bold">
                  Defending Opposition Arguments (Counter-Response to Proposition)
                </h2>
              </div>
              <div className="space-y-4">
                {against_rebuttals.map((r, idx) => renderRebuttalCard(r, 'AGAINST', idx))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

