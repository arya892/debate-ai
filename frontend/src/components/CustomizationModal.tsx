import React from 'react';
import { DebateSettings, Difficulty, DebateStyle, ArgumentCount, DurationMinutes, SideFocus } from '../types/debate';
import { Sliders, Check, X, Globe, Layers, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: DebateSettings;
  onChange: (settings: DebateSettings) => void;
}

export const FORMAT_OPTIONS = [
  { id: 'Oxford Union', label: 'Oxford Union', desc: 'Formal parliamentary clash with proposition and opposition benches.' },
  { id: 'Parliamentary', label: 'Parliamentary', desc: 'Fast-paced, point-of-order debates focusing on policy feasibility.' },
  { id: 'Lincoln-Douglas', label: 'Lincoln-Douglas', desc: 'One-on-one values and philosophical framework debate.' },
  { id: 'Policy', label: 'Policy Debate', desc: 'Evidence-dense scrutiny of statutory implementation and second-order harms.' },
];

export const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'
];

export const CustomizationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onChange,
}) => {
  if (!isOpen) return null;

  const update = <K extends keyof DebateSettings>(key: K, value: DebateSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const currentFormat = settings.format || 'Oxford Union';
  const currentLanguage = settings.language || 'English';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-7 shadow-editorial-hover space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#252525]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 flex items-center justify-center text-cobalt">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">
                Editorial Parameters & Format
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">Configure debate conventions, difficulty, and scope.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-charcoal-400 hover:text-charcoal hover:bg-[#252525]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm font-sans">
          {/* Debate Format */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
              Debate Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => update('format', fmt.id)}
                  className={`p-2.5 text-left rounded-sm border transition-all ${
                    currentFormat === fmt.id
                      ? 'bg-cobalt-50 border-cobalt text-cobalt-900 shadow-sm'
                      : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-700 hover:border-charcoal-400'
                  }`}
                >
                  <div className="font-semibold text-xs">{fmt.label}</div>
                  <div className="text-[11px] text-charcoal-500 leading-tight mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
              Language
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => update('language', lang)}
                  className={`py-1.5 px-2 rounded-sm border text-xs font-mono text-center transition-all ${
                    currentLanguage === lang
                      ? 'bg-cobalt text-white border-cobalt font-semibold'
                      : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal hover:border-charcoal-400'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
              Difficulty & Complexity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => update('difficulty', level)}
                  className={`py-2 px-3 rounded-sm border text-xs font-mono transition-all ${
                    settings.difficulty === level
                      ? 'bg-cobalt-50 border-cobalt text-cobalt font-semibold'
                      : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-600 hover:border-charcoal-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
              Argumentation Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Simple', 'Academic', 'Persuasive'] as DebateStyle[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => update('style', st)}
                  className={`py-2 px-3 rounded-sm border text-xs font-mono transition-all ${
                    settings.style === st
                      ? 'bg-vibrant-50 border-vibrant text-vibrant-700 font-semibold'
                      : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-600 hover:border-charcoal-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Arguments Count & Speech Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
                Arguments Per Side
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 5, 7] as ArgumentCount[]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => update('argument_count', cnt)}
                    className={`py-1.5 px-2 rounded-sm border text-xs font-mono transition-all ${
                      settings.argument_count === cnt
                        ? 'bg-cobalt text-white border-cobalt font-semibold'
                        : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-600 hover:border-charcoal-400'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
                Speech Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 5, 10] as DurationMinutes[]).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => update('duration_minutes', dur)}
                    className={`py-1.5 px-2 rounded-sm border text-xs font-mono transition-all ${
                      settings.duration_minutes === dur
                        ? 'bg-cobalt text-white border-cobalt font-semibold'
                        : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-600 hover:border-charcoal-400'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Focus */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal mb-2">
              Coverage Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Both', 'FOR', 'AGAINST'] as SideFocus[]).map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => update('side_focus', focus)}
                  className={`py-2 px-3 rounded-sm border text-xs font-mono transition-all ${
                    settings.side_focus === focus
                      ? 'bg-charcoal text-white border-charcoal font-semibold'
                      : 'bg-[#FAF8F3] border-[#252525]/15 text-charcoal-600 hover:border-charcoal-400'
                  }`}
                >
                  {focus === 'Both' ? 'Both Sides' : focus === 'FOR' ? 'For the Motion' : 'Against the Motion'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#252525]/15 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white text-xs font-semibold shadow-editorial transition-colors"
          >
            Apply Editorial Parameters
          </button>
        </div>
      </div>
    </div>
  );
};

