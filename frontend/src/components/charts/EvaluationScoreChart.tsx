import React from 'react';

interface CriterionItem {
  name: string;
  weight: number;
  score: number;
  rating: string;
}

interface EvaluationScoreChartProps {
  companyName?: string;
  totalScore?: number;
  criteria?: CriterionItem[];
}

export const EvaluationScoreChart: React.FC<EvaluationScoreChartProps> = ({
  companyName = 'Alpha Enterprise Solutions Ltd',
  totalScore = 87.4,
  criteria = [
    { name: 'Price Score', weight: 40, score: 37.2, rating: 'Excellent' },
    { name: 'Technical Capability', weight: 20, score: 18.5, rating: 'Very Strong' },
    { name: 'Experience', weight: 15, score: 13.5, rating: 'Strong' },
    { name: 'Financial Capacity', weight: 10, score: 8.7, rating: 'Good' },
    { name: 'Past Performance', weight: 10, score: 8.5, rating: 'Excellent' },
    { name: 'Risk Indicators', weight: 5, score: 4.0, rating: 'Low' },
  ],
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">CRITERIA-LEVEL EVALUATION</span>
          <h4 className="font-bold text-slate-200 font-sans text-sm">{companyName}</h4>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase block">FINAL SCORE</span>
          <span className="text-base font-black text-emerald-400">{totalScore.toFixed(1)} / 100</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {criteria.map((c) => {
          const pct = Math.min(100, Math.max(0, (c.score / c.weight) * 100));

          return (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-300">{c.name} ({c.weight}%)</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{c.rating}</span>
                  <span className="font-bold text-slate-200">
                    {c.score.toFixed(1)} <span className="text-slate-500 font-normal">/ {c.weight}</span>
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full bg-gradient-to-r from-procure-500 to-indigo-400 rounded-full transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
