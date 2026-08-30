"""
ProcureAI Phase 9 — Anti-Bias and Anomaly Detection Test Suite.
Tests:
1. Feature 1: Isolation Forest Bid Anomaly Detection (NORMAL, LOW, MEDIUM, HIGH RISK)
2. Feature 2: Bid Collusion Indicators ("Potential suspicious pattern detected", no accusations)
"""

import pytest
from app.models.evaluation import TenderEvaluationContext, BidderEvaluationInput
from app.engine.anomaly import IsolationForestAnomalyDetector
from app.engine.collusion import CollusionPatternDetector
from app.synthetic.generator import SyntheticBenchmarkGenerator


def test_isolation_forest_anomaly_risk_tiers():
    """Verifies that Isolation Forest classifies bids into standard risk tiers."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    anomalies = IsolationForestAnomalyDetector.detect_anomalies(bids, tender)

    assert len(anomalies) == len(bids)
    valid_tiers = ["NORMAL", "LOW RISK", "MEDIUM RISK", "HIGH RISK"]

    for a in anomalies:
        assert a.risk_tier in valid_tiers
        assert isinstance(a.anomaly_score, float)
        assert len(a.factors) >= 4

    # Beta had 62% budget ratio (extreme low bid dumping risk) -> should be elevated risk
    beta_anomaly = next(a for a in anomalies if "Beta" in a.company_name)
    assert beta_anomaly.risk_tier in ["MEDIUM RISK", "HIGH RISK"]
    assert beta_anomaly.price_deviation_pct < -30.0


def test_collusion_price_similarity_detection():
    """Verifies that identical/near-identical bids trigger 'Potential suspicious pattern detected'."""
    tender = TenderEvaluationContext(
        tender_id="tdr-sim-001",
        reference_number="PROC-2026-SIM",
        title="Testing Price Similarity",
        estimated_budget_inr=100_000_000.0,
    )

    # Two bids differing by only ₹15,000 on a ₹9 Crore tender (0.016% delta)
    bids = [
        BidderEvaluationInput(
            bid_id="bid-sim-1",
            bid_reference="BID-SIM-001",
            company_id="comp-1",
            company_name="Acme Infra Ltd",
            bid_amount_inr=92_500_000.0,
            completion_days=180,
            technical_proposal="Proposal A",
            annual_turnover_inr=500_000_000.0,
        ),
        BidderEvaluationInput(
            bid_id="bid-sim-2",
            bid_reference="BID-SIM-002",
            company_id="comp-2",
            company_name="Zenith Works Pvt Ltd",
            bid_amount_inr=92_515_000.0,  # 0.016% difference
            completion_days=180,
            technical_proposal="Proposal B",
            annual_turnover_inr=480_000_000.0,
        ),
        BidderEvaluationInput(
            bid_id="bid-sim-3",
            bid_reference="BID-SIM-003",
            company_id="comp-3",
            company_name="Independent Solutions",
            bid_amount_inr=98_000_000.0,
            completion_days=190,
            technical_proposal="Proposal C",
            annual_turnover_inr=600_000_000.0,
        ),
    ]

    indicators = CollusionPatternDetector.analyze_patterns(bids, tender)
    assert len(indicators) > 0

    sim_indicator = next((i for i in indicators if i.pattern_type == "price_similarity"), None)
    assert sim_indicator is not None
    assert sim_indicator.label == "Potential suspicious pattern detected"
    assert "Acme Infra Ltd" in sim_indicator.involved_companies
    assert "Zenith Works Pvt Ltd" in sim_indicator.involved_companies
    assert sim_indicator.metrics["difference_pct"] < 0.10


def test_repeated_price_relationship_markup():
    """Verifies that structured constant markup triggers collusion indicators."""
    tender = TenderEvaluationContext(
        tender_id="tdr-rel-001",
        reference_number="PROC-2026-REL",
        title="Testing Price Relationship",
        estimated_budget_inr=100_000_000.0,
    )

    # Bidder B bids exactly 5.0% higher than Bidder A (cover bidding pattern)
    bids = [
        BidderEvaluationInput(
            bid_id="bid-rel-1",
            bid_reference="BID-REL-001",
            company_id="comp-1",
            company_name="Primary Builder Co",
            bid_amount_inr=80_000_000.0,
            completion_days=180,
            technical_proposal="Proposal A",
            annual_turnover_inr=400_000_000.0,
        ),
        BidderEvaluationInput(
            bid_id="bid-rel-2",
            bid_reference="BID-REL-002",
            company_id="comp-2",
            company_name="Secondary Cover Co",
            bid_amount_inr=84_000_000.0,  # exactly 1.05x (5.0%)
            completion_days=180,
            technical_proposal="Proposal B",
            annual_turnover_inr=300_000_000.0,
        ),
    ]

    indicators = CollusionPatternDetector.analyze_patterns(bids, tender)
    rel_indicator = next((i for i in indicators if i.pattern_type == "repeated_price_relationship"), None)
    assert rel_indicator is not None
    assert rel_indicator.label == "Potential suspicious pattern detected"
    assert "5.0%" in rel_indicator.evidence_summary


def test_strict_safeguard_no_accusations_of_corruption():
    """Verifies that the engine never claims an entity is corrupt."""
    tender, bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
    anomalies = IsolationForestAnomalyDetector.detect_anomalies(bids, tender)
    indicators = CollusionPatternDetector.analyze_patterns(bids, tender)

    full_text = " ".join(
        [a.risk_tier + " " + " ".join(a.risk_indicators) for a in anomalies] +
        [i.label + " " + i.evidence_summary for i in indicators]
    ).lower()

    assert "corrupt" not in full_text
    assert "criminal" not in full_text
    assert "fraudulent" not in full_text
    assert "potential suspicious pattern detected" in [i.label for i in indicators] or len(indicators) == 0
