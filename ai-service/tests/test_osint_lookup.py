"""
Unit tests for ProcureAI OSINT Enrichment Module.
Tests:
1. MCA statutory lookup with mocked API response (data.gov.in)
2. 30-day caching mechanism
3. Graceful degradation when API key missing or API times out / fails
4. Discrepancy detection between declared data and public records
5. Cross-bidder collusion detection for co-located bidders (shared registered address)
6. Cross-bidder collusion detection for common directors/DINs
7. 10-feature Isolation Forest anomaly evaluation
"""

import os
from unittest.mock import patch, MagicMock
import pytest
import httpx

from app.osint.mca_lookup import MCALookupService, _IN_MEMORY_CACHE
from app.engine.collusion import CollusionPatternDetector
from app.engine.anomaly import IsolationForestAnomalyDetector
from app.models.evaluation import BidderEvaluationInput, TenderEvaluationContext


@pytest.fixture(autouse=True)
def clear_in_memory_cache():
    """Clear in-memory cache before each test."""
    _IN_MEMORY_CACHE.clear()
    yield
    _IN_MEMORY_CACHE.clear()


MOCK_MCA_API_RESPONSE = {
    "records": [
        {
            "cin": "U72200DL2018PTC334455",
            "company_name": "TECHSOL INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED",
            "company_status": "ACTIVE",
            "incorporation_date": "2018-04-15",
            "registered_address": "Plot No 45, Okhla Industrial Area Phase III, New Delhi 110020",
            "authorized_capital": 50000000.0,
            "paid_up_capital": 25000000.0,
            "directors": [
                {"name": "Rajesh Kumar Sharma", "din": "01234567"},
                {"name": "Anita Verma", "din": "07654321"}
            ]
        }
    ]
}


def test_mca_lookup_success_mocked():
    """Tests successful statutory MCA lookup using mocked data.gov.in response."""
    cin = "U72200DL2018PTC334455"

    with patch.dict(os.environ, {"MCA_OGD_API_KEY": "test_mock_ogd_key_12345"}):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_MCA_API_RESPONSE

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        result = MCALookupService.lookup_cin(
            cin=cin,
            declared_company_name="TechSol Infrastructure Solutions Pvt Ltd",
            declared_inc_date="2018-04-15",
            client=mock_client,
        )

        assert result.cin == cin
        assert result.verification_status == "verified"
        assert result.company_status == "ACTIVE"
        assert result.company_record is not None
        assert result.company_record.incorporation_date == "2018-04-15"
        assert len(result.company_record.directors) == 2
        assert result.company_record.directors[0].din == "01234567"
        assert result.is_cached is False


def test_mca_lookup_30_day_cache_hit():
    """Verifies that second lookup hits cache within TTL without invoking external API."""
    cin = "U72200DL2018PTC334455"

    with patch.dict(os.environ, {"MCA_OGD_API_KEY": "test_mock_key"}):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_MCA_API_RESPONSE
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        # 1st call -> populates cache
        res1 = MCALookupService.lookup_cin(cin=cin, client=mock_client)
        assert res1.is_cached is False
        assert mock_client.get.call_count == 1

        # 2nd call -> should hit cache, no API call
        res2 = MCALookupService.lookup_cin(cin=cin, client=mock_client)
        assert res2.is_cached is True
        assert mock_client.get.call_count == 1  # No additional API call
        assert res2.company_record.cin == cin


def test_mca_lookup_missing_api_key_graceful():
    """Verifies that missing API key returns 'unavailable' and does not crash."""
    with patch.dict(os.environ, {}, clear=True):
        if "MCA_OGD_API_KEY" in os.environ:
            del os.environ["MCA_OGD_API_KEY"]

        result = MCALookupService.lookup_cin("U12345DL2020PTC000000")
        assert result.verification_status == "unavailable"
        assert "API key not configured" in result.reason


