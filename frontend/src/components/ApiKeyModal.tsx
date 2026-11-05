import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onKeysUpdated }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    try {
      setGeminiKey(localStorage.getItem('gemini_api_key') || '');
      setOpenaiKey(localStorage.getItem('openai_api_key') || '');
      setAnthropicKey(localStorage.getItem('anthropic_api_key') || '');
      setTavilyKey(localStorage.getItem('tavily_api_key') || '');
    } catch (e) {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Save to localStorage immediately so client engine can use it
    try {
      if (geminiKey.trim()) localStorage.setItem('gemini_api_key', geminiKey.trim());
      else localStorage.removeItem('gemini_api_key');
      if (openaiKey.trim()) localStorage.setItem('openai_api_key', openaiKey.trim());
      else localStorage.removeItem('openai_api_key');
      if (anthropicKey.trim()) localStorage.setItem('anthropic_api_key', anthropicKey.trim());
      else localStorage.removeItem('anthropic_api_key');
      if (tavilyKey.trim()) localStorage.setItem('tavily_api_key', tavilyKey.trim());
      else localStorage.removeItem('tavily_api_key');
    } catch (e) {}

    try {
      await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: geminiKey || undefined,
          openai_api_key: openaiKey || undefined,
          anthropic_api_key: anthropicKey || undefined,
          tavily_api_key: tavilyKey || undefined,
        }),
      });
    } catch (err: any) {
      // Backend offline / static hosting mode is completely normal
    }

    setMessage('Keys updated! Live AI reasoning active.');
    setSaving(false);
    if (onKeysUpdated) onKeysUpdated();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-7 shadow-editorial-hover space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#252525]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 flex items-center justify-center text-cobalt">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">
                AI Provider Credentials
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">Connect frontier LLMs for live, custom dialectical generation.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-charcoal-400 hover:text-charcoal hover:bg-[#252525]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-cobalt font-mono text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Gemini API Key (Recommended & Free)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cobalt hover:underline flex items-center gap-1 text-[10px] font-mono"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt font-mono text-xs"
            />
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-charcoal font-mono text-[11px] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-charcoal-500" />
                <span>OpenAI API Key (GPT-4o)</span>
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal-500 hover:text-charcoal flex items-center gap-1 text-[10px] font-mono hover:underline"
              >
                <span>OpenAI Keys</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full p-2.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt font-mono text-xs"
            />
          </div>

          {/* Anthropic Claude API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-charcoal font-mono text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-charcoal-500" />
                <span>Anthropic Claude API Key</span>
              </label>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal-500 hover:text-charcoal flex items-center gap-1 text-[10px] font-mono hover:underline"
              >
                <span>Anthropic Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full p-2.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt font-mono text-xs"
            />
          </div>

          {/* Tavily Web Search Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-charcoal font-mono text-[11px]">
                Tavily Search API Key (Optional)
              </label>
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal-500 hover:text-charcoal flex items-center gap-1 text-[10px] font-mono hover:underline"
              >
                <span>Tavily</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder="tvly-..."
              className="w-full p-2.5 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-charcoal placeholder-charcoal-400 focus:outline-none focus:border-cobalt font-mono text-xs"
            />
          </div>

          {message && (
            <div className="p-3 rounded-sm bg-cobalt-50 border border-cobalt-200 text-cobalt-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-cobalt shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#252525]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm bg-[#F6F3EA] hover:bg-stone-200 text-charcoal text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white text-xs font-semibold shadow-editorial transition-colors disabled:opacity-50"
            >
              {saving ? 'Updating Engine...' : 'Save & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

