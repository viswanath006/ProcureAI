"""
ProcureAI Phase 7 Multi-Factor Weighted Scorer.
Computes criterion-level and aggregate final scores using configurable weights.
"""

from typing import List, Dict, Any, Tuple
from ..models.evaluation import (
    BidderEvaluationInput,
    TenderEvaluationContext,
    EvaluationWeights,
    CriterionScore,
)
from .normalizer import MetricNormalizer


class MultiFactorScorer:
    """
    Evaluates eligible bidders across 6 quantifiable dimensions using configurable weights.
    Strictly balances commercial pricing with technical strength, experience, and risk.
    """

    def __init__(self, weights: EvaluationWeights = None):
        self.weights = weights or EvaluationWeights()

    def evaluate_bid(
        self,
        bid: BidderEvaluationInput,
        all_bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext
    ) -> Tuple[float, Dict[str, CriterionScore], List[str], List[str]]:
        """
        Calculates normalized and weighted scores across all 6 dimensions.
        Returns:
            (total_score, criterion_scores_dict, all_strengths, all_risks)
        """
        all_risks: List[str] = []
        all_strengths: List[str] = []
        criterion_scores: Dict[str, CriterionScore] = {}

        # 1. Price Score (Default 40%)
        price_raw, price_ev, price_risks = MetricNormalizer.normalize_price(bid, all_bids, tender)
        price_weighted = round(price_raw * (self.weights.price / 100.0), 2)
        all_risks.extend(price_risks)
        if price_raw >= 90.0:
            all_strengths.append(f"Highly competitive commercial offer (₹{bid.bid_amount_inr:,.2f})")
        
        criterion_scores["price"] = CriterionScore(
            code="price",
            name="Price Score",
            raw_score=price_raw,
            weight=self.weights.price,
            weighted_score=price_weighted,
            confidence=0.96,
            explanation=f"Commercial proposal evaluated against competitive pool and estimated budget (₹{tender.estimated_budget_inr:,.2f}).",
            evidence=price_ev,
            risk_indicators=price_risks
        )

        # 2. Technical Capability (Default 20%)
        tech_raw, tech_ev, tech_risks = MetricNormalizer.normalize_technical(bid, tender)
        tech_weighted = round(tech_raw * (self.weights.technical / 100.0), 2)
        all_risks.extend(tech_risks)
        if tech_raw >= 85.0:
            all_strengths.append("High technical methodology depth and verified accreditations")

        criterion_scores["technical"] = CriterionScore(
            code="technical",
            name="Technical Capability",
            raw_score=tech_raw,
            weight=self.weights.technical,
            weighted_score=tech_weighted,
            confidence=0.92,
            explanation="Technical methodology, execution architecture, and verified accreditations evaluated.",
            evidence=tech_ev,
            risk_indicators=tech_risks
        )

        # 3. Experience (Default 15%)
        exp_raw, exp_ev, exp_risks = MetricNormalizer.normalize_experience(bid, tender)
        exp_weighted = round(exp_raw * (self.weights.experience / 100.0), 2)
        all_risks.extend(exp_risks)
        if exp_raw >= 85.0:
            all_strengths.append(f"Strong industry track record ({bid.years_in_operation} yrs, {bid.completed_projects_count} verified projects)")

        criterion_scores["experience"] = CriterionScore(
            code="experience",
            name="Experience",
            raw_score=exp_raw,
            weight=self.weights.experience,
            weighted_score=exp_weighted,
            confidence=0.94,
            explanation="Evaluated verifiable operational years and completed project dossier counts.",
            evidence=exp_ev,
            risk_indicators=exp_risks
        )

        # 4. Financial Capacity (Default 10%)
        fin_raw, fin_ev, fin_risks = MetricNormalizer.normalize_financial(bid, tender)
        fin_weighted = round(fin_raw * (self.weights.financial / 100.0), 2)
        all_risks.extend(fin_risks)
        if fin_raw >= 85.0:
            all_strengths.append("Substantial financial solvency and audited turnover cushion")

        criterion_scores["financial"] = CriterionScore(
            code="financial",
            name="Financial Capacity",
            raw_score=fin_raw,
            weight=self.weights.financial,
            weighted_score=fin_weighted,
            confidence=0.95,
            explanation="Assessed audited annual turnover and net worth ratios relative to tender commitment.",
            evidence=fin_ev,
            risk_indicators=fin_risks
        )

        # 5. Past Performance (Default 10%)
        perf_raw, perf_ev, perf_risks = MetricNormalizer.normalize_past_performance(bid)
        perf_weighted = round(perf_raw * (self.weights.past_performance / 100.0), 2)
        all_risks.extend(perf_risks)
        if perf_raw >= 85.0:
            all_strengths.append("Exemplary historical delivery track record and client ratings")

        criterion_scores["past_performance"] = CriterionScore(
            code="past_performance",
            name="Past Performance",
            raw_score=perf_raw,
            weight=self.weights.past_performance,
            weighted_score=perf_weighted,
            confidence=0.91,
            explanation="Evaluated verified on-time delivery rates, customer ratings, and contractual dispute records.",
            evidence=perf_ev,
            risk_indicators=perf_risks
        )

        # 6. Risk Indicators (Default 5%)
        risk_raw, risk_ev, risk_risks = MetricNormalizer.normalize_risk(bid, tender, all_risks)
        risk_weighted = round(risk_raw * (self.weights.risk / 100.0), 2)
        
        criterion_scores["risk"] = CriterionScore(
            code="risk",
            name="Risk Indicators",
            raw_score=risk_raw,
            weight=self.weights.risk,
            weighted_score=risk_weighted,
            confidence=0.90,
            explanation="Composite assessment of execution viability, timeline realism, and anomaly signals.",
            evidence=risk_ev,
            risk_indicators=risk_risks
        )

        # FINAL SCORE = Sum of all weighted scores
        total_score = round(
            price_weighted + tech_weighted + exp_weighted + fin_weighted + perf_weighted + risk_weighted,
            2
        )
        total_score = max(0.0, min(100.0, total_score))

        return total_score, criterion_scores, all_strengths, all_risks
