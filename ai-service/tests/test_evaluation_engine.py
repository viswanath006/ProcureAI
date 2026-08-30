"""
Unit and Integration Test Suite for ProcureAI Phase 7 Evaluation Engine.
Tests normalization, weighted combination, non-lowest-bidder selection,
confidence indexing, and terminology safeguards.
"""

import pytest
from app.models.evaluation import (
    EvaluationWeights,
    BidderEvaluationInput,
    TenderEvaluationContext,
    EvaluationRequest,
)
from app.engine.normalizer import MetricNormalizer
from app.engine.scorer import MultiFactorScorer
from app.engine.ranker import BidderRanker
from app.synthetic.generator import SyntheticBenchmarkGenerator


@pytest.fixture
def sample_tender():
    return TenderEvaluationContext(
        tender_id="tdr-test-001",
        reference_number="PROC-2026-TEST",
        title="National Digital Platform",
        estimated_budget_inr=100_000_000.0,  # 10 Cr INR
        required_delivery_days=180,
        required_experience_years=5,
        required_completed_projects=3,
        required_turnover_inr=30_000_000.0,
    )


@pytest.fixture
def sample_bids():
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    return bids


# ─── 1. Weights Validation ───────────────────────────────────────────────────

def test_default_weights_sum_to_100():
    weights = EvaluationWeights()
    total = (
        weights.price + weights.technical + weights.experience +
        weights.financial + weights.past_performance + weights.risk
    )
    assert total == 100.0
    assert weights.price == 40.0
    assert weights.technical == 20.0
    assert weights.experience == 15.0
    assert weights.financial == 10.0
    assert weights.past_performance == 10.0
    assert weights.risk == 5.0


def test_invalid_weights_rejected():
    with pytest.raises(ValueError, match="Evaluation weights must sum to exactly 100%"):
        EvaluationWeights(price=50.0, technical=30.0, experience=10.0, financial=10.0, past_performance=10.0, risk=10.0)


def test_custom_valid_weights():
    weights = EvaluationWeights(
        price=30.0,
        technical=30.0,
        experience=20.0,
        financial=10.0,
        past_performance=5.0,
        risk=5.0,
    )
    assert weights.price == 30.0
    assert weights.technical == 30.0


# ─── 2. Metric Normalization to 0-100 Scale ───────────────────────────────────

