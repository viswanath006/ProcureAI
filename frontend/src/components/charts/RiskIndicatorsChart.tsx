import React from 'react';

interface RiskItem {
  bidder: string;
  priceDeviationPct: number;
  anomalyScore: number;
  riskTier: 'NORMAL' | 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  flagText?: string;
}

interface RiskIndicatorsChartProps {
  items?: RiskItem[];
}

export const RiskIndicatorsChart: React.FC<RiskIndicatorsChartProps> = ({
  items = [
    { bidder: 'Alpha Enterprise Solutions Ltd', priceDeviationPct: -8.0, anomalyScore: 0.12, riskTier: 'NORMAL' },
    { bidder: 'Beta Cloudworks Pvt Ltd', priceDeviationPct: -42.0, anomalyScore: -0.22, riskTier: 'HIGH RISK', flagText: 'Abnormal low dumping bid (-42%)' },
    { bidder: 'Gamma National Technologies Corp', priceDeviationPct: -1.0, anomalyScore: 0.03, riskTier: 'LOW RISK', flagText: 'Unusual pricing pattern' },
  ],
}) => {
<<<<<<< HEAD
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH RISK':
        return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      case 'MEDIUM RISK':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      case 'LOW RISK':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      default:
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
=======
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'HIGH RISK':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'MEDIUM RISK':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW RISK':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
>>>>>>> 4169a4f (Recreated professional README and organized assets)
    }
  };

  return (
<<<<<<< HEAD
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">🛡️</span>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Isolation Forest Anomaly & Risk Dispersion
          </h4>
        </div>
        <span className="text-[10px] text-slate-500">Unsupervised Outlier Ensemble</span>
      </div>

      <div className="space-y-2 pt-1">
        {items.map((it) => (
          <div
            key={it.bidder}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-slate-200 font-sans text-xs">{it.bidder}</div>
              <div className="text-[10px] text-slate-400">
                Budget Deviation: <strong className={it.priceDeviationPct < -30 ? 'text-rose-400' : 'text-slate-300'}>
                  {it.priceDeviationPct > 0 ? `+${it.priceDeviationPct}%` : `${it.priceDeviationPct}%`}
                </strong>
                {' · '}Anomaly Score: <strong className="text-procure-300">{it.anomalyScore.toFixed(2)}</strong>
              </div>
              {it.flagText && (
                <div className="text-[9px] text-rose-400">
                  ⚠ {it.flagText}
=======
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            Isolation Forest Anomaly & Risk Dispersion
          </h4>
        </div>
        <span className="text-xs text-gray-400 font-medium">Unsupervised Outlier Ensemble</span>
      </div>

      <div className="space-y-2.5">
        {items.map((it) => (
          <div
            key={it.bidder}
            className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              it.riskTier === 'HIGH RISK'
                ? 'bg-rose-50/30 border-rose-200'
                : 'bg-[#FBFBFD] border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="space-y-1">
              <div className="font-bold text-gray-900 text-xs">{it.bidder}</div>
              <div className="text-xs text-gray-500">
                Budget Deviation: <strong className={it.priceDeviationPct < -30 ? 'text-rose-600 font-semibold' : 'text-gray-700 font-medium'}>
                  {it.priceDeviationPct > 0 ? `+${it.priceDeviationPct}%` : `${it.priceDeviationPct}%`}
                </strong>
                {' · '}Anomaly Score: <strong className="text-gray-800 font-semibold text-xs">{it.anomalyScore.toFixed(2)}</strong>
              </div>
              {it.flagText && (
                <div className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5">
                  <span>⚠</span> {it.flagText}
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                </div>
              )}
            </div>

<<<<<<< HEAD
            <span className={`px-2 py-1 rounded text-[9px] font-bold border self-start sm:self-center ${getTierColor(it.riskTier)}`}>
=======
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border self-start sm:self-center uppercase tracking-wide ${getTierBadge(it.riskTier)}`}>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              {it.riskTier}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
