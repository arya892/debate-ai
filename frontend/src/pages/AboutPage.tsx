import React from 'react';
import {
  ShieldCheck, AlertTriangle, MessageSquare, HelpCircle,
  Database, Search, Lock, Cpu, Globe, CheckCircle2, BookOpen
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F3EA] text-[#252525] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 font-sans">
        {/* Masthead */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-white border border-[#252525]/15 text-charcoal text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-cobalt" />
            <span>EDITORIAL INTEGRITY & AUDIT STANDARDS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-charcoal">
            Truth Grounding & Epistemic Verification
          </h1>
          <p className="text-sm sm:text-base text-charcoal-600 leading-relaxed max-w-2xl italic">
            Unlike conversational chatbots that invent statistics or fabricate citations, <strong>DEBATE AI</strong> enforces strict, multi-layer verification protocols inspired by high-stakes editorial journalism.
          </p>
        </div>

        {/* The 4 Strict Truth Labels */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-5">
          <div className="border-b border-[#252525]/15 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cobalt font-bold block">
              TAXONOMY
            </span>
            <h2 className="text-xl font-bold text-charcoal">
              The Four Standardized Evidence Labels
            </h2>
          </div>

          <p className="text-xs text-charcoal-600 leading-relaxed font-sans">
            Every statistic, study, quote, and assertion cited in a DEBATE AI dossier is categorized into exactly one of four audited classifications:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Verified */}
            <div className="p-4 rounded-sm bg-cobalt-50 border border-cobalt-200 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-cobalt font-mono font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-cobalt" />
                <span>Verified Status</span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed font-sans">
                Directly corroborated by indexed web sources. The backend verifies HTTP 2xx accessibility and extracts publisher metadata. The AI is forbidden from citing non-existent links.
              </p>
            </div>

            {/* Unverified */}
            <div className="p-4 rounded-sm bg-vibrant-50 border border-vibrant-200 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-vibrant font-mono font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-vibrant" />
                <span>Unverified Status</span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed font-sans">
                A plausible empirical claim or widely discussed data point without an immediate direct link verified during the retrieval pass. Marked with a visible orange notice.
              </p>
            </div>

            {/* Opinion */}
            <div className="p-4 rounded-sm bg-[#FAF8F3] border border-[#252525]/15 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-charcoal-800 font-mono font-bold text-xs uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-charcoal-600" />
                <span>Normative Reasoning</span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed font-sans">
                Ethical principles, deontological axioms, or deductive logic (such as bodily autonomy, distributive justice, or civic duty) that represent philosophies rather than empirical numbers.
              </p>
            </div>

            {/* Unavailable */}
            <div className="p-4 rounded-sm bg-stone-100 border border-stone-300 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-stone-700 font-mono font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-stone-500" />
                <span>Data Unavailable</span>
              </div>
              <p className="text-xs text-charcoal-800 leading-relaxed font-sans">
                Explicitly declared when longitudinal consensus or reliable metrics do not yet exist, preventing artificial certainty on emerging topics.
              </p>
            </div>
          </div>
        </div>

        {/* The 6-Stage Pipeline */}
        <div className="bg-white border border-[#252525]/15 rounded-sm p-6 sm:p-8 shadow-editorial space-y-5">
          <div className="border-b border-[#252525]/15 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cobalt font-bold block">
              ARCHITECTURE
            </span>
            <h2 className="text-xl font-bold text-charcoal">
              The 6-Stage Dialectical Dispatch Pipeline
            </h2>
          </div>

          <div className="space-y-3 text-xs text-charcoal-800 font-sans">
            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">01</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Topic Interpretation & De-Biasing</strong>
                Detects ambiguities, formalizes the motion, and provides alternative framings to avoid attacking weak strawmen.
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">02</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Time-Sensitivity Classification</strong>
                Determines whether the subject hinges on recent statutes, market rates, or ongoing events requiring fresh web indexing.
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">03</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Authoritative Source Retrieval</strong>
                Searches for peer-reviewed studies, government repositories, policy institutes, and established news outlets.
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">04</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Automated Link Verification (HTTP 2xx)</strong>
                The backend verifies that every cited link resolves with an active 200 HTTP response.
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">05</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Dialectical Cross-Clash Rebuttals</strong>
                Synthesizes the single strongest objection from the opposing bench and pairs it with an empirical turnaround.
              </div>
            </div>

            <div className="p-3.5 rounded-sm bg-[#FAF8F3] border border-[#252525]/10 flex items-start gap-3">
              <span className="font-mono text-cobalt font-bold text-sm shrink-0">06</span>
              <div>
                <strong className="text-charcoal block mb-0.5">Podium Speeches & Teleprompter Timing</strong>
                Computes spoken pace at 130 words-per-minute for constructive addresses and cross-examination crossfire.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