def test_mca_lookup_api_failure_graceful():
    """Verifies that external API errors (e.g. HTTP 500, network error) fail gracefully."""
    with patch.dict(os.environ, {"MCA_OGD_API_KEY": "dummy_key"}):
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.side_effect = httpx.RequestError("Network connection timeout")

        result = MCALookupService.lookup_cin(
            cin="U12345DL2020PTC000000",
            client=mock_client
        )
        assert result.verification_status == "unavailable"
        assert "OSINT verification unavailable" in result.reason


def test_mca_lookup_discrepancy_detection():
    """Verifies mismatch flag when declared data does not match MCA public record."""
    cin = "U72200DL2018PTC334455"
    with patch.dict(os.environ, {"MCA_OGD_API_KEY": "test_key"}):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_MCA_API_RESPONSE
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        # Bidder declared conflicting company name and different date
        result = MCALookupService.lookup_cin(
            cin=cin,
            declared_company_name="Completely Different Builders Ltd",
            declared_inc_date="2005-01-01",
            client=mock_client
        )

        assert result.verification_status == "mismatch"
        assert "company_name" in result.discrepancy_details
        assert "incorporation_date" in result.discrepancy_details


def test_cross_bidder_collusion_shared_address():
    """
    Test case for collusion check function using two synthetic bidders with
    the same registered address to confirm it flags them.
    """
    bid_1 = BidderEvaluationInput(
        bid_id="bid-col-01",
        bid_reference="BID-REF-001",
        company_id="comp-col-01",
        company_name="Apex Infrastructure Pvt Ltd",
        bid_amount_inr=85_000_000.0,
        registered_address="Plot No. 42, Sector 18, Electronic City, Gurugram, Haryana 122015",
        directors=[{"name": "Vikram Malhotra", "din": "08123456"}],
        incorporation_date="2016-03-10",
        annual_turnover_inr=300_000_000.0,
    )

    bid_2 = BidderEvaluationInput(
        bid_id="bid-col-02",
        bid_reference="BID-REF-002",
        company_id="comp-col-02",
        company_name="BlueHorizon Tech Projects Ltd",
        bid_amount_inr=87_200_000.0,
        # Normalized variant of the exact same physical office address
        registered_address="42, Sec 18, Electronic City, Gurgaon, Haryana 122015",
        directors=[{"name": "Suresh Gupta", "din": "09654321"}],
        incorporation_date="2019-07-20",
        annual_turnover_inr=250_000_000.0,
    )

    bid_independent = BidderEvaluationInput(
        bid_id="bid-ind-03",
        bid_reference="BID-REF-003",
        company_id="comp-ind-03",
        company_name="Kaveri Heavy Engineering Corp",
        bid_amount_inr=89_000_000.0,
        registered_address="Industrial Estate, Guindy, Chennai, Tamil Nadu 600032",
        directors=[{"name": "K. Srinivasan", "din": "03456789"}],
        incorporation_date="2010-11-05",
        annual_turnover_inr=400_000_000.0,
    )

    all_bids = [bid_1, bid_2, bid_independent]
    bid_map, indicators = CollusionPatternDetector.detect_cross_bidder_osint_collusion(all_bids)

    # Both co-located bidders must be flagged for collusion
    assert bid_map[bid_1.bid_id]["collusion_flag"] is True
    assert "BlueHorizon Tech Projects Ltd" in bid_map[bid_1.bid_id]["matching_bidders"]
    assert any("registered corporate address" in r for r in bid_map[bid_1.bid_id]["reasons"])

    assert bid_map[bid_2.bid_id]["collusion_flag"] is True
    assert "Apex Infrastructure Pvt Ltd" in bid_map[bid_2.bid_id]["matching_bidders"]

    # Independent bidder must NOT be flagged
    assert bid_map[bid_independent.bid_id]["collusion_flag"] is False
    assert len(bid_map[bid_independent.bid_id]["matching_bidders"]) == 0

    # Indicators list must have the detected shared address pattern
    assert len(indicators) >= 1
    addr_indicator = next((ind for ind in indicators if ind.pattern_type == "shared_registered_address"), None)
    assert addr_indicator is not None
    assert "Apex Infrastructure Pvt Ltd" in addr_indicator.involved_companies
    assert "BlueHorizon Tech Projects Ltd" in addr_indicator.involved_companies


