"""
ProcureAI Phase 7 Explainability & Rationale Generator.
Synthesizes transparent, human-readable explanations using strictly approved terminology.
"""

from typing import List, Dict
from ..models.evaluation import CriterionScore, BidderEvaluationInput


class ExplainabilityGenerator:
    """
    Generates structured, auditable rationale for bidder rankings and recommendations.
    Adheres strictly to the core principle: AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.
    """

    @staticmethod
    def generate_bidder_explanation(
        bid: BidderEvaluationInput,
        rank: int,
        total_score: float,
        scores: Dict[str, CriterionScore],
        strengths: List[str],
        risks: List[str],
        top_bid_name: str,
        margin: float = 0.0
    ) -> tuple[str, List[str], List[str]]:
        """
        Builds the narrative reasoning summary, key strengths, and key weaknesses.
        Returns: (reasoning_summary, strengths, weaknesses)
        """
        weaknesses: List[str] = []

        # Analyze individual factors
        price_sc = scores.get("price")
        tech_sc = scores.get("technical")
        exp_sc = scores.get("experience")
        fin_sc = scores.get("financial")
        perf_sc = scores.get("past_performance")
        risk_sc = scores.get("risk")

        if price_sc and price_sc.raw_score < 75.0:
            weaknesses.append(f"Commercial offer is higher relative to competitive benchmark (Score: {price_sc.weighted_score}/{price_sc.weight}).")
        if tech_sc and tech_sc.raw_score < 75.0:
            weaknesses.append("Technical methodology contains fewer verified domain certifications.")
        if exp_sc and exp_sc.raw_score < 75.0:
            weaknesses.append("Completed similar projects count is lower than leading competitors.")
        if fin_sc and fin_sc.raw_score < 75.0:
            weaknesses.append("Financial solvency buffer is tighter relative to overall contract scale.")
        if perf_sc and perf_sc.raw_score < 75.0:
            weaknesses.append("Historical completion rate or client satisfaction indicates areas for review.")
        if risk_sc and risk_sc.raw_score < 75.0:
            weaknesses.append("Execution timeline or pricing profile triggered operational Risk Indicators.")

        # Construct narrative summary
        if rank == 1:
            if margin > 4.0:
                summary = (
                    f"Best overall balance between price, technical capability, experience, "
                    f"financial capacity and historical performance (Decisive lead of {margin:.1f} pts)."
                )
            elif margin > 1.0:
                summary = (
                    f"Best overall balance between price, technical capability, experience, "
                    f"financial capacity and historical performance."
                )
            else:
                summary = (
                    f"Ranks #1 with narrow margin ({margin:.1f} pts). Demonstrates balanced composite scores "
                    f"across commercial, technical, and operational dimensions."
                )
        elif rank == 2:
            summary = (
                f"Strong alternative candidate. Achieved competitive composite score of {total_score:.1f}/100, "
                f"trailing {top_bid_name} primarily on "
                f"{'commercial pricing' if (price_sc and price_sc.raw_score < 80) else 'technical and operational depth'}."
            )
        elif rank == 3:
            summary = (
                f"Qualified reserve candidate with viable proposal ({total_score:.1f}/100), "
                f"exhibiting moderate variance in technical evaluation and risk factors."
            )
        else:
            summary = (
                f"Composite score ({total_score:.1f}/100) placed candidate below shortlist threshold. "
                f"Identified multiple areas where competitors demonstrated stronger capacity or commercial terms."
            )

        # Fallback empty safeguards
        if not strengths:
            strengths.append("Meets baseline mandatory qualification requirements.")
        if not weaknesses and rank > 1:
            weaknesses.append("Close competition across all evaluation factors.")

        return summary, strengths, weaknesses
