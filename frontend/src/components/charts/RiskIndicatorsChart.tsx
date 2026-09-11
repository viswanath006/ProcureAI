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
    { bidder: 'Beta Cloudworks Pvt Ltd', priceDeviationPct: -42.0, anomalyScore: -0.22, riskTier: 'HIGH RISK', flagText: 'Unusually low bid price (-42%)' },
    { bidder: 'Gamma National Technologies Corp', priceDeviationPct: -1.0, anomalyScore: 0.03, riskTier: 'LOW RISK', flagText: 'Unusual pricing pattern' },
  ],
}) => {
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
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            Unusual Activity & Risk Alerts
          </h4>
        </div>
        <span className="text-xs text-gray-400 font-medium">Smart Risk Detection</span>
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
                Price vs Budget: <strong className={it.priceDeviationPct < -30 ? 'text-rose-600 font-semibold' : 'text-gray-700 font-medium'}>
                  {it.priceDeviationPct > 0 ? `+${it.priceDeviationPct}%` : `${it.priceDeviationPct}%`}
                </strong>
                {' · '}Risk Score: <strong className="text-gray-800 font-semibold text-xs">{it.anomalyScore.toFixed(2)}</strong>
              </div>
              {it.flagText && (
                <div className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5">
                  <span>⚠</span> {it.flagText}
                </div>
              )}
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border self-start sm:self-center uppercase tracking-wide ${getTierBadge(it.riskTier)}`}>
              {it.riskTier}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
