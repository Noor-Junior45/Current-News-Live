import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 border-t border-slate-800 text-[10px] sm:text-xs" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:gap-16">
          
          {/* Brand & Mission Column */}
          <div className="flex flex-col space-y-1.5 border-r border-slate-800/80 pr-4 sm:pr-8 lg:pr-16">
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 text-white">
              <img 
                src="https://i.imgur.com/gq2X5nE.jpeg" 
                alt="Current News Logo" 
                className="h-4.5 w-4.5 sm:h-6 sm:w-6 rounded-md object-cover border border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-bold text-[9px] sm:text-[11px] md:text-xs tracking-tight uppercase truncate">Current News</span>
            </Link>
            <p className="text-[8px] sm:text-[10px] text-slate-300 leading-tight">
              Serving public interest with transparent, accurate journalism.
            </p>
          </div>

          {/* Useful Reader Information & Nav */}
          <div className="flex flex-col space-y-1.5 pl-4 sm:pl-8 lg:pl-16">
            <h4 className="font-display font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider text-white">Resources</h4>
            <div className="flex flex-col space-y-1 text-[8px] sm:text-[10px]">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">Feed</Link>
              <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Portal</Link>
              <Link to="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-slate-300 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>

        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[8px] sm:text-[10px] text-slate-400">
          <p>© {currentYear} Current News.</p>
          <span className="mt-0.5 sm:mt-0 font-mono text-[7px] sm:text-[9px] text-slate-400">Autonomous Press Alliance</span>
        </div>
      </div>
    </footer>
  );
}
