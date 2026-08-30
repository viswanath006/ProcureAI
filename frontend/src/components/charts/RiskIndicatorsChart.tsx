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
    }
  };

  return (
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
                </div>
              )}
            </div>

            <span className={`px-2 py-1 rounded text-[9px] font-bold border self-start sm:self-center ${getTierColor(it.riskTier)}`}>
              {it.riskTier}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
