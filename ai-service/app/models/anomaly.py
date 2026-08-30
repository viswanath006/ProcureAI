"""
ProcureAI Phase 9 — Anti-Bias, Anomaly & Collusion Detection Data Contracts.
Core Principle: Detect suspicious patterns without making unsupported accusations.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BidAnomalyFactor(BaseModel):
    name: str
    code: str
    value: float
    is_anomaly: bool
    description: str


class BidAnomalyProfile(BaseModel):
    """Anomaly evaluation profile for a single bid using Isolation Forest."""
    bid_id: str
    company_name: str
    bid_reference: str
    bid_amount_inr: float
    anomaly_score: float = Field(description="Isolation forest score (negative indicates anomaly)")
    risk_tier: str = Field(description="NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK")
    is_outlier: bool
    price_deviation_pct: float
    unusual_pricing_flag: bool
    timing_anomaly_flag: bool
    price_similarity_flag: bool
    factors: List[BidAnomalyFactor] = []
    risk_indicators: List[str] = []


class CollusionPatternIndicator(BaseModel):
    """
    Identified market pattern.
    Rule: Standard output label 'Potential suspicious pattern detected'.
    Never accuses 'Company X is corrupt'.
    """
    pattern_type: str
    label: str = "Potential suspicious pattern detected"
    pattern_name: str
    severity: str = "MEDIUM"  # LOW | MEDIUM | HIGH
    involved_companies: List[str]
    evidence_summary: str
    metrics: Dict[str, Any] = {}


class DecisionOverrideRecord(BaseModel):
    """Historical decision override analysis."""
    tender_id: str
    tender_title: str
    ai_recommendation: str
    government_selection: str
    override: str = "YES"
    mandatory_reason: str
    decided_by: str
    decided_at: str


class OverridePatternAnalysis(BaseModel):
    """
    Detects repeated override patterns across decisions.
    Never accuses the officer.
    """
    officer_id: Optional[str] = None
    total_decisions: int = 0
    total_overrides: int = 0
    override_rate_pct: float = 0.0
    pattern_detected: bool = False
    pattern_label: Optional[str] = None  # "Potential decision-making pattern detected"
    pattern_summary: Optional[str] = None
    explainable_risk_indicators: List[str] = []


class TenderRiskAnalysisResponse(BaseModel):
    """Complete risk & collusion detection dossier for a tender."""
    tender_id: str
    bids_evaluated: int
    bid_anomalies: List[BidAnomalyProfile]
    collusion_indicators: List[CollusionPatternIndicator]
    has_collusion_pattern: bool
    summary: str
    disclaimer: str = (
        "ANTI-BIAS & ANOMALY SAFEGUARD: All flagged patterns represent statistical deviations and "
        "potential suspicious patterns requiring standard committee verification. The system strictly "
        "does not claim or prove corruption, bid-rigging, or administrative misconduct."
    )
