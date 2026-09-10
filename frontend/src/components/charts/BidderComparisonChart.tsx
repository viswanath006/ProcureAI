import React, { useState } from 'react';

interface BidderData {
  name: string;
  priceScore: number;
  techScore: number;
  compositeScore: number;
  rank: number;
  isAiRecommended?: boolean;
}

interface BidderComparisonChartProps {
  bidders?: BidderData[];
}

export const BidderComparisonChart: React.FC<BidderComparisonChartProps> = ({
  bidders = [
    { name: 'Alpha Enterprise Solutions Ltd', priceScore: 37.2, techScore: 18.5, compositeScore: 87.4, rank: 1, isAiRecommended: true },
    { name: 'Beta Cloudworks Pvt Ltd', priceScore: 39.8, techScore: 12.4, compositeScore: 72.1, rank: 2 },
    { name: 'Gamma National Technologies Corp', priceScore: 34.0, techScore: 16.8, compositeScore: 71.5, rank: 3 },
  ],
}) => {
  const [hoveredBidder, setHoveredBidder] = useState<string | null>(null);

  const maxScore = 100;

  return (
<<<<<<< HEAD
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Bidder Comparison Matrix (Multi-Factor Scoring)
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-400">Total Score (0–100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
            <span className="text-slate-400">Price (max 40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
            <span className="text-slate-400">Tech (max 20)</span>
=======
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            Bidder Comparison Matrix (Multi-Factor Scoring)
          </h4>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-gray-500 font-medium">Total Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-500 font-medium">Price (40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span className="text-gray-500 font-medium">Tech (20)</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* SVG Bar Visualizer */}
      <div className="space-y-3 pt-2">
=======
      {/* Bar Visualizer */}
      <div className="space-y-3">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
        {bidders.map((b) => {
          const isTop = b.rank === 1;

          return (
            <div
              key={b.name}
              onMouseEnter={() => setHoveredBidder(b.name)}
              onMouseLeave={() => setHoveredBidder(null)}
<<<<<<< HEAD
              className={`p-2.5 rounded-xl border transition-all ${
                isTop
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : hoveredBidder === b.name
                  ? 'border-blue-500/40 bg-slate-900'
                  : 'bg-slate-950/50 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-400">#{b.rank}</span>
                  <span className="font-bold text-slate-200 font-sans">{b.name}</span>
                  {b.isAiRecommended && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
=======
              className={`p-3.5 rounded-xl border transition-all ${
                isTop
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                  : hoveredBidder === b.name
                  ? 'border-gray-300 bg-white shadow-xs'
                  : 'bg-[#FBFBFD] border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-400 text-xs">#{b.rank}</span>
                  <span className="font-bold text-gray-900">{b.name}</span>
                  {b.isAiRecommended && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                      TOP AI REC
                    </span>
                  )}
                </div>
<<<<<<< HEAD
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    P: <strong className="text-blue-400">{b.priceScore.toFixed(1)}</strong>/40 · T: <strong className="text-purple-400">{b.techScore.toFixed(1)}</strong>/20
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    {b.compositeScore.toFixed(1)} <span className="text-[9px] text-slate-500 font-normal">pts</span>
=======
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">
                    Price: <strong className="text-blue-600 font-semibold">{b.priceScore.toFixed(1)}</strong>/40 · Tech: <strong className="text-purple-600 font-semibold">{b.techScore.toFixed(1)}</strong>/20
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {b.compositeScore.toFixed(1)} <span className="text-xs text-gray-400 font-normal">pts</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                  </span>
                </div>
              </div>

              {/* Progress Bar Stack */}
<<<<<<< HEAD
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80">
                <div
                  style={{ width: `${(b.compositeScore / maxScore) * 100}%` }}
                  className={`h-full transition-all rounded-full flex items-center justify-end pr-1 text-[8px] font-bold text-slate-950 ${
                    isTop ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-slate-600 to-slate-400'
=======
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex border border-gray-200/80">
                <div
                  style={{ width: `${(b.compositeScore / maxScore) * 100}%` }}
                  className={`h-full transition-all rounded-full ${
                    isTop ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-400'
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
