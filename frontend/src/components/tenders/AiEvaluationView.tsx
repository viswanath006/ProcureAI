import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { AiExplainabilityCard, ExplanationObject } from './AiExplainabilityCard';

interface AiEvaluationViewProps {
  tenderId: string;
  tenderStatus: string;
  onEvaluationComplete?: () => void;
}

export interface WeightsState {
  price: number;
  technical: number;
  experience: number;
  financial: number;
  past_performance: number;
  risk: number;
}

const DEFAULT_WEIGHTS: WeightsState = {
  price: 40,
  technical: 20,
  experience: 15,
  financial: 10,
  past_performance: 10,
  risk: 5,
};

export const AiEvaluationView: React.FC<AiEvaluationViewProps> = ({
  tenderId,
  tenderStatus,
  onEvaluationComplete,
}) => {
  const { user } = useAuth();
  const [weights, setWeights] = useState<WeightsState>(DEFAULT_WEIGHTS);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [evaluationData, setEvaluationData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOfficerOrAdmin = ['GOVT_OFFICER', 'ADMIN'].includes(user?.role_code || '');

  const totalWeight = Math.round(
    (weights.price +
      weights.technical +
      weights.experience +
      weights.financial +
      weights.past_performance +
      weights.risk) *
      100
  ) / 100;
  const isWeightValid = Math.abs(totalWeight - 100) < 0.05;

  const loadRecommendations = async () => {
    setIsFetching(true);
    setError(null);
    const res = await api.getAiRecommendations(tenderId);
    if (res.success && res.data) {
      setEvaluationData(res.data);
      if (res.data.weights) {
        setWeights({
          price: Number(res.data.weights.price ?? 40),
          technical: Number(res.data.weights.technical ?? 20),
          experience: Number(res.data.weights.experience ?? 15),
          financial: Number(res.data.weights.financial ?? 10),
          past_performance: Number(res.data.weights.past_performance ?? 10),
          risk: Number(res.data.weights.risk ?? 5),
        });
      }
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (tenderId) {
      loadRecommendations();
    }
  }, [tenderId]);

  const handleRunEvaluation = async () => {
    if (!isWeightValid) {
      setError(`Weights must sum to exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.startEvaluation(tenderId, weights);
    setIsLoading(false);
    if (res.success) {
      setSuccess('AI Multi-Factor Evaluation completed successfully!');
      loadRecommendations();
      if (onEvaluationComplete) onEvaluationComplete();
    } else {
      setError(res.error?.message || 'Failed to execute AI evaluation');
    }
  };

  const handleRunSyntheticBenchmark = async () => {
    if (!isWeightValid) {
      setError(`Weights must sum to exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.runSyntheticBenchmarkDemo(tenderId, weights);
    setIsLoading(false);
    if (res.success) {
      setSuccess('Synthetic Benchmark demonstration evaluated successfully!');
      loadRecommendations();
      if (onEvaluationComplete) onEvaluationComplete();
    } else {
      setError(res.error?.message || 'Failed to run synthetic benchmark demo');
    }
  };

  const setPreset = (preset: 'default' | 'tech' | 'cost') => {
    if (preset === 'default') setWeights(DEFAULT_WEIGHTS);
    else if (preset === 'tech') {
      setWeights({ price: 25, technical: 35, experience: 15, financial: 10, past_performance: 10, risk: 5 });
    } else if (preset === 'cost') {
      setWeights({ price: 50, technical: 15, experience: 15, financial: 10, past_performance: 5, risk: 5 });
    }
  };

  const recommendations = evaluationData?.recommendations || [];
  const topRec = recommendations[0];
  const [expandedXaiBidId, setExpandedXaiBidId] = useState<string | null>(null);

  const buildExplanationObject = (r: any): ExplanationObject => {
    if (r.explanation_object && Object.keys(r.explanation_object).length > 0) {
      return r.explanation_object as ExplanationObject;
    }

    const crits = r.criterion_breakdown || {};
    const mapRating = (val: number, isRisk = false) => {
      if (isRisk) {
        if (val >= 90) return 'Low';
        if (val >= 75) return 'Moderate';
        return 'Elevated';
      }
      if (val >= 90) return 'Excellent';
      if (val >= 80) return 'Very strong';
      if (val >= 70) return 'Strong';
      if (val >= 60) return 'Good';
      if (val >= 50) return 'Moderate';
      return 'Low';
    };

    return {
      bid_id: r.bid_id,
      bid_reference: r.bid_reference || 'BID-REF',
      company_name: r.company_name || 'Bidder Entity',
      rank: r.rank || 1,
      total_score: Number(r.total_score || 0),
      why_summary:
        r.reasoning_summary ||
        `${r.company_name} was recommended based on multidimensional scoring across commercial price, technical capability, and delivery safety.`,
      ratings: {
        Price: mapRating(crits.price?.raw_score ?? 75),
        'Technical capability': mapRating(crits.technical?.raw_score ?? 75),
        Experience: mapRating(crits.experience?.raw_score ?? 75),
        'Financial capacity': mapRating(crits.financial?.raw_score ?? 75),
        'Past performance': mapRating(crits.past_performance?.raw_score ?? 75),
        Risk: mapRating(crits.risk?.raw_score ?? 85, true),
      },
      positive_contributors: r.key_strengths?.map((s: string) => `+ ${s}`) || ['+ Competitive proposal'],
      negative_contributors: r.concerns?.map((c: string) => `- ${c}`) || ['- Market competition margin'],
      baseline_expected_score: 72.0,
      plain_language_narrative: r.reasoning_summary,
    };
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* ── Status & Notification Banners ───────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2.5 animate-fadeIn">
          <span className="text-base">⚠️</span>
          <div className="flex-1">
            <span className="font-semibold block">Evaluation Notice</span>
            <p className="text-[11px] opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
          <span className="text-base">✓</span>
          <div className="flex-1">
            <span className="font-semibold block">Execution Successful</span>
            <p className="text-[11px] opacity-90">{success}</p>
          </div>
        </div>
      )}

      {/* ── Top Header Controls & Weights Summary ────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="text-procure-400">🤖</span> Multi-Criteria Evaluation Engine
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-procure-500/20 text-procure-300 border border-procure-500/30">
                PHASE 7
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                {tenderStatus}
              </span>
              {isFetching && (
                <span className="text-[10px] text-slate-500 font-mono animate-pulse">
                  (Refreshing...)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Normalizes pricing, technical proposals, experience, and risk metrics to a common 0–100 scale.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <span>⚙️</span> {showConfig ? 'Hide Weights Config' : 'Configure Weights'}
            </button>

            {isOfficerOrAdmin && (
              <>
                <button
                  onClick={handleRunSyntheticBenchmark}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                  title="Demonstrate evaluation using 3 synthetic bidder personas"
                >
                  <span>🧪</span> Synthetic Demo
                </button>

                <button
                  onClick={handleRunEvaluation}
                  disabled={isLoading || !isWeightValid}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all shadow-lg shadow-procure-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Run AI Evaluation
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Weights Summary Pill Badges ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-[10px]">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">PRICE SCORE</span>
            <span className="font-bold text-procure-300 text-xs">{weights.price}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">TECHNICAL</span>
            <span className="font-bold text-indigo-300 text-xs">{weights.technical}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">EXPERIENCE</span>
            <span className="font-bold text-blue-300 text-xs">{weights.experience}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">FINANCIAL</span>
            <span className="font-bold text-emerald-300 text-xs">{weights.financial}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">PERFORMANCE</span>
            <span className="font-bold text-teal-300 text-xs">{weights.past_performance}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">RISK FACTOR</span>
            <span className="font-bold text-amber-300 text-xs">{weights.risk}%</span>
          </div>
        </div>

        {/* ── Interactive Weights Configurator (Collapsible) ─────────────── */}
        {showConfig && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-procure-500/30 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">Custom Weighted Criteria Configuration</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Presets:</span>
                <button
                  onClick={() => setPreset('default')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Default (40/20/15/10/10/5)
                </button>
                <button
                  onClick={() => setPreset('tech')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  High-Tech (25/35/15)
                </button>
                <button
                  onClick={() => setPreset('cost')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Cost-Focus (50/15/15)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Factor 1: Price */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Price Score:</span>
                  <span className="font-bold text-procure-300">{weights.price}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.price}
                  onChange={(e) => setWeights({ ...weights, price: Number(e.target.value) })}
                  className="w-full accent-procure-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Factor 2: Technical */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Technical Capability:</span>
                  <span className="font-bold text-indigo-300">{weights.technical}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.technical}
                  onChange={(e) => setWeights({ ...weights, technical: Number(e.target.value) })}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Factor 3: Experience */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Experience:</span>
                  <span className="font-bold text-blue-300">{weights.experience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.experience}
                  onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Factor 4: Financial */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Financial Capacity:</span>
                  <span className="font-bold text-emerald-300">{weights.financial}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.financial}
                  onChange={(e) => setWeights({ ...weights, financial: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Factor 5: Past Performance */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Past Performance:</span>
                  <span className="font-bold text-teal-300">{weights.past_performance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.past_performance}
                  onChange={(e) => setWeights({ ...weights, past_performance: Number(e.target.value) })}
                  className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Factor 6: Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Risk Indicators:</span>
                  <span className="font-bold text-amber-300">{weights.risk}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.risk}
                  onChange={(e) => setWeights({ ...weights, risk: Number(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Sum validation status */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span>Total Weight:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    isWeightValid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {totalWeight}% {isWeightValid ? '✓ Valid (Sum = 100%)' : '⚠ Must Equal 100%'}
                </span>
              </div>

              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                Reset to Standard Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Recommendation & Explainable AI (XAI) Hero ──────────────── */}
      {topRec && (
        <AiExplainabilityCard
          explanation={buildExplanationObject(topRec)}
          isTopRecommendation={true}
        />
      )}

      {/* ── Bidders Leaderboard & Detailed Breakdowns ─────────────────────── */}
      {recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-xl">
            📊
          </div>
          <h4 className="text-sm font-bold text-slate-200">No Evaluation Dossier Recorded</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run the AI Evaluation on submitted eligible bids, or launch the{' '}
            <strong className="text-indigo-400">Synthetic Benchmark Demo</strong> to test multi-factor weighted scoring.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
              Evaluated Bidder Rankings ({recommendations.length})
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Model: {evaluationData?.evaluation?.model_name || 'procureai-multifactor-v1.7'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recommendations.map((r: any) => {
              const crits = r.criterion_breakdown || {};
              const price = crits.price;
              const tech = crits.technical;
              const exp = crits.experience;
              const fin = crits.financial;
              const perf = crits.past_performance;
              const risk = crits.risk;

              return (
                <div
                  key={r.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    r.rank === 1
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg glow-emerald'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Bidder Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          r.rank === 1
                            ? 'bg-emerald-500 text-slate-950'
                            : r.rank === 2
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{r.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">
                            {r.company_name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            ({r.bid_reference})
                          </span>
                          {r.is_synthetic && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              SYNTHETIC
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          Recommendation: <strong className="text-procure-300 uppercase">{r.recommendation}</strong> · Confidence: {r.confidence ? Math.round(r.confidence * 100) : 95}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-500 block uppercase">Composite Score</span>
                      <span
                        className={`text-xl font-bold ${
                          r.rank === 1 ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {Number(r.total_score).toFixed(1)}
                        <span className="text-xs text-slate-500"> / 100</span>
                      </span>
                    </div>
                  </div>

                  {/* Criterion-level Scores (Exact requested format e.g. Price: 37.2/40) */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
                    {/* 1. Price */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Price</span>
                        <span className="font-bold text-procure-300">
                          {price ? `${price.weighted_score}/${price.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-procure-500 h-full rounded-full transition-all"
                          style={{ width: `${price ? price.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {price ? Math.round(price.raw_score) : 0}/100
                      </span>
                    </div>

                    {/* 2. Technical */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Technical</span>
                        <span className="font-bold text-indigo-300">
                          {tech ? `${tech.weighted_score}/${tech.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${tech ? tech.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {tech ? Math.round(tech.raw_score) : 0}/100
                      </span>
                    </div>

                    {/* 3. Experience */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Experience</span>
                        <span className="font-bold text-blue-300">
                          {exp ? `${exp.weighted_score}/${exp.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${exp ? exp.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {exp ? Math.round(exp.raw_score) : 0}/100
                      </span>
                    </div>

                    {/* 4. Financial */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Financial</span>
                        <span className="font-bold text-emerald-300">
                          {fin ? `${fin.weighted_score}/${fin.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${fin ? fin.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {fin ? Math.round(fin.raw_score) : 0}/100
                      </span>
                    </div>

                    {/* 5. Past Performance */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Performance</span>
                        <span className="font-bold text-teal-300">
                          {perf ? `${perf.weighted_score}/${perf.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full transition-all"
                          style={{ width: `${perf ? perf.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {perf ? Math.round(perf.raw_score) : 0}/100
                      </span>
                    </div>

                    {/* 6. Risk Indicators */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Risk Factor</span>
                        <span className="font-bold text-amber-300">
                          {risk ? `${risk.weighted_score}/${risk.weight}` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${risk ? risk.raw_score : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono text-right">
                        Raw: {risk ? Math.round(risk.raw_score) : 0}/100
                      </span>
                    </div>
                  </div>

                  {/* Reasoning & Key Factor Tags */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {r.reasoning_summary}
                    </p>

                    {/* Strengths & Risks */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.key_strengths?.map((str: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                        >
                          ✓ {str}
                        </span>
                      ))}

                      {r.concerns?.map((riskItem: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/25"
                        >
                          ⚠ {riskItem}
                        </span>
                      ))}
                    </div>

                    {/* XAI Explainability Toggle */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setExpandedXaiBidId(expandedXaiBidId === r.id ? null : r.id)}
                        className="text-[11px] font-mono text-procure-400 hover:text-procure-300 flex items-center gap-1.5 transition-colors font-semibold"
                      >
                        <span>💡</span>
                        <span>
                          {expandedXaiBidId === r.id
                            ? 'Hide Explainability Dossier'
                            : `Why did the AI score ${r.company_name}? (View XAI Dossier)`}
                        </span>
                      </button>

                      {expandedXaiBidId === r.id && (
                        <div className="mt-3 animate-fadeIn">
                          <AiExplainabilityCard
                            explanation={buildExplanationObject(r)}
                            isTopRecommendation={r.rank === 1}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Constitutional Principle & Terminology Safeguards Disclaimer ──── */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 font-mono">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <span>🛡️</span> GOVERNANCE PRINCIPLE: AI RECOMMENDS · HUMANS DECIDE · SYSTEM AUDITS
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          The ProcureAI evaluation engine generates structured Recommendations, Risk Indicators, Anomaly flags, and Potential Bias Patterns based on quantitative criteria. The platform strictly does not claim to have proved corruption, fraud, or absolute fairness. Final contract award decisions are made exclusively by authorized government procurement officials with mandatory justification audit logging.
        </p>
      </div>
    </div>
  );
};
