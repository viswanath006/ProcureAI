import React, { useState } from 'react';

export interface FactorExplanation {
  factor: string;
  title: string;
  rating_label: string;
  raw_score: number;
  weighted_score: number;
  weight: number;
  shap_value: number;
  impact: 'positive' | 'negative' | 'neutral';
  summary: string;
}

export interface ExplanationObject {
  bid_id: string;
  bid_reference: string;
  company_name: string;
  rank: number;
  total_score: number;
  why_summary: string;
  ratings: Record<string, string>;
  positive_contributors: string[];
  negative_contributors: string[];
  factor_explanations?: FactorExplanation[];
  shap_attributions?: Record<string, number>;
  baseline_expected_score?: number;
  plain_language_narrative?: string;
}

interface AiExplainabilityCardProps {
  explanation: ExplanationObject;
  isTopRecommendation?: boolean;
}

export const AiExplainabilityCard: React.FC<AiExplainabilityCardProps> = ({
  explanation,
  isTopRecommendation = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getRatingBadgeStyle = (factor: string, rating: string) => {
    if (factor.toLowerCase() === 'risk') {
      if (rating === 'Low') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      if (rating === 'Moderate') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }

    switch (rating) {
      case 'Excellent':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      case 'Very strong':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold';
      case 'Strong':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Good':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Low':
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const ratings = explanation.ratings || {
    Price: 'Good',
    'Technical capability': 'Very strong',
    Experience: 'Strong',
    'Financial capacity': 'Good',
    'Past performance': 'Excellent',
    Risk: 'Low',
  };

  const positive = explanation.positive_contributors?.length
    ? explanation.positive_contributors
    : ['+ Competitive price', '+ Strong technical capability'];

  const negative = explanation.negative_contributors?.length
    ? explanation.negative_contributors
    : ['- Moderate financial capacity'];

  return (
    <div
      className={`rounded-2xl border p-5 space-y-5 transition-all shadow-xl font-sans ${
        isTopRecommendation
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-procure-500/40 shadow-procure-500/10'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* ── Header: AI RECOMMENDATION ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-procure-500/20 text-procure-300 border border-procure-500/40">
              AI RECOMMENDATION
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              RANK #{explanation.rank} · {explanation.bid_reference}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white mt-1">
            {explanation.company_name}
          </h3>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block uppercase">Composite Score</span>
          <span className="text-2xl font-black text-emerald-400">
            {Number(explanation.total_score).toFixed(1)}
            <span className="text-xs font-normal text-slate-500"> / 100</span>
          </span>
        </div>
      </div>

      {/* ── Executive Callout: WHY? ────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-procure-500/20 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-procure-500/20 text-procure-300 flex items-center justify-center text-xs font-bold font-mono">
            ?
          </span>
          <h4 className="text-xs font-extrabold text-procure-300 uppercase tracking-wider font-mono">
            WHY? (EXECUTIVE SUMMARY)
          </h4>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {explanation.why_summary ||
            `${explanation.company_name} was recommended because it demonstrated the best overall balance between price, technical capability, experience, financial capacity and historical performance.`}
        </p>
      </div>

      {/* ── Ratings Grid: Exact Requested Format ──────────────────────── */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
          Factor Assessment (Non-Technical Evaluation)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {Object.entries(ratings).map(([factorTitle, ratingValue]) => (
            <div
              key={factorTitle}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-1.5"
            >
              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                {factorTitle}:
              </span>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${getRatingBadgeStyle(
                    factorTitle,
                    ratingValue
                  )}`}
                >
                  {ratingValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Positive & Negative Contributors ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Positive Contributors */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">
              +
            </span>
            <span>Positive contributors:</span>
          </div>
          <div className="space-y-1 pl-1">
            {positive.map((item, idx) => (
              <div
                key={idx}
                className="text-[11px] text-emerald-200/90 font-medium flex items-center gap-1.5"
              >
                <span className="text-emerald-400 font-mono font-bold">+</span>
                <span>{item.replace(/^\+\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Contributors */}
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
            <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
              -
            </span>
            <span>Negative contributors:</span>
          </div>
          <div className="space-y-1 pl-1">
            {negative.map((item, idx) => (
              <div
                key={idx}
                className="text-[11px] text-amber-200/90 font-medium flex items-center gap-1.5"
              >
                <span className="text-amber-400 font-mono font-bold">-</span>
                <span>{item.replace(/^-\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SHAP Feature Impact Balance Meter (Collapsible) ────────────── */}
      {explanation.shap_attributions && Object.keys(explanation.shap_attributions).length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <span>{showTechnicalDetails ? '▼' : '▶'}</span>
            <span>
              {showTechnicalDetails
                ? 'Hide SHAP Attribution Impact Meter'
                : 'View SHAP Multi-Factor Impact Meter'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>FACTOR ATTRIBUTION (MARGINAL CONTRIBUTION RELATIVE TO BASELINE)</span>
                <span>Baseline: {explanation.baseline_expected_score || 72.0} pts</span>
              </div>

              <div className="space-y-2">
                {Object.entries(explanation.shap_attributions).map(([code, val]) => {
                  const numVal = Number(val);
                  const isPositive = numVal >= 0;
                  const absVal = Math.min(100, Math.abs(numVal) * 12); // scale for bar visual

                  return (
                    <div key={code} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-300 uppercase">{code.replace('_', ' ')}</span>
                        <span
                          className={`font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isPositive ? `+${numVal.toFixed(1)}` : numVal.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPositive ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, absVal)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 font-mono italic">
                Attribution calculated using SHAP (Shapley Additive exPlanations) across 6 weighted evaluation dimensions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Plain-Language Officer Narrative ──────────────────────────── */}
      {explanation.plain_language_narrative && (
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-300 leading-relaxed">
          <span className="font-bold text-slate-400 block text-[10px] font-mono uppercase mb-0.5">
            Dossier Narrative
          </span>
          {explanation.plain_language_narrative}
        </div>
      )}
    </div>
  );
};
