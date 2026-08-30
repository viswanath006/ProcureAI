"""
ProcureAI Phase 7 Synthetic Benchmark Data Generator.
Creates diverse, labeled synthetic evaluation datasets for training, automated tests,
and platform demonstration without fabricating real government records.
"""

from typing import List, Tuple
from ..models.evaluation import (
    BidderEvaluationInput,
    TenderEvaluationContext,
    EvaluationWeights,
)


class SyntheticBenchmarkGenerator:
    """
    Generates realistic, standardized benchmark evaluation datasets.
    All records are clearly labeled as [SYNTHETIC DATASET].
    """

    @staticmethod
    def generate_benchmark_suite(
        estimated_budget_inr: float = 100_000_000.0,  # 10 Cr INR
        required_days: int = 180,
    ) -> Tuple[TenderEvaluationContext, List[BidderEvaluationInput]]:
        """
        Creates a benchmark tender and 3 distinct bidder personas:
        1. Alpha: Balanced high-quality proposal (Optimal composite score)
        2. Beta: Aggressive low-price underbidder (Wins price, loses on quality/risk)
        3. Gamma: Premium incumbent with higher price (Solid credentials, high cost)
        """
        tender = TenderEvaluationContext(
            tender_id="synth-tender-2026-cloud",
            reference_number="SYNTH-TDR-2026-CLOUD-01",
            title="[SYNTHETIC BENCHMARK] Government Cloud Infrastructure & Resiliency Suite",
            estimated_budget_inr=estimated_budget_inr,
            required_delivery_days=required_days,
            required_experience_years=5,
            required_completed_projects=3,
            required_turnover_inr=30_000_000.0,
            technical_requirements=[
                "ISO 27001 Information Security Management",
                "CMMI Level 3 or higher Software Engineering",
                "Tier-3 Certified Data Center Operations",
                "24x7 Multi-Zone Disaster Recovery",
            ]
        )

        # ── Persona 1: Alpha Technologies (Balanced Leader) ─────────────────────
        bidder_alpha = BidderEvaluationInput(
            bid_id="synth-bid-alpha-001",
            bid_reference="SYNTH-BID-2026-001",
            company_id="synth-comp-alpha",
            company_name="[SYNTHETIC DATASET] Alpha Enterprise Solutions Ltd",
            bid_amount_inr=estimated_budget_inr * 0.92,  # ₹9.2 Cr (Reasonable discount)
            completion_days=required_days - 15,          # 165 days (Feasible schedule)
            technical_proposal=(
                "Comprehensive cloud migration architecture using containerized microservices, "
                "automated CI/CD pipelines, automated failover across two geographic availability zones, "
                "and ISO 27001-aligned zero-trust security controls with full audit logging."
            ),
            annual_turnover_inr=750_000_000.0,           # ₹75 Cr (7.5x budget)
            net_worth_inr=280_000_000.0,                 # ₹28 Cr
            years_in_operation=9,
            completed_projects_count=5,
            technical_capabilities=[
                {"name": "ISO 27001 Certified", "category": "security", "level": "enterprise"},
                {"name": "CMMI Level 5", "category": "process", "level": "expert"},
                {"name": "Tier-3 Cloud Infrastructure", "category": "hosting", "level": "verified"},
            ],
            compliance_info={"is_debarred": False, "litigation_count": 0},
            past_performance={
                "avg_rating": 4.8,
                "on_time_completion_pct": 97.5,
                "contractual_disputes": 0,
            },
            eligibility_passed=True,
            is_synthetic=True
        )

        # ── Persona 2: Beta Innovations (Aggressive Low-Price Dumping Risk) ─────
        bidder_beta = BidderEvaluationInput(
            bid_id="synth-bid-beta-002",
            bid_reference="SYNTH-BID-2026-002",
            company_id="synth-comp-beta",
            company_name="[SYNTHETIC DATASET] Beta Cloudworks Pvt Ltd",
            bid_amount_inr=estimated_budget_inr * 0.62,  # ₹6.2 Cr (Significantly below budget, dumping risk)
            completion_days=int(required_days * 0.45),   # 81 days (Unrealistically compressed timeline)
            technical_proposal=(
                "Standard cloud server deployment. Migration will be carried out using basic scripts "
                "with standard monitoring tools."
            ),
            annual_turnover_inr=220_000_000.0,           # ₹22 Cr (Marginal buffer)
            net_worth_inr=45_000_000.0,                  # ₹4.5 Cr
            years_in_operation=3,
            completed_projects_count=2,
            technical_capabilities=[
                {"name": "ISO 9001 Quality Management", "category": "quality", "level": "standard"},
            ],
            compliance_info={"is_debarred": False, "litigation_count": 0},
            past_performance={
                "avg_rating": 3.8,
                "on_time_completion_pct": 81.0,
                "contractual_disputes": 1,
            },
            eligibility_passed=True,
            is_synthetic=True
        )

        # ── Persona 3: Gamma Systems (Premium Established Incumbent) ───────────
        bidder_gamma = BidderEvaluationInput(
            bid_id="synth-bid-gamma-003",
            bid_reference="SYNTH-BID-2026-003",
            company_id="synth-comp-gamma",
            company_name="[SYNTHETIC DATASET] Gamma National Technologies Corp",
            bid_amount_inr=estimated_budget_inr * 1.09,  # ₹10.9 Cr (Above budget, expensive)
            completion_days=required_days + 10,          # 190 days
            technical_proposal=(
                "Enterprise multi-cloud architecture with legacy system integration, "
                "formal change management methodology, dedicated on-site personnel, and 99.999% SLA."
            ),
            annual_turnover_inr=1_250_000_000.0,         # ₹125 Cr
            net_worth_inr=520_000_000.0,                 # ₹52 Cr
            years_in_operation=16,
            completed_projects_count=11,
            technical_capabilities=[
                {"name": "ISO 27001 Certified", "category": "security", "level": "enterprise"},
                {"name": "CMMI Level 5", "category": "process", "level": "expert"},
                {"name": "Tier-4 Certified Operations", "category": "hosting", "level": "top-tier"},
            ],
            compliance_info={"is_debarred": False, "litigation_count": 0},
            past_performance={
                "avg_rating": 4.6,
                "on_time_completion_pct": 93.0,
                "contractual_disputes": 0,
            },
            eligibility_passed=True,
            is_synthetic=True
        )

        return tender, [bidder_alpha, bidder_beta, bidder_gamma]
