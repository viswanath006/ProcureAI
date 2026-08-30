"""
ProcureAI Phase 8 — Explainable AI (XAI) Test Suite.
Tests SHAP attributions, positive/negative contributors, non-technical ratings,
and structured explanation objects answering "Why did the AI recommend this company?".
"""

import pytest
from app.models.evaluation import (
    EvaluationWeights,
    TenderEvaluationContext,
    BidderEvaluationInput,
)
from app.engine.ranker import BidderRanker
from app.engine.xai import ShapExplainabilityEngine
from app.synthetic.generator import SyntheticBenchmarkGenerator


def test_score_to_rating_mapping():
    """Verifies 0-100 scores map to clear, non-technical ratings."""
    assert ShapExplainabilityEngine.map_score_to_rating("price", 94.0) == "Excellent"
    assert ShapExplainabilityEngine.map_score_to_rating("technical", 84.0) == "Very strong"
    assert ShapExplainabilityEngine.map_score_to_rating("experience", 74.0) == "Strong"
    assert ShapExplainabilityEngine.map_score_to_rating("financial", 64.0) == "Good"
    assert ShapExplainabilityEngine.map_score_to_rating("past_performance", 54.0) == "Moderate"
    assert ShapExplainabilityEngine.map_score_to_rating("price", 42.0) == "Low"

    # Risk factor: high score means low risk (optimal)
    assert ShapExplainabilityEngine.map_score_to_rating("risk", 95.0) == "Low"
    assert ShapExplainabilityEngine.map_score_to_rating("risk", 80.0) == "Moderate"
    assert ShapExplainabilityEngine.map_score_to_rating("risk", 60.0) == "Elevated"
    assert ShapExplainabilityEngine.map_score_to_rating("risk", 35.0) == "High"


def test_shap_attribution_computation():
    """Verifies SHAP attributions produce valid feature weights relative to baseline."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    weights = EvaluationWeights()
    ranker = BidderRanker(weights)
    response = ranker.evaluate_tender(tender, bids)

    top_bid = response.top_recommendation
    assert top_bid is not None
    assert top_bid.explanation is not None

    explanation = top_bid.explanation
    assert explanation.baseline_expected_score > 0
    assert len(explanation.shap_attributions) == 6
    assert "price" in explanation.shap_attributions
    assert "technical" in explanation.shap_attributions
    assert "risk" in explanation.shap_attributions


def test_positive_and_negative_contributors_present():
    """Verifies positive and negative contributors are clearly separated."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender, bids)

    # Top recommendation (Alpha: balanced)
    alpha = response.rankings[0]
    assert alpha.explanation is not None
    assert len(alpha.explanation.positive_contributors) > 0
    assert any("+" in c for c in alpha.explanation.positive_contributors)

    # Beta has low price but high risk / weak technical
    beta = next(r for r in response.rankings if "Beta" in r.company_name)
    assert beta.explanation is not None
    assert len(beta.explanation.negative_contributors) > 0
    assert any("-" in c for c in beta.explanation.negative_contributors)
    assert any("risk" in c.lower() or "technical" in c.lower() or "experience" in c.lower() for c in beta.explanation.negative_contributors)


def test_non_technical_ratings_grid_complete():
    """Verifies the ratings grid contains all 6 dimensions with non-technical terms."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender, bids)

    alpha_explanation = response.rankings[0].explanation
    assert alpha_explanation is not None
    ratings = alpha_explanation.ratings

    expected_dimensions = [
        "Price",
        "Technical capability",
        "Experience",
        "Financial capacity",
        "Past performance",
        "Risk",
    ]
    for dim in expected_dimensions:
        assert dim in ratings
        assert ratings[dim] in ["Excellent", "Very strong", "Strong", "Good", "Moderate", "Low", "Elevated", "High"]


def test_why_did_ai_recommend_answers_plain_language():
    """Verifies why_summary provides a clear answer to 'Why did the AI recommend this company?'."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender, bids)

    top_bid = response.top_recommendation
    assert top_bid is not None
    assert top_bid.explanation is not None

    why = top_bid.explanation.why_summary
    assert len(why) > 40
    assert "recommended for award" in why
    assert f"{top_bid.total_score:.1f}" in why

    narrative = top_bid.explanation.plain_language_narrative
    assert len(narrative) > 60
    # Must NOT expose raw machine learning internals
    assert "tensor" not in narrative.lower()
    assert "gradient" not in narrative.lower()
    assert "backprop" not in narrative.lower()
