import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { createDebate, connectDebateStream } from '../api/client';
import { DebateSettings } from '../types/debate';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ProgressIndicator } from '../components/ProgressIndicator';

const POPULAR_TOPICS = [
  'Artificial intelligence in healthcare improves diagnostic accuracy and equity',
  'Universal Basic Income should be established to offset automation',
  'Nuclear energy is indispensable for achieving net-zero emissions',
  'Social media algorithms should be regulated as public utilities',
  'Standardized testing should be abolished in university admissions',
  'Remote work permanently harms company culture and collaboration',
];

const DEFAULT_SETTINGS: DebateSettings = {
  difficulty: 'Intermediate',
  style: 'Academic',
  argument_count: 5,
  duration_minutes: 5,
  side_focus: 'Both',
  format: 'Oxford Union',
  language: 'English',
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [settings, setSettings] = useLocalStorage<DebateSettings>('debate_settings', DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress state
  const [currentStage, setCurrentStage] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [percent, setPercent] = useState(0);

  const charCount = topic.length;
  const isTooShort = topic.trim().length > 0 && topic.trim().length < 5;
  const isValid = topic.trim().length >= 5 && charCount <= 300;

  const updateSetting = <K extends keyof DebateSettings>(key: K, value: DebateSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    setCurrentStage('interpret');
    setStageMessage('Analyzing topic framing and perspectives...');
    setPercent(15);

    try {
      const debate = await createDebate(topic.trim(), settings);
      
      connectDebateStream(
        debate.id,
        (event) => {
          if (event.stage) setCurrentStage(event.stage);
          if (event.message) setStageMessage(event.message);
          if (event.percent !== undefined) setPercent(event.percent);

          if (event.stage === 'complete' || event.percent === 100) {
            setLoading(false);
            navigate(`/debate/${debate.id}`);
          } else if (event.stage === 'error') {
            setError(event.message || 'Generation failed');
            setLoading(false);
          }
        },
        () => {
          navigate(`/debate/${debate.id}`);
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start debate generation');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isValid && !loading) {
          handleGenerate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topic, settings, isValid, loading]);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F3EA] text-[#252525] py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Simple & Striking Editorial Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-charcoal leading-tight">
            Every argument deserves a{' '}
            <span className="text-cobalt">stronger perspective.</span>
          </h1>
          <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed">
            Explore both sides. Challenge assumptions. Build arguments that matter.
          </p>
        </div>

        {/* Main Simple Debate Box */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-6">
          {/* Topic Input Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Enter Debate Topic
              </label>
              <span className="text-xs text-charcoal-400">
                {charCount} / 300
              </span>
            </div>

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 300))}
              placeholder="e.g. Governments should establish a universal basic income to offset technological automation..."
              rows={3}
              disabled={loading}
              className="w-full p-4 rounded-sm bg-[#FAF8F3] border border-[#252525]/20 text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt focus:bg-white text-base leading-relaxed transition-all resize-none"
            />

            {isTooShort && (
              <p className="text-xs text-vibrant flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Please enter at least 5 characters.</span>
              </p>
            )}

            {error && (
              <div className="p-3 rounded-sm bg-rose-50 border border-rose-300 text-rose-800 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Simple Clean Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#252525]/10">
            {/* Number of Arguments */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-charcoal-500 block">
                Arguments Per Side
              </label>
              <div className="flex gap-1.5">
                {[3, 5, 7].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => updateSetting('argument_count', cnt as 3 | 5 | 7)}
                    className={`flex-1 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
                      settings.argument_count === cnt
                        ? 'bg-cobalt text-white border-cobalt font-semibold'
                        : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-charcoal-500 block">
                Difficulty
              </label>
              <div className="flex gap-1.5">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateSetting('difficulty', level)}
                    className={`flex-1 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
                      settings.difficulty === level
                        ? 'bg-cobalt text-white border-cobalt font-semibold'
                        : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {level.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-charcoal-500 block">
                Coverage
              </label>
              <div className="flex gap-1.5">
                {(['Both', 'FOR', 'AGAINST'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => updateSetting('side_focus', side)}
                    className={`flex-1 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
                      settings.side_focus === side
                        ? 'bg-charcoal text-white border-charcoal font-semibold'
                        : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {side === 'Both' ? 'Both' : side}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Big Bold Cobalt Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isValid || loading}
              className={`w-full py-3.5 rounded-sm text-sm font-semibold tracking-tight transition-all flex items-center justify-center gap-2 shadow-editorial ${
                !isValid || loading
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-cobalt hover:bg-cobalt-600 text-white cursor-pointer hover:shadow-editorial-solid'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Both Sides...</span>
                </>
              ) : (
                <>
                  <span>Generate Debate</span>
                  <CornerDownLeft className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Generation Progress Card */}
        {loading && (
          <ProgressIndicator
            currentStage={currentStage}
            stageMessage={stageMessage}
            percent={percent}
          />
        )}

        {/* Example Topics (Clean & Clickable) */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal-500">
            Or Click a Sample Topic to Begin:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {POPULAR_TOPICS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => setTopic(sample)}
                className="p-3 text-left rounded-sm bg-white hover:bg-[#FAF8F3] border border-[#252525]/15 hover:border-cobalt text-xs font-medium text-charcoal-800 transition-all shadow-xs flex items-center justify-between group"
              >
                <span className="line-clamp-2">"{sample}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-cobalt shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

