"""
Tests for Department-Aware AI Evaluation Dataset & Generator.
Validates that real-world verified Indian contractors are properly structured,
loaded, and evaluated by the multi-criteria scoring engine.
"""

import pytest
from app.synthetic.generator import SyntheticBenchmarkGenerator
from app.models.evaluation import EvaluationWeights
from app.engine.ranker import BidderRanker


def test_load_contractors_dataset():
    """Verify that all 38 verified Indian contractors are successfully loaded."""
    data = SyntheticBenchmarkGenerator.load_contractors_dataset()
    assert "contractors" in data
    assert len(data["contractors"]) >= 38
    assert "departments" in data
    assert len(data["departments"]) >= 10


@pytest.mark.parametrize("dept_id,min_bidders", [
    ("nhai", 6),
    ("cpwd", 3),
    ("railways-board", 4),
    ("mes", 2),
    ("seci", 3),
    ("nic", 3),
    ("aiims-procure", 2),
    ("jal-jeevan", 3),
    ("edu-school", 3),
    ("agri-infra", 1),
])
def test_get_contractors_for_department(dept_id, min_bidders):
    """Verify that each department retrieves its verified contractors."""
    bidders = SyntheticBenchmarkGenerator.get_contractors_for_department(dept_id)
    assert len(bidders) >= min_bidders
    for b in bidders:
        assert "id" in b
        assert "name" in b
        assert "cin" in b
        assert "evaluation_profile" in b
        assert "technical_capabilities" in b["evaluation_profile"]


def test_generate_department_benchmark_suite_nhai():
    """Test full evaluation pipeline on NHAI contractor cohort (L&T, Dilip Buildcon, IRB, etc.)."""
    tender, bids = SyntheticBenchmarkGenerator.generate_department_benchmark_suite(
        department_id="nhai",
        estimated_budget_inr=500_000_000.0,
        required_days=360,
    )
    assert len(bids) >= 6
    assert tender.estimated_budget_inr == 500_000_000.0

    ranker = BidderRanker(weights=EvaluationWeights())
    result = ranker.evaluate_tender(tender, bids)

    assert result.bids_evaluated == len(bids)
    assert result.top_recommendation is not None
    assert len(result.rankings) == len(bids)
    for r in result.rankings:
        assert 0.0 <= r.total_score <= 100.0
        assert r.explanation is not None
        assert "Price" in r.explanation.ratings
        assert "Technical capability" in r.explanation.ratings
