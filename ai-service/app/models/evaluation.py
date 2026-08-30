"""
ProcureAI Phase 7 Evaluation Engine Data Models.
Pydantic schemas for multi-factor weighted scoring and evaluation results.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, model_validator
from datetime import datetime, timezone
import uuid


class EvaluationWeights(BaseModel):
    """
    Configurable percentage weights for the 6 evaluation factors.
    Must sum to exactly 100.0.
    """
    price: float = Field(default=40.0, ge=0.0, le=100.0, description="Price Score weight (%)")
    technical: float = Field(default=20.0, ge=0.0, le=100.0, description="Technical Capability weight (%)")
    experience: float = Field(default=15.0, ge=0.0, le=100.0, description="Operational Experience weight (%)")
    financial: float = Field(default=10.0, ge=0.0, le=100.0, description="Financial Capacity weight (%)")
    past_performance: float = Field(default=10.0, ge=0.0, le=100.0, description="Past Performance weight (%)")
    risk: float = Field(default=5.0, ge=0.0, le=100.0, description="Risk Indicators weight (%)")

    @model_validator(mode="after")
    def validate_sum_100(self):
        total = round(self.price + self.technical + self.experience + self.financial + self.past_performance + self.risk, 2)
        if abs(total - 100.0) > 0.05:
            raise ValueError(f"Evaluation weights must sum to exactly 100%. Current sum: {total}%")
        return self


class BidderEvaluationInput(BaseModel):
    """Normalized input representing an eligible bidder proposal."""
    bid_id: str
    bid_reference: str
    company_id: str
    company_name: str
    bid_amount_inr: float = Field(gt=0, description="Commercial bid figure in INR")
    completion_days: int = Field(gt=0, description="Proposed timeline in calendar days")
    technical_proposal: Optional[str] = ""
    financial_proposal: Optional[str] = ""
    annual_turnover_inr: Optional[float] = 0.0
    net_worth_inr: Optional[float] = 0.0
    years_in_operation: Optional[int] = 0
    completed_projects_count: Optional[int] = 0
    technical_capabilities: Optional[List[Dict[str, Any]]] = []
    compliance_info: Optional[Dict[str, Any]] = {}
    past_performance: Optional[Dict[str, Any]] = {}
    eligibility_passed: bool = True
    is_synthetic: bool = False


class TenderEvaluationContext(BaseModel):
    """Metadata regarding the tender being evaluated."""
    tender_id: str
    reference_number: str
    title: str
    estimated_budget_inr: float = Field(gt=0)
    required_delivery_days: Optional[int] = None
    required_experience_years: Optional[int] = 0
    required_completed_projects: Optional[int] = 0
    required_turnover_inr: Optional[float] = 0.0
    technical_requirements: Optional[List[str]] = []


class EvaluationRequest(BaseModel):
    """API payload to trigger evaluation."""
    tender: TenderEvaluationContext
    bids: List[BidderEvaluationInput]
    weights: Optional[EvaluationWeights] = None


class CriterionScore(BaseModel):
    """Detailed score for one of the 6 evaluation factors."""
    code: str
    name: str
    raw_score: float = Field(ge=0.0, le=100.0, description="Normalized score on 0-100 scale")
    weight: float = Field(ge=0.0, le=100.0, description="Percentage weight")
    weighted_score: float = Field(ge=0.0, description="Contribution to total score: raw_score * weight / 100")
    confidence: float = Field(ge=0.0, le=1.0, description="AI confidence index")
    explanation: str
    evidence: List[str] = []
    risk_indicators: List[str] = []


class FactorExplanation(BaseModel):
    """Detailed XAI factor attribution for non-technical officials."""
    factor: str
    title: str
    rating_label: str  # Excellent | Very strong | Strong | Good | Moderate | Low
    raw_score: float
    weighted_score: float
    weight: float
    shap_value: float  # Marginal contribution relative to benchmark baseline
    impact: str        # positive | negative | neutral
    summary: str


class BidderExplanationObject(BaseModel):
    """
    Structured XAI Explanation Object answering:
    'Why did the AI recommend this company?'
    Tailored for non-technical government officials.
    """
    bid_id: str
    bid_reference: str
    company_name: str
    rank: int
    total_score: float
    why_summary: str
    ratings: Dict[str, str]
    positive_contributors: List[str]
    negative_contributors: List[str]
    factor_explanations: List[FactorExplanation]
    shap_attributions: Dict[str, float]
    baseline_expected_score: float
    plain_language_narrative: str


class BidderEvaluationResult(BaseModel):
    """Comprehensive score dossier for a single bidder."""
    bid_id: str
    bid_reference: str
    company_name: str
    rank: int
    total_score: float = Field(ge=0.0, le=100.0)
    recommendation: str = Field(description="award | shortlist | reserve | not_recommended")
    confidence_score: float = Field(ge=0.0, le=1.0)
    confidence_level: str = Field(description="HIGH | MEDIUM | LOW")
    reasoning_summary: str
    criterion_scores: Dict[str, CriterionScore]
    key_strengths: List[str] = []
    key_weaknesses: List[str] = []
    risk_indicators: List[str] = []
    is_synthetic: bool = False
    explanation: Optional[BidderExplanationObject] = None


class EvaluationResponse(BaseModel):
    """Complete evaluation report for a tender."""
    tender_id: str
    evaluation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    bids_evaluated: int
    weights_used: EvaluationWeights
    top_recommendation: Optional[BidderEvaluationResult] = None
    rankings: List[BidderEvaluationResult]
    summary_notes: str
    disclaimer: str = (
        "AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS. "
        "Recommendations and risk indicators are decision-support outputs based on quantifiable "
        "tender criteria and do not prove legal compliance, corruption, or absolute fairness."
    )


class SyntheticBenchmarkRequest(BaseModel):
    """Request to generate synthetic bids and evaluate them."""
    tender: Optional[TenderEvaluationContext] = None
    bids_count: int = Field(default=3, ge=2, le=10)
    weights: Optional[EvaluationWeights] = None
