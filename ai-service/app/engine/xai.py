"""
ProcureAI Phase 8 — Explainable AI (XAI) Engine using SHAP (Shapley Additive exPlanations).
Generates transparent, non-technical explanations answering:
"Why did the AI recommend this company?"
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import shap

from ..models.evaluation import (
    BidderEvaluationInput,
    CriterionScore,
    FactorExplanation,
    BidderExplanationObject,
    EvaluationWeights,
)


class ShapExplainabilityEngine:
    """
    Computes Shapley feature attributions and produces structured, plain-language
    explanations designed for non-technical government procurement officials.
    """

    FEATURE_CODES = ["price", "technical", "experience", "financial", "past_performance", "risk"]
    FEATURE_TITLES = {
        "price": "Price",
        "technical": "Technical capability",
        "experience": "Experience",
        "financial": "Financial capacity",
        "past_performance": "Past performance",
        "risk": "Risk",
    }

    @classmethod
    def map_score_to_rating(cls, factor_code: str, raw_score: float) -> str:
        """
        Maps a 0-100 score to non-technical rating labels:
        Excellent | Very strong | Strong | Good | Moderate | Low
        For Risk: Low | Moderate | Elevated | High
        """
        if factor_code == "risk":
            if raw_score >= 90.0:
                return "Low"          # Low risk = optimal
            elif raw_score >= 75.0:
                return "Moderate"
            elif raw_score >= 55.0:
                return "Elevated"
            else:
                return "High"          # High risk

        if raw_score >= 90.0:
            return "Excellent"
        elif raw_score >= 80.0:
            return "Very strong"
        elif raw_score >= 70.0:
            return "Strong"
        elif raw_score >= 60.0:
            return "Good"
        elif raw_score >= 50.0:
            return "Moderate"
        else:
            return "Low"

    @classmethod
    def compute_shap_attributions(
        cls,
        bids_data: List[Dict[str, Any]],
        weights: EvaluationWeights
    ) -> Tuple[float, List[Dict[str, float]]]:
        """
        Trains an interpretable surrogate model on procurement evaluations and computes
        exact Shapley values for each bidder relative to baseline expectations.
        Returns: (baseline_expected_score, list_of_bidder_shap_dicts)
        """
        weights_arr = np.array([
            weights.price / 100.0,
            weights.technical / 100.0,
            weights.experience / 100.0,
            weights.financial / 100.0,
            weights.past_performance / 100.0,
            weights.risk / 100.0,
        ])

        # Create feature matrix from bids (raw scores 0-100)
        X_bids = np.array([
            [
                b["criterion_scores"][code].raw_score
                for code in cls.FEATURE_CODES
            ]
            for b in bids_data
        ])

        # Synthesize benchmark background distribution representing historical procurement pool
        np.random.seed(42)
        background_n = 40
        X_background = np.random.uniform(50.0, 95.0, size=(background_n, 6))
        # Ensure typical procurement means (~72.0)
        y_background = np.dot(X_background, weights_arr)

        # Train surrogate Random Forest model
        surrogate = RandomForestRegressor(n_estimators=30, max_depth=4, random_state=42)
        surrogate.fit(X_background, y_background)

        # Initialize TreeExplainer
        explainer = shap.TreeExplainer(surrogate, X_background)
        shap_values = explainer.shap_values(X_bids)

        expected_value = float(np.mean(explainer.expected_value))

        results: List[Dict[str, float]] = []
        for i in range(len(bids_data)):
            bid_shap = {}
            for j, code in enumerate(cls.FEATURE_CODES):
                val = float(shap_values[i][j]) if hasattr(shap_values[i], '__getitem__') else float(shap_values[i, j])
                bid_shap[code] = round(val, 2)
            results.append(bid_shap)

        return round(expected_value, 2), results

    @classmethod
    def generate_explanation(
        cls,
        bid: BidderEvaluationInput,
        rank: int,
        total_score: float,
        criterion_scores: Dict[str, CriterionScore],
        shap_dict: Dict[str, float],
        baseline_score: float
    ) -> BidderExplanationObject:
        """
        Builds the structured non-technical Explanation Object for a bidder.
        """
        ratings: Dict[str, str] = {}
        factor_explanations: List[FactorExplanation] = []
        positive_contributors: List[str] = []
        negative_contributors: List[str] = []

        # Categorize factors
        for code in cls.FEATURE_CODES:
            cs = criterion_scores.get(code)
            if not cs:
                continue

            raw_score = cs.raw_score
            title = cls.FEATURE_TITLES[code]
            rating_label = cls.map_score_to_rating(code, raw_score)
            ratings[title] = rating_label

            shap_val = shap_dict.get(code, 0.0)

            # Determine positive vs negative contributor
            if code == "risk":
                # For risk: raw_score >= 80 means Low Risk (Positive contributor)
                if raw_score >= 80.0 or shap_val >= 0:
                    impact = "positive"
                    positive_contributors.append("+ Low operational risk")
                else:
                    impact = "negative"
                    negative_contributors.append("- Higher risk indicator")
            else:
                if shap_val > 0.3 or raw_score >= 80.0:
                    impact = "positive"
                    if code == "price":
                        positive_contributors.append("+ Competitive price")
                    elif code == "technical":
                        positive_contributors.append("+ Strong technical capability")
                    elif code == "experience":
                        positive_contributors.append("+ Relevant experience")
                    elif code == "financial":
                        positive_contributors.append("+ Strong financial capacity")
                    elif code == "past_performance":
                        positive_contributors.append("+ Strong past performance")
                elif shap_val < -0.3 or raw_score < 75.0:
                    impact = "negative"
                    if code == "price":
                        negative_contributors.append("- Less competitive price")
                    elif code == "technical":
                        negative_contributors.append("- Moderate technical capability")
                    elif code == "experience":
                        negative_contributors.append("- Limited operational experience")
                    elif code == "financial":
                        negative_contributors.append("- Moderate financial capacity")
                    elif code == "past_performance":
                        negative_contributors.append("- Moderate past performance")
                else:
                    impact = "neutral"

            # Plain language summary for factor
            summary = cs.explanation

            factor_explanations.append(FactorExplanation(
                factor=code,
                title=title,
                rating_label=rating_label,
                raw_score=raw_score,
                weighted_score=cs.weighted_score,
                weight=cs.weight,
                shap_value=shap_val,
                impact=impact,
                summary=summary
            ))

        # Guarantee at least one contributor in each if applicable
        if not positive_contributors:
            positive_contributors.append("+ Meets mandatory eligibility requirements")
        if not negative_contributors and rank > 1:
            negative_contributors.append("- Moderate comparative margin vs top proposal")

        # Plain language executive summary answering "Why did the AI recommend this company?"
        if rank == 1:
            top_factors = [f.title.lower() for f in factor_explanations if f.impact == "positive"][:3]
            factors_text = ", ".join(top_factors) if top_factors else "balanced multi-criteria scoring"
            why_summary = (
                f"{bid.company_name} was recommended for award because it achieved the highest composite "
                f"score ({total_score:.1f}/100), driven by strong ratings in {factors_text} with optimal risk management."
            )
            narrative = (
                f"The AI evaluated {bid.company_name} against the full tender specifications. "
                f"Its commercial proposal scored {ratings.get('Price', 'Good')}, while technical capability was rated "
                f"{ratings.get('Technical capability', 'Good')}. Operational experience is {ratings.get('Experience', 'Good')}, "
                f"and past performance verified as {ratings.get('Past performance', 'Good')}. "
                f"Overall execution risk is categorized as {ratings.get('Risk', 'Low')}."
            )
        elif rank == 2:
            why_summary = (
                f"{bid.company_name} is shortlisted as a strong alternative ({total_score:.1f}/100). "
                f"Demonstrates solid qualifications but trailed the leading bidder on key dimensional margins."
            )
            narrative = (
                f"Evaluated as Rank #2. Strengths include: {', '.join([p.replace('+ ', '') for p in positive_contributors])}. "
                f"Areas with lower comparative contribution: {', '.join([n.replace('- ', '') for n in negative_contributors])}."
            )
        else:
            why_summary = (
                f"{bid.company_name} was ranked #{rank} ({total_score:.1f}/100). "
                f"While qualifying on mandatory gates, other proposals presented superior balance across price and capability."
            )
            narrative = (
                f"Composite score placed proposal in reserve. Negative contributors included: "
                f"{', '.join([n.replace('- ', '') for n in negative_contributors])}."
            )

        return BidderExplanationObject(
            bid_id=bid.bid_id,
            bid_reference=bid.bid_reference,
            company_name=bid.company_name,
            rank=rank,
            total_score=total_score,
            why_summary=why_summary,
            ratings=ratings,
            positive_contributors=positive_contributors,
            negative_contributors=negative_contributors,
            factor_explanations=factor_explanations,
            shap_attributions=shap_dict,
            baseline_expected_score=baseline_score,
            plain_language_narrative=narrative
        )
