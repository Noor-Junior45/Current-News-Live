import { Landmark } from 'lucide-react';

interface AdSpaceProps {
  type: 'leaderboard' | 'sidebar' | 'footer';
}

export default function AdSpace({ type }: AdSpaceProps) {
  let containerClasses = '';
  let label = '';
  let dimensions = '';

  switch (type) {
    case 'leaderboard':
      containerClasses = 'ad-leaderboard w-full h-[90px] bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center text-slate-400 p-2 my-6 transition-all select-none';
      label = 'Leaderboard Advertisement Space';
      dimensions = '728 × 90 px (Standard Billboard)';
      break;
    case 'sidebar':
      containerClasses = 'ad-sidebar w-full min-h-[300px] h-full bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center text-slate-400 p-4 transition-all select-none';
      label = 'Sidebar Advertisement Space';
      dimensions = '300 × 250 px / 300 × 600 px';
      break;
    case 'footer':
      containerClasses = 'ad-footer w-full h-[120px] bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center text-slate-400 p-3 my-8 transition-all select-none';
      label = 'Footer Advertisement Space';
      dimensions = '970 × 90 px / 728 × 90 px';
      break;
  }

  return (
    <div className={containerClasses} id={`ad-container-${type}`} aria-label={label}>
      <Landmark className="h-5 w-5 mb-1.5 text-slate-400" />
      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-[10px] font-mono text-slate-400 mt-0.5">{dimensions}</span>
    </div>
  );
}
