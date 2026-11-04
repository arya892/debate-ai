import React from 'react';
import { CheckCircle2, CircleDashed, Search, Sparkles, ShieldCheck, Swords, Mic } from 'lucide-react';

interface Props {
  currentStage: string;
  stageMessage: string;
  percent: number;
}

const STAGES = [
  { key: 'interpret', label: '01 // Framing Analysis', icon: Sparkles },
  { key: 'research', label: '02 // Source Retrieval', icon: Search },
  { key: 'arguments', label: '03 // Thesis Synthesis', icon: Sparkles },
  { key: 'verify', label: '04 // Fact Verification', icon: ShieldCheck },
  { key: 'rebuttals', label: '05 // Dialectical Rebuttals', icon: Swords },
  { key: 'prep', label: '06 // Speech Drafting', icon: Mic },
];

export const ProgressIndicator: React.FC<Props> = ({ currentStage, stageMessage, percent }) => {
  const getStageIndex = (stageKey: string) => {
    return STAGES.findIndex((s) => s.key === stageKey);
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-sm bg-white border border-[#252525]/15 shadow-editorial">
      <div className="text-center space-y-2 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-cobalt font-semibold">
          ISSUE IN PROGRESS &bull; DISPATCH ACTIVE
        </div>
        <h3 className="text-xl font-bold text-charcoal">
          Compiling Editorial Dossier
        </h3>
        <p className="text-xs text-charcoal-600 font-mono">
          {stageMessage || 'Synthesizing verified evidence and balanced perspectives...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F6F3EA] rounded-none h-1.5 mb-6 overflow-hidden border border-[#252525]/15">
        <div
          className="bg-cobalt h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, percent)}%` }}
        />
      </div>

      {/* Stage Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {STAGES.map((s, idx) => {
          const isDone = currentIndex > idx || percent >= 100;
          const isCurrent = currentIndex === idx && percent < 100;
          const Icon = s.icon;

          return (
            <div
              key={s.key}
              className={`p-2.5 rounded-sm border transition-all text-xs flex items-center gap-2 font-mono ${
                isDone
                  ? 'bg-cobalt-50 border-cobalt-200 text-cobalt-700'
                  : isCurrent
                  ? 'bg-white border-cobalt text-cobalt-900 shadow-sm'
                  : 'bg-[#F6F3EA] border-[#252525]/10 text-charcoal-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-cobalt shrink-0" />
              ) : isCurrent ? (
                <CircleDashed className="w-3.5 h-3.5 text-cobalt animate-spin shrink-0" />
              ) : (
                <Icon className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
              )}
              <span className="font-medium truncate text-[11px]">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

