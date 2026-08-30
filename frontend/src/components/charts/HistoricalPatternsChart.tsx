import React from 'react';

interface HistoricalMetric {
  period: string;
  tenders: number;
  avgBids: number;
  overrideRatePct: number;
}

interface HistoricalPatternsChartProps {
  data?: HistoricalMetric[];
}

export const HistoricalPatternsChart: React.FC<HistoricalPatternsChartProps> = ({
  data = [
    { period: 'Q1 2026', tenders: 18, avgBids: 4.2, overrideRatePct: 5.5 },
    { period: 'Q2 2026', tenders: 24, avgBids: 4.8, overrideRatePct: 4.2 },
    { period: 'Q3 2026', tenders: 31, avgBids: 5.1, overrideRatePct: 3.2 },
    { period: 'Current', tenders: 12, avgBids: 5.4, overrideRatePct: 2.8 },
  ],
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">📈</span>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Historical Procurement Trends & Competition Index
          </h4>
        </div>
        <span className="text-[10px] text-slate-500">Longitudinal Analytics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {data.map((d) => (
          <div key={d.period} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-procure-400 font-bold block">{d.period}</span>
            <div className="text-sm font-black text-white">{d.tenders} <span className="text-[9px] font-normal text-slate-500">tenders</span></div>
            <div className="text-[10px] text-slate-400">
              Avg Bids: <strong className="text-slate-200">{d.avgBids.toFixed(1)}</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Override: <strong className="text-amber-400">{d.overrideRatePct}%</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
