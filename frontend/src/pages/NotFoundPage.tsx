import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-24 p-8 rounded-sm bg-white border border-[#252525]/15 text-center space-y-4 shadow-editorial font-sans">
      <div className="w-12 h-12 rounded-sm bg-[#F6F3EA] border border-[#252525]/15 text-cobalt flex items-center justify-center mx-auto">
        <span className="font-bold text-xl">404</span>
      </div>
      <h2 className="text-2xl font-bold text-charcoal">Motion Not Found</h2>
      <p className="text-xs text-charcoal-500 leading-relaxed font-sans">
        The debate record or edition you requested could not be found in the current archive.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-cobalt hover:bg-cobalt-600 text-white text-xs font-semibold shadow-editorial transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Editions</span>
      </Link>
    </div>
  );
};

