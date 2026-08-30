"""
ProcureAI AI Service — Phase 7: Multi-Criteria Tender Evaluation Engine

Core Principle: AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.

Features:
- Configurable 6-factor weighted scoring (Price 40%, Technical 20%, Experience 15%, Financial 10%, Performance 10%, Risk 5%)
- Metric normalization to common 0-100 scales
- Non-lowest-bidder balance protection against abnormal dumping
- Explainable recommendation generation with confidence indicator
- Synthetic benchmark generation clearly labeled as [SYNTHETIC DATASET]
"""

from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models.evaluation import (
    EvaluationWeights,
    EvaluationRequest,
    EvaluationResponse,
    SyntheticBenchmarkRequest,
)
from .engine.ranker import BidderRanker
from .engine.anomaly import IsolationForestAnomalyDetector
from .engine.collusion import CollusionPatternDetector
from .models.anomaly import TenderRiskAnalysisResponse
from .synthetic.generator import SyntheticBenchmarkGenerator

app = FastAPI(
    title="ProcureAI Evaluation Engine",
    description="AI-Assisted Transparent, Weighted Multi-Criteria Procurement Evaluation Engine (Phase 7)",
    version="1.7.0-phase7",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    capabilities: list[str]


class ServiceInfo(BaseModel):
    name: str
    tagline: str
    principle: str
    phase: str
    default_weights: Dict[str, float]


class PingResponse(BaseModel):
    message: str
    from_service: str
    timestamp: str


@app.get("/", response_model=ServiceInfo)
async def root() -> ServiceInfo:
    return ServiceInfo(
        name="ProcureAI Evaluation Service",
        tagline="Intelligent. Fair. Transparent.",
        principle="AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.",
        phase="Phase 7 — Multi-Criteria Evaluation Engine",
        default_weights={
            "price": 40.0,
            "technical": 20.0,
            "experience": 15.0,
            "financial": 10.0,
            "past_performance": 10.0,
            "risk": 5.0,
        },
    )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="procureai-ai-service",
        version="1.7.0-phase7",
        timestamp=datetime.now(timezone.utc).isoformat(),
        capabilities=[
            "health_check",
            "ping",
            "multi_criteria_evaluation",
            "metric_normalization_0_100",
            "abnormal_low_bid_guard",
            "explainable_recommendations",
            "confidence_indexing",
            "synthetic_benchmarking",
        ],
    )


@app.get("/ping", response_model=PingResponse)
async def ping() -> PingResponse:
    return PingResponse(
        message="pong",
        from_service="procureai-ai-service",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/capabilities")
async def get_capabilities() -> Dict[str, Any]:
    """Returns supported evaluation factors and default configuration weights."""
    return {
        "engine": "ProcureAI MultiFactorScorer v1.7",
        "supported_factors": [
            {
                "code": "price",
                "name": "Price Score",
                "default_weight": 40.0,
                "description": "Inverse relative competitiveness scaled against estimated budget with abnormal dumping safeguards.",
            },
            {
                "code": "technical",
                "name": "Technical Capability",
                "default_weight": 20.0,
                "description": "Technical proposal methodology, architecture depth, and verified accreditations.",
            },
            {
                "code": "experience",
                "name": "Experience",
                "default_weight": 15.0,
                "description": "Operational years in business and count of verified completed reference projects.",
            },
            {
                "code": "financial",
                "name": "Financial Capacity",
                "default_weight": 10.0,
                "description": "Audited annual turnover and net worth ratios relative to tender commitment.",
            },
            {
                "code": "past_performance",
                "name": "Past Performance",
                "default_weight": 10.0,
                "description": "Historical on-time completion rates, verified ratings, and absence of contractual disputes.",
            },
            {
                "code": "risk",
                "name": "Risk Indicators",
                "default_weight": 5.0,
                "description": "Composite operational risk assessment covering schedule compression and anomaly signals.",
            },
        ],
        "weight_sum_required": 100.0,
    }


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_bids(request: EvaluationRequest) -> EvaluationResponse:
    """
    Executes multi-criteria evaluation of submitted bids against tender context.
    Normalized to a common 0–100 scale; balances commercial pricing with quality & risk.
    """
    try:
        ranker = BidderRanker(weights=request.weights)
        response = ranker.evaluate_tender(tender=request.tender, bids=request.bids)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation engine failed: {str(e)}",
        )


@app.post("/synthetic/benchmark", response_model=EvaluationResponse)
async def evaluate_synthetic_benchmark(
    request: SyntheticBenchmarkRequest,
) -> EvaluationResponse:
    """
    Generates and evaluates a synthetic benchmark dataset with 3 distinct bidder personas.
    Clearly labeled with [SYNTHETIC DATASET].
    """
    try:
        # Generate benchmark suite
        synth_tender, synth_bids = SyntheticBenchmarkGenerator.generate_benchmark_suite()
        
        # Override with requested tender context if provided
        if request.tender:
            synth_tender = request.tender

        # Execute evaluation
        ranker = BidderRanker(weights=request.weights)
        response = ranker.evaluate_tender(tender=synth_tender, bids=synth_bids)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthetic benchmark failed: {str(e)}",
        )


@app.post("/explain")
async def explain_bids(request: EvaluationRequest) -> Dict[str, Any]:
    """
    Phase 8: Explainable AI endpoint.
    Answers: 'Why did the AI recommend this company?'
    Returns structured explanation objects for all evaluated bidders.
    """
    try:
        ranker = BidderRanker(weights=request.weights)
        response = ranker.evaluate_tender(tender=request.tender, bids=request.bids)
        
        explanations = [
            r.explanation.dict() if r.explanation else {}
            for r in response.rankings
        ]
        
        return {
            "tender_id": request.tender.tender_id,
            "bids_explained": len(explanations),
            "top_recommendation": response.top_recommendation.company_name if response.top_recommendation else None,
            "explanations": explanations,
            "baseline_expected_score": explanations[0].get("baseline_expected_score") if explanations else 72.0,
            "disclaimer": response.disclaimer,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability engine failed: {str(e)}",
        )


@app.post("/risk/analyze", response_model=TenderRiskAnalysisResponse)
async def analyze_tender_risks(request: EvaluationRequest) -> TenderRiskAnalysisResponse:
    """
    Phase 9: Anti-Bias, Anomaly Detection & Collusion Tracking.
    Runs Isolation Forest on submitted bids (NORMAL | LOW | MEDIUM | HIGH RISK)
    and identifies suspicious collusion patterns without unsupported accusations.
    """
    try:
        # 1. Run Isolation Forest anomaly detection
        anomalies = IsolationForestAnomalyDetector.detect_anomalies(
            bids=request.bids,
            tender=request.tender
        )

        # 2. Run collusion & cartel pattern detection
        collusion_indicators = CollusionPatternDetector.analyze_patterns(
            bids=request.bids,
            tender=request.tender
        )

        has_collusion = len(collusion_indicators) > 0
        high_anomalies = [a for a in anomalies if a.risk_tier == "HIGH RISK"]

        summary = (
            f"Evaluated {len(request.bids)} bids for statistical anomalies and collusion signals. "
            f"Flagged {len(high_anomalies)} high-risk bid anomalies and "
            f"{len(collusion_indicators)} potential suspicious market patterns."
        )

        return TenderRiskAnalysisResponse(
            tender_id=request.tender.tender_id,
            bids_evaluated=len(request.bids),
            bid_anomalies=anomalies,
            collusion_indicators=collusion_indicators,
            has_collusion_pattern=has_collusion,
            summary=summary,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk analysis engine failed: {str(e)}",
        )
