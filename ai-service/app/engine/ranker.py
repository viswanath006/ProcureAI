"""
ProcureAI Phase 7 Bidder Ranker & Recommendation Engine.
Orchestrates scoring, rankings, confidence assessments, and explainable evaluation responses.
"""

from typing import List, Dict, Any, Optional
from ..models.evaluation import (
    BidderEvaluationInput,
    TenderEvaluationContext,
    EvaluationWeights,
    BidderEvaluationResult,
    EvaluationResponse,
)
from .scorer import MultiFactorScorer
from .explainer import ExplainabilityGenerator
from .xai import ShapExplainabilityEngine


class BidderRanker:
    """
    Ranks eligible bidders based on weighted multi-factor scores, evaluates quality confidence,
    and produces structured evaluation dossiers.
    """

    def __init__(self, weights: Optional[EvaluationWeights] = None):
        self.weights = weights or EvaluationWeights()
        self.scorer = MultiFactorScorer(self.weights)

    def evaluate_tender(
        self,
        tender: TenderEvaluationContext,
        bids: List[BidderEvaluationInput]
    ) -> EvaluationResponse:
        """
        Executes full Phase 7 evaluation for all eligible bids submitted to a tender.
        """
        if not bids:
            return EvaluationResponse(
                tender_id=tender.tender_id,
                bids_evaluated=0,
                weights_used=self.weights,
                top_recommendation=None,
                rankings=[],
                summary_notes="No eligible bids available for evaluation.",
            )

        # 1. Score each bidder independently
        scored_entries = []
        for bid in bids:
            total_score, criterion_scores, strengths, risks = self.scorer.evaluate_bid(
                bid=bid,
                all_bids=bids,
                tender=tender
            )
            scored_entries.append({
                "bid": bid,
                "total_score": total_score,
                "criterion_scores": criterion_scores,
                "strengths": strengths,
                "risks": risks,
            })

        # 2. Sort descending by total_score (ties broken by technical score, then price)
        scored_entries.sort(
            key=lambda x: (
                x["total_score"],
                x["criterion_scores"]["technical"].weighted_score,
                x["criterion_scores"]["price"].weighted_score,
            ),
            reverse=True
        )

        # 3. Calculate margin of victory and confidence
        top_score = scored_entries[0]["total_score"]
        second_score = scored_entries[1]["total_score"] if len(scored_entries) > 1 else 0.0
        lead_margin = round(top_score - second_score, 2)
        top_bid_name = scored_entries[0]["bid"].company_name

        # 4. Compute SHAP feature attributions
        try:
            baseline_score, shap_dicts = ShapExplainabilityEngine.compute_shap_attributions(
                scored_entries, self.weights
            )
        except Exception:
            baseline_score = 72.0
            shap_dicts = [{} for _ in scored_entries]

        # 5. Assemble final ranking dossiers
        rankings: List[BidderEvaluationResult] = []
        for idx, entry in enumerate(scored_entries):
            rank = idx + 1
            bid = entry["bid"]
            total_score = entry["total_score"]
            crit_scores = entry["criterion_scores"]
            strengths = entry["strengths"]
            risks = entry["risks"]
            shap_dict = shap_dicts[idx] if idx < len(shap_dicts) else {}

            # Recommendation tag
            if rank == 1:
                recommendation = "award"
            elif rank == 2:
                recommendation = "shortlist"
            elif rank == 3:
                recommendation = "reserve"
            else:
                recommendation = "not_recommended"

            # Confidence assessment
            # Base confidence from factor confidences
            factor_confidences = [cs.confidence for cs in crit_scores.values()]
            base_conf = sum(factor_confidences) / len(factor_confidences)

            if rank == 1:
                if lead_margin >= 3.0:
                    conf_score = min(0.98, base_conf + 0.04)
                    conf_level = "HIGH"
                elif lead_margin >= 1.0:
                    conf_score = min(0.95, base_conf)
                    conf_level = "HIGH"
                else:
                    conf_score = max(0.80, base_conf - 0.05)
                    conf_level = "MEDIUM"
            else:
                conf_score = base_conf
                conf_level = "HIGH" if conf_score >= 0.90 else "MEDIUM"

            # Generate narrative rationale
            summary, final_strengths, weaknesses = ExplainabilityGenerator.generate_bidder_explanation(
                bid=bid,
                rank=rank,
                total_score=total_score,
                scores=crit_scores,
                strengths=strengths,
                risks=risks,
                top_bid_name=top_bid_name,
                margin=lead_margin if rank == 1 else 0.0
            )

            # Generate structured XAI Explanation Object
            xai_explanation = ShapExplainabilityEngine.generate_explanation(
                bid=bid,
                rank=rank,
                total_score=total_score,
                criterion_scores=crit_scores,
                shap_dict=shap_dict,
                baseline_score=baseline_score
            )

            result = BidderEvaluationResult(
                bid_id=bid.bid_id,
                bid_reference=bid.bid_reference,
                company_name=bid.company_name,
                rank=rank,
                total_score=total_score,
                recommendation=recommendation,
                confidence_score=round(conf_score, 3),
                confidence_level=conf_level,
                reasoning_summary=summary,
                criterion_scores=crit_scores,
                key_strengths=final_strengths,
                key_weaknesses=weaknesses,
                risk_indicators=risks,
                is_synthetic=bid.is_synthetic,
                explanation=xai_explanation
            )
            rankings.append(result)

        top_rec = rankings[0] if rankings else None
        summary_notes = (
            f"Evaluated {len(bids)} eligible bidder proposals against 6 weighted criteria. "
            f"Top recommendation: {top_rec.company_name} (Overall Score: {top_rec.total_score:.1f}/100, "
            f"Lead Margin: {lead_margin:.1f} pts, Confidence: {top_rec.confidence_level})."
        )

        return EvaluationResponse(
            tender_id=tender.tender_id,
            bids_evaluated=len(bids),
            weights_used=self.weights,
            top_recommendation=top_rec,
            rankings=rankings,
            summary_notes=summary_notes,
        )
