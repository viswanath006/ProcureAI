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
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            Past Tender Trends & Bidding Activity
          </h4>
        </div>
        <span className="text-xs text-gray-400 font-medium">Historical Data</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.map((d) => (
          <div key={d.period} className="p-4 rounded-xl bg-[#FBFBFD] border border-gray-200 space-y-1 hover:border-gray-300 transition-all">
            <span className="text-xs font-semibold text-blue-600 block">{d.period}</span>
            <div className="text-xl font-bold text-gray-900">
              {d.tenders} <span className="text-xs font-normal text-gray-500">tenders</span>
            </div>
            <div className="text-xs text-gray-500">
              Avg Bids: <strong className="text-gray-900 font-semibold">{d.avgBids.toFixed(1)}</strong>
            </div>
            <div className="text-xs text-gray-500">
              AI Overrides: <strong className="text-amber-600 font-semibold">{d.overrideRatePct}%</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
