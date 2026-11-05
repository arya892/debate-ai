import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download, RefreshCw, AlertTriangle, FileText,
  Copy, Check, ArrowRight, Swords, Mic, Sparkles, BookOpen
} from 'lucide-react';
import { getDebate, getExportUrl, regenerateDebate, connectDebateStream } from '../api/client';
import { DebateRecord, Argument } from '../types/debate';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { VerificationSummaryBar } from '../components/VerificationSummaryBar';
import { SourcesPanel } from '../components/SourcesPanel';
import { ProgressIndicator } from '../components/ProgressIndicator';

export const DebateResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [debate, setDebate] = useState<DebateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'FOR' | 'AGAINST'>('FOR');
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedArgId, setCopiedArgId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [currentStage, setCurrentStage] = useState('arguments');
  const [stageMessage, setStageMessage] = useState('Synthesizing symmetrical claims...');
  const [percent, setPercent] = useState(50);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDebate(id)
      .then((data) => {
        setDebate(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load debate');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id || !debate || debate.status === 'completed' || debate.status === 'failed') return;

    const cleanup = connectDebateStream(
      id,
      (event) => {
        if (event.stage) setCurrentStage(event.stage);
        if (event.message) setStageMessage(event.message);
        if (event.percent !== undefined) setPercent(event.percent);

        if (event.stage === 'complete' || event.percent === 100) {
          getDebate(id).then(setDebate).catch(() => null);
        } else if (event.stage === 'error') {
          setError(event.message || 'Debate generation encountered an issue');
        }
      },
      () => {
        getDebate(id).then(setDebate).catch(() => null);
      }
    );

    const poller = setInterval(async () => {
      try {
        const check = await getDebate(id);
        if (check.status === 'completed' || check.status === 'failed') {
          setDebate(check);
          clearInterval(poller);
        }
      } catch (e) {}
    }, 2500);

    return () => {
      cleanup();
      clearInterval(poller);
    };
  }, [id, debate?.status]);

  const handleRegenerate = async () => {
    if (!debate || regenerating) return;
    setRegenerating(true);
    try {
      const updated = await regenerateDebate(debate.id, debate.settings);
      setDebate(updated);
      setRegenerating(false);
    } catch (err: any) {
      alert(err.message || 'Regeneration failed');
      setRegenerating(false);
    }
  };

  const handleCopyArgument = (arg: Argument, side: 'FOR' | 'AGAINST') => {
    const text = `[${side === 'FOR' ? 'FOR THE MOTION' : 'AGAINST THE MOTION'}]\n${arg.claim}\n\nExplanation: ${arg.logical_explanation}\n\nExample: ${arg.real_world_example}`;
    navigator.clipboard.writeText(text);
    setCopiedArgId(arg.id);
    setTimeout(() => setCopiedArgId(null), 2000);
  };

  const handleExportMarkdown = () => {
    if (!debate?.result) return;
    const { for_side, against_side } = debate.result;
    let md = `# DEBATE DOSSIER: ${debate.topic}\n\n`;
    md += `## FOR THE MOTION (PROPOSITION)\n\n`;
    md += `### Opening Statement\n> ${for_side.opening_statement}\n\n`;
    for_side.arguments.forEach((a, i) => {
      md += `### Argument ${i + 1}: ${a.claim}\n${a.logical_explanation}\n\n**Example:** *${a.real_world_example}*\n\n`;
    });
    md += `### Closing Statement\n> ${for_side.concluding_statement}\n\n---\n\n`;
    md += `## AGAINST THE MOTION (OPPOSITION)\n\n`;
    md += `### Opening Statement\n> ${against_side.opening_statement}\n\n`;
    against_side.arguments.forEach((a, i) => {
      md += `### Argument ${i + 1}: ${a.claim}\n${a.logical_explanation}\n\n**Example:** *${a.real_world_example}*\n\n`;
    });
    md += `### Closing Statement\n> ${against_side.concluding_statement}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `debate-${debate.topic.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!debate.id.startsWith('deb_')) {
      window.open(getExportUrl(debate.id, 'pdf'), '_blank');
    } else {
      window.print();
    }
  };

  const handleCopyCompleteDebate = () => {
    if (!debate?.result) return;
    const { for_side, against_side } = debate.result;
    
    let text = `TOPIC: ${debate.topic}\n\n`;
    text += `--- FOR THE MOTION ---\n`;
    text += `Opening Statement:\n${for_side.opening_statement}\n\n`;
    for_side.arguments.forEach((a, i) => {
      text += `${i + 1}. ${a.claim}\n${a.logical_explanation}\nExample: ${a.real_world_example}\n\n`;
    });
    text += `Closing Statement:\n${for_side.concluding_statement}\n\n`;

    text += `--- AGAINST THE MOTION ---\n`;
    text += `Opening Statement:\n${against_side.opening_statement}\n\n`;
    against_side.arguments.forEach((a, i) => {
      text += `${i + 1}. ${a.claim}\n${a.logical_explanation}\nExample: ${a.real_world_example}\n\n`;
    });
    text += `Closing Statement:\n${against_side.concluding_statement}\n`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cobalt mx-auto" />
        <p className="text-charcoal-600 text-sm font-mono">Loading debate...</p>
      </div>
    );
  }

  if (error || !debate || !debate.result) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-sm bg-white border border-[#252525]/15 text-center space-y-4 shadow-editorial font-sans">
        <AlertTriangle className="w-8 h-8 text-vibrant mx-auto" />
        <h3 className="text-lg font-bold text-charcoal">Debate Unavailable</h3>
        <p className="text-xs text-charcoal-600">{error || 'Could not load debate data.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-sm bg-cobalt text-white text-xs font-semibold"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const { result, topic } = debate;
  const { for_side, against_side, verification_summary, sources } = result;

  const renderArgumentCard = (arg: Argument, side: 'FOR' | 'AGAINST', index: number) => {
    const isFor = side === 'FOR';
    const isCopied = copiedArgId === arg.id;

    return (
      <div
        key={arg.id || index}
        className={`p-5 rounded-sm bg-white border transition-all space-y-3 shadow-xs ${
          isFor ? 'border-cobalt/25 hover:border-cobalt' : 'border-vibrant/25 hover:border-vibrant'
        }`}
      >
        {/* Header: Argument # & Copy */}
        <div className="flex items-center justify-between border-b border-[#252525]/10 pb-2">
          <span className={`text-[11px] font-mono font-bold uppercase ${isFor ? 'text-cobalt' : 'text-vibrant'}`}>
            Argument {index + 1}
          </span>

          <button
            onClick={() => handleCopyArgument(arg, side)}
            className="flex items-center gap-1 text-[11px] font-mono text-charcoal-500 hover:text-charcoal transition-colors"
            title="Copy this argument"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-cobalt" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Claim */}
        <h4 className="text-base sm:text-lg font-bold text-charcoal leading-snug">
          {arg.claim}
        </h4>

        {/* Explanation */}
        <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
          {arg.logical_explanation}
        </p>

        {/* Real World Example */}
        {arg.real_world_example && (
          <div className="p-3 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 text-xs text-charcoal-800">
            "{arg.real_world_example}"
          </div>
        )}

        {/* Evidence badge */}
        {arg.evidence_items && arg.evidence_items.length > 0 && (
          <div className="pt-1">
            {arg.evidence_items.map((ev, i) => (
              <EvidenceBadge key={i} evidence={ev} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F3EA] text-[#252525] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 font-sans">
        {/* Clean Topic Header */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cobalt font-bold">
                DEBATE TOPIC
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal leading-tight">
                {topic}
              </h1>
            </div>

            {/* Clean Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono text-xs">
              <button
                onClick={handleCopyCompleteDebate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-cobalt" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MD</span>
              </button>

              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#FAF8F3] border border-[#252525]/15 text-charcoal transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Simple Sources Strip */}
          <VerificationSummaryBar
            summary={verification_summary}
            sourcesCount={sources?.length || 0}
            onOpenSources={() => setIsSourcesOpen(true)}
          />
        </div>

        {/* Clean View Tabs: Arguments | Rebuttals | Speeches */}
        <div className="flex items-center justify-between border-b border-[#252525]/15 pb-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Link
              to={`/debate/${debate.id}`}
              className="px-3.5 py-1.5 rounded-sm bg-charcoal text-white font-semibold shadow-xs"
            >
              1. Main Arguments
            </Link>

            <Link
              to={`/debate/${debate.id}/rebuttals`}
              className="px-3.5 py-1.5 rounded-sm bg-white hover:bg-[#FAF8F3] text-charcoal border border-[#252525]/15 transition-colors"
            >
              2. Rebuttals Arena
            </Link>

            <Link
              to={`/debate/${debate.id}/prep`}
              className="px-3.5 py-1.5 rounded-sm bg-white hover:bg-[#FAF8F3] text-charcoal border border-[#252525]/15 transition-colors"
            >
              3. Speeches & Questions
            </Link>
          </div>

          {/* Mobile Switcher */}
          <div className="flex sm:hidden bg-white p-1 rounded-sm border border-[#252525]/15 font-mono text-xs">
            <button
              onClick={() => setMobileTab('FOR')}
              className={`px-2.5 py-1 rounded-sm ${mobileTab === 'FOR' ? 'bg-cobalt text-white font-bold' : 'text-charcoal-600'}`}
            >
              FOR
            </button>
            <button
              onClick={() => setMobileTab('AGAINST')}
              className={`px-2.5 py-1 rounded-sm ${mobileTab === 'AGAINST' ? 'bg-vibrant text-white font-bold' : 'text-charcoal-600'}`}
            >
              AGAINST
            </button>
          </div>
        </div>

        {/* Clear 2-Column Debate Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* FOR THE MOTION (Cobalt Blue) */}
          <div className={`space-y-4 ${mobileTab === 'AGAINST' ? 'hidden sm:block' : ''}`}>
            {/* Column Header */}
            <div className="p-4 rounded-sm bg-white border-2 border-cobalt shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-cobalt flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-cobalt inline-block" />
                  <span>FOR THE MOTION</span>
                </span>
                <span className="text-xs font-mono text-charcoal-500 font-semibold">
                  {for_side.arguments.length} Arguments
                </span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed border-t border-cobalt/15 pt-2">
                "{for_side.opening_statement}"
              </p>
            </div>

            {/* Arguments List */}
            <div className="space-y-4">
              {for_side.arguments.map((arg, idx) => renderArgumentCard(arg, 'FOR', idx))}
            </div>

            {/* Closing Statement */}
            <div className="p-4 rounded-sm bg-white border border-cobalt/30 text-xs text-charcoal-800 leading-relaxed">
              <span className="font-bold text-[10px] text-cobalt uppercase block mb-1">
                Proposition Closing:
              </span>
              "{for_side.concluding_statement}"
            </div>
          </div>

          {/* AGAINST THE MOTION (Vibrant Orange) */}
          <div className={`space-y-4 ${mobileTab === 'FOR' ? 'hidden sm:block' : ''}`}>
            {/* Column Header */}
            <div className="p-4 rounded-sm bg-white border-2 border-vibrant shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-vibrant flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-vibrant inline-block" />
                  <span>AGAINST THE MOTION</span>
                </span>
                <span className="text-xs text-charcoal-500 font-semibold">
                  {against_side.arguments.length} Arguments
                </span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed border-t border-vibrant/15 pt-2">
                "{against_side.opening_statement}"
              </p>
            </div>

            {/* Arguments List */}
            <div className="space-y-4">
              {against_side.arguments.map((arg, idx) => renderArgumentCard(arg, 'AGAINST', idx))}
            </div>

            {/* Closing Statement */}
            <div className="p-4 rounded-sm bg-white border border-vibrant/30 text-xs text-charcoal-800 leading-relaxed">
              <span className="font-bold text-[10px] text-vibrant uppercase block mb-1">
                Opposition Closing:
              </span>
              "{against_side.concluding_statement}"
            </div>
          </div>
        </div>

        {/* Sources Slide-Over Drawer */}
        <SourcesPanel
          isOpen={isSourcesOpen}
          onClose={() => setIsSourcesOpen(false)}
          sources={sources || []}
        />
      </div>
    </div>
  );
};