def test_price_normalization_bounds(sample_tender, sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_price(bid, sample_bids, sample_tender)
        assert 0.0 <= score <= 100.0
        assert len(evidence) > 0


def test_technical_normalization_bounds(sample_tender, sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_technical(bid, sample_tender)
        assert 0.0 <= score <= 100.0
        assert len(evidence) > 0


def test_experience_normalization_bounds(sample_tender, sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_experience(bid, sample_tender)
        assert 0.0 <= score <= 100.0
        assert len(evidence) > 0


def test_financial_normalization_bounds(sample_tender, sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_financial(bid, sample_tender)
        assert 0.0 <= score <= 100.0
        assert len(evidence) > 0


def test_past_performance_normalization_bounds(sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_past_performance(bid)
        assert 0.0 <= score <= 100.0
        assert len(evidence) > 0


def test_risk_normalization_bounds(sample_tender, sample_bids):
    for bid in sample_bids:
        score, evidence, risks = MetricNormalizer.normalize_risk(bid, sample_tender, ["Sample risk"])
        assert 0.0 <= score <= 100.0


# ─── 3. Non-Lowest Bidder Balance Rule (Core Guarantee) ───────────────────────

def test_system_does_not_simply_pick_lowest_bidder(sample_tender, sample_bids):
    """
    CRITICAL REQUIREMENT:
    Beta has the lowest price (₹6.2 Cr vs ₹9.2 Cr), but has poor technicals,
    limited experience, thin finances, and triggers abnormal low-bid risk.
    Alpha has balanced high quality.
    The engine MUST rank Alpha #1 overall despite Alpha having a higher price!
    """
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender=sample_tender, bids=sample_bids)

    assert response.bids_evaluated == 3
    top_recommendation = response.top_recommendation
    assert top_recommendation is not None

    # Verify lowest bidder is NOT automatically selected
    lowest_price_bid = min(sample_bids, key=lambda b: b.bid_amount_inr)
    assert lowest_price_bid.company_id == "synth-comp-beta"

    # Verify Alpha is the top recommendation
    assert top_recommendation.bid_reference == "SYNTH-BID-2026-001"
    assert "Alpha Enterprise Solutions" in top_recommendation.company_name
    assert top_recommendation.recommendation == "award"

    # Verify Beta has higher price score but lower overall score
    beta_result = next(r for r in response.rankings if r.bid_reference == "SYNTH-BID-2026-002")
    alpha_result = next(r for r in response.rankings if r.bid_reference == "SYNTH-BID-2026-001")

    assert beta_result.criterion_scores["price"].weighted_score >= alpha_result.criterion_scores["price"].weighted_score
    assert alpha_result.total_score > beta_result.total_score
    assert beta_result.rank > alpha_result.rank


# ─── 4. Criterion Scores & Final Score Calculation ───────────────────────────

def test_criterion_level_scores_and_final_score(sample_tender, sample_bids):
    weights = EvaluationWeights()
    scorer = MultiFactorScorer(weights)

    bid_alpha = sample_bids[0]
    total_score, criterion_scores, strengths, risks = scorer.evaluate_bid(
        bid=bid_alpha,
        all_bids=sample_bids,
        tender=sample_tender
    )

    # Check all 6 criteria are present
    assert "price" in criterion_scores
    assert "technical" in criterion_scores
    assert "experience" in criterion_scores
    assert "financial" in criterion_scores
    assert "past_performance" in criterion_scores
    assert "risk" in criterion_scores

    # Verify weighted score sum equals total score
    weighted_sum = sum(cs.weighted_score for cs in criterion_scores.values())
    assert abs(weighted_sum - total_score) < 0.05

    # Check that each criterion has explanation and confidence
    for cs in criterion_scores.values():
        assert len(cs.explanation) > 0
        assert 0.0 <= cs.confidence <= 1.0


# ─── 5. Explainable Rationale & Confidence ───────────────────────────────────

def test_explainable_rationale_output(sample_tender, sample_bids):
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender=sample_tender, bids=sample_bids)

    top = response.top_recommendation
    assert top is not None
    assert "Best overall balance between price, technical capability" in top.reasoning_summary
    assert len(top.key_strengths) > 0
    assert top.confidence_level in ["HIGH", "MEDIUM", "LOW"]
    assert 0.0 <= top.confidence_score <= 1.0


# ─── 6. Terminology Safeguards ───────────────────────────────────────────────

def test_approved_terminology_safeguards(sample_tender, sample_bids):
    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender=sample_tender, bids=sample_bids)

    # Convert entire response to string and verify forbidden claims do not exist
    json_str = response.model_dump_json()

    # Forbidden absolutes
    assert "proved corruption" not in json_str.lower()
    assert "proved fairness" not in json_str.lower()
    assert "guaranteed fraud" not in json_str.lower()

    # Approved terms must exist
    assert "recommendation" in json_str.lower()
    assert "risk indicator" in json_str.lower()
    assert "AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS" in response.disclaimer


# ─── 7. Synthetic Dataset Labeling ───────────────────────────────────────────

def test_synthetic_dataset_clearly_labeled(sample_tender, sample_bids):
    for bid in sample_bids:
        assert bid.is_synthetic is True
        assert "[SYNTHETIC DATASET]" in bid.company_name

    ranker = BidderRanker()
    response = ranker.evaluate_tender(tender=sample_tender, bids=sample_bids)
    for r in response.rankings:
        assert r.is_synthetic is True