def test_cross_bidder_collusion_shared_directors():
    """Verifies that competing bidders with shared directors/DINs are flagged."""
    bid_1 = BidderEvaluationInput(
        bid_id="bid-dir-01",
        bid_reference="BID-D-01",
        company_id="comp-d-01",
        company_name="Sunrise Energy Ltd",
        bid_amount_inr=50_000_000.0,
        registered_address="10 Nariman Point, Mumbai 400021",
        directors=[{"name": "Anil Ambani", "din": "00001111"}],
    )

    bid_2 = BidderEvaluationInput(
        bid_id="bid-dir-02",
        bid_reference="BID-D-02",
        company_id="comp-d-02",
        company_name="Western Power Solutions Pvt Ltd",
        bid_amount_inr=52_000_000.0,
        registered_address="25 BKC Road, Bandra, Mumbai 400051",
        directors=[{"name": "Anil Ambani", "din": "00001111"}],  # Shared DIN
    )

    bid_map, indicators = CollusionPatternDetector.detect_cross_bidder_osint_collusion([bid_1, bid_2])
    assert bid_map[bid_1.bid_id]["collusion_flag"] is True
    assert bid_map[bid_2.bid_id]["collusion_flag"] is True
    assert any("director/DIN" in r for r in bid_map[bid_1.bid_id]["reasons"])


def test_isolation_forest_with_collusion_and_company_age():
    """Verifies Isolation Forest handles extended 10-feature vector with collusion and company age."""
    tender = TenderEvaluationContext(
        tender_id="tdr-osint-01",
        reference_number="PROC-2026-OSINT",
        title="Smart Grid Infrastructure",
        estimated_budget_inr=100_000_000.0,
    )

    bid_colluding = BidderEvaluationInput(
        bid_id="bid-c1",
        bid_reference="BID-C1",
        company_id="comp-c1",
        company_name="Shell Enterprise One",
        bid_amount_inr=95_000_000.0,
        registered_address="Unit 1, Tech Park, Bangalore 560001",
        directors=[{"name": "Common Director", "din": "00998877"}],
        incorporation_date="2026-08-01",  # Very young shell company (40 days)
    )

    bid_colluding_twin = BidderEvaluationInput(
        bid_id="bid-c2",
        bid_reference="BID-C2",
        company_id="comp-c2",
        company_name="Shell Enterprise Two",
        bid_amount_inr=94_800_000.0,
        registered_address="Unit 1, Tech Park, Bangalore 560001",  # Same address
        directors=[{"name": "Common Director", "din": "00998877"}],  # Same director
        incorporation_date="2026-08-05",
    )

    bid_genuine = BidderEvaluationInput(
        bid_id="bid-g3",
        bid_reference="BID-G3",
        company_id="comp-g3",
        company_name="Genuine Engineering Corp Ltd",
        bid_amount_inr=98_000_000.0,
        registered_address="99 MG Road, Pune, Maharashtra 411001",
        directors=[{"name": "Rahul Deshmukh", "din": "04455667"}],
        incorporation_date="2012-05-15",
        annual_turnover_inr=500_000_000.0,
    )

    bids = [bid_colluding, bid_colluding_twin, bid_genuine]
    anomalies = IsolationForestAnomalyDetector.detect_anomalies(bids, tender)

    assert len(anomalies) == 3
    a1 = next(a for a in anomalies if a.bid_id == "bid-c1")
    a2 = next(a for a in anomalies if a.bid_id == "bid-c2")
    a3 = next(a for a in anomalies if a.bid_id == "bid-g3")

    # Colluding bidders must be flagged and classified as HIGH RISK
    assert a1.collusion_flag is True
    assert a1.risk_tier == "HIGH RISK"
    assert a2.collusion_flag is True
    assert a2.risk_tier == "HIGH RISK"

    # Genuine bidder must have no collusion flag
    assert a3.collusion_flag is False
