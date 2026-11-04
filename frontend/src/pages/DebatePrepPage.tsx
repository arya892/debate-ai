import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Mic, Copy, Check, Download, FileText, Sparkles, Swords,
  CheckSquare, Clock, RefreshCw, AlertTriangle, Play, Pause,
  RotateCcw, Type
} from 'lucide-react';
import { getDebate, getExportUrl } from '../api/client';
import { DebateRecord, DebatePrep } from '../types/debate';

export const DebatePrepPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [debate, setDebate] = useState<DebateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'FOR' | 'AGAINST'>('FOR');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Podium Timer feature
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [teleprompterSize, setTeleprompterSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDebate(id)
      .then((data) => {
        setDebate(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load prep materials');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cobalt mx-auto" />
        <p className="text-charcoal-600 text-sm font-mono tracking-wider">PREPARING PODIUM SPEECHES & DOSSIER...</p>
      </div>
    );
  }

  if (error || !debate || !debate.result) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-sm bg-white border border-[#252525]/15 text-center space-y-4 shadow-editorial">
        <AlertTriangle className="w-8 h-8 text-vibrant mx-auto" />
        <h3 className="text-xl font-bold text-charcoal">Dossier Incomplete</h3>
        <p className="text-xs text-charcoal-600 font-sans">{error || 'Prep data is incomplete.'}</p>
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
  const currentPrep: DebatePrep | undefined = activeSide === 'FOR' ? result.prep_for : result.prep_against;

  if (!currentPrep) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-sm bg-white border border-[#252525]/15 text-center space-y-4 shadow-editorial">
        <p className="text-charcoal-700 text-sm">Preparation materials are currently being prepared.</p>
      </div>
    );
  }

  const openingWords = currentPrep.opening_speech.trim().split(/\s+/).length;
  const closingWords = currentPrep.closing_speech.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen bg-[#F6F3EA] text-[#252525] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 font-sans">
        {/* Top Banner & Subnav */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal text-xs font-mono font-bold uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5 text-cobalt" />
                <span>PODIUM SPEECHES & PREPARATION DOSSIER</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-charcoal">
                Debate Preparation & Speeches
              </h1>
              <p className="text-xs text-charcoal-600 font-mono">
                Motion: <span className="font-semibold text-charcoal">"{topic}"</span>
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <Link
                to={`/debate/${debate.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cobalt" />
                <span>Arguments</span>
              </Link>

              <Link
                to={`/debate/${debate.id}/rebuttals`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
              >
                <Swords className="w-3.5 h-3.5 text-vibrant" />
                <span>Rebuttals</span>
              </Link>

              <a
                href={getExportUrl(debate.id, 'md')}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MD</span>
              </a>

              <a
                href={getExportUrl(debate.id, 'pdf')}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white font-semibold transition-colors shadow-editorial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>
            </div>
          </div>

          {/* Side Selector & Live Podium Stopwatch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#252525]/15">
            <div className="flex items-center gap-3">
              <span className="text-xs text-charcoal-600 font-mono font-bold uppercase">Active Bench:</span>
              <div className="flex bg-[#FAF8F3] p-1 rounded-sm border border-[#252525]/15 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSide('FOR')}
                  className={`px-3 py-1 rounded-sm transition-all ${
                    activeSide === 'FOR'
                      ? 'bg-cobalt text-white font-semibold'
                      : 'text-charcoal-600 hover:text-charcoal'
                  }`}
                >
                  PROPOSITION (FOR)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide('AGAINST')}
                  className={`px-3 py-1 rounded-sm transition-all ${
                    activeSide === 'AGAINST'
                      ? 'bg-vibrant text-white font-semibold'
                      : 'text-charcoal-600 hover:text-charcoal'
                  }`}
                >
                  OPPOSITION (AGAINST)
                </button>
              </div>
            </div>

            {/* Interactive Podium Stopwatch */}
            <div className="flex items-center gap-3 bg-[#FAF8F3] px-3 py-1 rounded-sm border border-[#252525]/15 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-charcoal font-mono">
                <Clock className="w-3.5 h-3.5 text-cobalt" />
                <span className="font-bold text-sm text-charcoal">{formatTime(timerSeconds)}</span>
                <span className="text-[10px] text-charcoal-500">/ {currentPrep.duration_minutes}:00</span>
              </div>

              <div className="flex items-center gap-1 border-l border-[#252525]/15 pl-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 rounded-sm bg-white hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
                  title={isTimerRunning ? 'Pause' : 'Start'}
                >
                  {isTimerRunning ? <Pause className="w-3 h-3 text-vibrant" /> : <Play className="w-3 h-3 text-cobalt" />}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="p-1 rounded-sm bg-white hover:bg-stone-200 text-charcoal border border-[#252525]/15 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <div className="border-l border-[#252525]/15 pl-2">
                <button
                  onClick={() => setTeleprompterSize(teleprompterSize === 'normal' ? 'large' : 'normal')}
                  className={`p-1 rounded-sm transition-colors border border-[#252525]/15 ${teleprompterSize === 'large' ? 'bg-cobalt text-white' : 'bg-white text-charcoal'}`}
                  title="Toggle Large Reading Font"
                >
                  <Type className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Speech Teleprompter Box */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-4">
          <div className="flex items-center justify-between border-b border-[#252525]/15 pb-3">
            <div className="space-y-0.5">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${activeSide === 'FOR' ? 'text-cobalt' : 'text-vibrant'}`}>
                {activeSide === 'FOR' ? 'PROPOSITION' : 'OPPOSITION'} BENCH &bull; OPENING ADDRESS
              </span>
              <h2 className="text-xl font-bold text-charcoal">
                Constructive Opening Speech
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-charcoal-500">
                {openingWords} words &bull; ~{(openingWords / 130).toFixed(1)} min
              </span>

              <button
                onClick={() => handleCopy(currentPrep.opening_speech, 'opening')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                {copiedKey === 'opening' ? <Check className="w-3.5 h-3.5 text-cobalt" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'opening' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10">
            <p className={`text-charcoal-900 leading-relaxed whitespace-pre-line ${
              teleprompterSize === 'large' ? 'text-lg sm:text-xl font-medium' : 'text-sm sm:text-base'
            }`}>
              {currentPrep.opening_speech}
            </p>
          </div>
        </div>

        {/* Closing Speech Teleprompter Box */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-4">
          <div className="flex items-center justify-between border-b border-[#252525]/15 pb-3">
            <div className="space-y-0.5">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${activeSide === 'FOR' ? 'text-cobalt' : 'text-vibrant'}`}>
                {activeSide === 'FOR' ? 'PROPOSITION' : 'OPPOSITION'} BENCH &bull; FINAL CLASH
              </span>
              <h2 className="text-xl font-bold text-charcoal">
                Closing Ballot Synthesis Speech
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-charcoal-500">
                {closingWords} words &bull; ~{(closingWords / 130).toFixed(1)} min
              </span>

              <button
                onClick={() => handleCopy(currentPrep.closing_speech, 'closing')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#FAF8F3] hover:bg-stone-200 border border-[#252525]/15 text-charcoal transition-colors"
              >
                {copiedKey === 'closing' ? <Check className="w-3.5 h-3.5 text-cobalt" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'closing' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10">
            <p className={`text-charcoal-900 leading-relaxed whitespace-pre-line ${
              teleprompterSize === 'large' ? 'text-lg sm:text-xl font-medium' : 'text-sm sm:text-base'
            }`}>
              {currentPrep.closing_speech}
            </p>
          </div>
        </div>

        {/* Cross-Examination Strategy (Questions to Ask & Questions to Expect) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Questions to Ask Opponents */}
          <div className="bg-white border border-[#252525]/15 rounded-sm p-6 shadow-editorial space-y-4">
            <div className="flex items-center justify-between border-b border-[#252525]/15 pb-3">
              <h3 className="text-base font-bold text-charcoal">
                Questions to Cross-Examine Opponents
              </h3>
              <span className="text-xs font-mono bg-cobalt-50 text-cobalt px-2 py-0.5 rounded-sm border border-cobalt-200">
                {currentPrep.cross_examination_questions.length} Questions
              </span>
            </div>

            <div className="space-y-3">
              {currentPrep.cross_examination_questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 text-xs text-charcoal-800 space-y-1 font-sans">
                  <span className="font-mono font-bold text-cobalt text-[10px] block">
                    CX QUESTION #{idx + 1}:
                  </span>
                  <p className="font-medium">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Questions & Suggested Rebuttals */}
          <div className="bg-white border border-[#252525]/15 rounded-sm p-6 shadow-editorial space-y-4">
            <div className="flex items-center justify-between border-b border-[#252525]/15 pb-3">
              <h3 className="text-base font-bold text-charcoal">
                Questions You May Face (with Answers)
              </h3>
              <span className="text-xs font-mono bg-vibrant-50 text-vibrant px-2 py-0.5 rounded-sm border border-vibrant-200">
                {currentPrep.expected_questions.length} Scenarios
              </span>
            </div>

            <div className="space-y-3">
              {currentPrep.expected_questions.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 text-xs space-y-1.5 font-sans">
                  <div className="font-semibold text-charcoal">
                    <span className="font-mono font-bold text-vibrant text-[10px] block">
                      DEFENSIVE INQUIRY #{idx + 1}:
                    </span>
                    {item.question}
                  </div>
                  <div className="text-charcoal-600 bg-white p-2.5 rounded-sm border border-[#252525]/10">
                    <span className="font-mono font-bold text-[10px] text-charcoal-500 block mb-0.5">
                      Suggested Turnaround:
                    </span>
                    {item.suggested_answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Podium Checklist */}
        {currentPrep.checklist && currentPrep.checklist.length > 0 && (
          <div className="bg-white border border-[#252525]/15 rounded-sm p-6 shadow-editorial space-y-4">
            <div className="flex items-center gap-2 border-b border-[#252525]/15 pb-3">
              <CheckSquare className="w-4 h-4 text-cobalt" />
              <h3 className="text-base font-bold text-charcoal">
                Editorial Podium Discipline & Speaker Checklist
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              {currentPrep.checklist.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-sm bg-[#FAF8F3] border border-[#252525]/10">
                  <span className="font-mono font-bold text-cobalt text-xs mt-0.5">
                    0{idx + 1}.
                  </span>
                  <span className="text-charcoal-800 leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

