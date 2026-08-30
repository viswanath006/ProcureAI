"""
ProcureAI Phase 7 Metric Normalizer.
Converts heterogeneous procurement signals (pricing, experience, technical rubrics,
solvency, and performance) into standardized, comparable 0-100 scales.
"""

from typing import List, Dict, Any, Tuple
import math
from ..models.evaluation import BidderEvaluationInput, TenderEvaluationContext


class MetricNormalizer:
    """
    Normalizes diverse procurement metrics to standard 0–100 scales.
    Enforces that lower price gets competitive credit but abnormal dumping is penalized.
    """

    @staticmethod
    def normalize_price(
        bid: BidderEvaluationInput,
        all_bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext
    ) -> Tuple[float, List[str], List[str]]:
        """
        Normalizes commercial bid price to 0-100 scale.
        Uses standard procurement inverse ratio with abnormal low-bid safeguards.
        Returns: (normalized_score, evidence_list, risk_indicators)
        """
        budget = tender.estimated_budget_inr
        bid_price = bid.bid_amount_inr
        all_prices = [b.bid_amount_inr for b in all_bids if b.bid_amount_inr > 0]
        min_price = min(all_prices) if all_prices else bid_price

        evidence = []
        risks = []

        # 1. Base Score calculation (Inverse price ratio: min_price / bid_price * 100)
        if bid_price <= 0:
            return 0.0, ["Invalid commercial figure (<= 0)"], ["Critical Anomaly: Non-positive commercial bid"]

        # Inverse ratio relative to lowest compliant bid
        ratio_to_min = min_price / bid_price
        base_score = 100.0 * ratio_to_min

        # Also evaluate against estimated government budget
        budget_ratio = bid_price / budget

        evidence.append(f"Proposed Commercial Value: ₹{bid_price:,.2f}")
        evidence.append(f"Estimated Tender Budget: ₹{budget:,.2f} (Ratio: {budget_ratio:.1%})")
        evidence.append(f"Lowest Received Bid: ₹{min_price:,.2f}")

        # 2. Abnormal Low-Bid & Dumping Guard
        # If bid is < 60% of estimated budget, flag potential dumping/underbidding
        if budget_ratio < 0.60:
            dumping_penalty = min(25.0, (0.60 - budget_ratio) * 60)
            base_score = max(50.0, base_score - dumping_penalty)
            risks.append(
                f"Risk Indicator: Bid price is {budget_ratio:.1%} of estimated budget (abnormal low bid pattern). "
                "May indicate cost underestimation or execution delivery risk."
            )
        elif budget_ratio > 1.25:
            # Over budget penalty
            overage = budget_ratio - 1.0
            penalty = min(40.0, overage * 50)
            base_score = max(10.0, base_score - penalty)
            risks.append(f"Risk Indicator: Bid exceeds official estimated budget by {(budget_ratio - 1.0):.1%}.")

        score = max(0.0, min(100.0, round(base_score, 2)))
        return score, evidence, risks

    @staticmethod
    def normalize_technical(
        bid: BidderEvaluationInput,
        tender: TenderEvaluationContext
    ) -> Tuple[float, List[str], List[str]]:
        """
        Normalizes technical proposal and organizational capability to 0-100 scale.
        """
        score = 40.0  # Baseline
        evidence = []
        risks = []

        # 1. Technical Capabilities & Accreditations (Up to 35 pts)
        caps = bid.technical_capabilities or []
        cap_names = [c.get("name", "").lower() for c in caps]
        evidence.append(f"Registered Technical Accreditations: {len(caps)}")

        high_value_keywords = ["iso 9001", "iso 27001", "cmmi", "tier-3", "tier-4", "security", "cloud"]
        matched_caps = []
        for kw in high_value_keywords:
            if any(kw in name for name in cap_names):
                score += 5.0
                matched_caps.append(kw.upper())

        if matched_caps:
            evidence.append(f"Verified High-Value Accreditations: {', '.join(matched_caps)}")
        elif not caps:
            score -= 10.0
            risks.append("Risk Indicator: No formal technical accreditations registered.")

        # 2. Technical Proposal Quality (Up to 25 pts)
        proposal = (bid.technical_proposal or "").strip()
        proposal_len = len(proposal)

        if proposal_len > 400:
            score += 15.0
            evidence.append("Comprehensive technical methodology and architecture dossier provided.")
        elif proposal_len > 100:
            score += 8.0
            evidence.append("Standard technical approach outline provided.")
        else:
            score -= 10.0
            risks.append("Risk Indicator: Minimal or abbreviated technical proposal submitted.")

        # Keyword methodology analysis
        methodology_keywords = ["architecture", "methodology", "milestone", "testing", "security", "deliverable"]
        found_kw = [k for k in methodology_keywords if k in proposal.lower()]
        if len(found_kw) >= 4:
            score += 10.0
            evidence.append(f"Key methodology domains addressed: {', '.join(found_kw)}")

        final_score = max(0.0, min(100.0, round(score, 2)))
        return final_score, evidence, risks

    @staticmethod
    def normalize_experience(
        bid: BidderEvaluationInput,
        tender: TenderEvaluationContext
    ) -> Tuple[float, List[str], List[str]]:
        """
        Normalizes operational experience and project track record to 0-100 scale.
        """
        years = bid.years_in_operation or 0
        projects = bid.completed_projects_count or 0
        req_years = tender.required_experience_years or 3
        req_projects = tender.required_completed_projects or 2

        score = 30.0
        evidence = [f"Recorded Experience: {years} operational years, {projects} verified project(s)."]
        risks = []

        # 1. Operational Years (Up to 40 pts)
        if years >= req_years:
            score += 25.0
            # Additional years bonus (diminishing return)
            extra_years = years - req_years
            bonus = min(15.0, math.log1p(extra_years) * 6.0)
            score += bonus
            evidence.append(f"Operational Experience: {years} years (Exceeds requirement of {req_years} years)")
        else:
            shortfall = req_years - years
            score = max(10.0, score - shortfall * 8.0)
            risks.append(f"Risk Indicator: Operational experience ({years} yrs) falls short of target ({req_years} yrs).")

        # 2. Completed Projects Count & Scale (Up to 30 pts)
        if projects >= req_projects:
            score += 20.0
            extra_projects = projects - req_projects
            bonus = min(10.0, extra_projects * 2.0)
            score += bonus
            evidence.append(f"Completed Reference Projects: {projects} (Target: {req_projects})")
        else:
            risks.append(f"Risk Indicator: Completed projects count ({projects}) is below target ({req_projects}).")

        final_score = max(0.0, min(100.0, round(score, 2)))
        return final_score, evidence, risks

    @staticmethod
    def normalize_financial(
        bid: BidderEvaluationInput,
        tender: TenderEvaluationContext
    ) -> Tuple[float, List[str], List[str]]:
        """
        Normalizes financial capacity, annual turnover and net worth to 0-100 scale.
        """
        turnover = bid.annual_turnover_inr or 0.0
        net_worth = bid.net_worth_inr or 0.0
        budget = tender.estimated_budget_inr

        score = 35.0
        evidence = []
        risks = []

        # Turnover to budget ratio
        t_ratio = turnover / budget if budget > 0 else 1.0
        evidence.append(f"Audited Annual Turnover: ₹{turnover:,.2f} ({t_ratio:.1f}x tender budget)")

        if t_ratio >= 3.0:
            score += 35.0
            evidence.append("Exceptional financial cushion (>3x tender budget).")
        elif t_ratio >= 1.5:
            score += 25.0
            evidence.append("Solid financial cushion (>1.5x tender budget).")
        elif t_ratio >= 1.0:
            score += 15.0
            evidence.append("Adequate financial capacity meets tender requirements.")
        else:
            score -= 15.0
            risks.append(f"Risk Indicator: Annual turnover ({t_ratio:.1f}x budget) indicates tight operational liquidity.")

        # Net worth buffer (Up to 30 pts)
        nw_ratio = net_worth / budget if budget > 0 else 0.5
        if nw_ratio >= 1.0:
            score += 30.0
            evidence.append(f"Net Worth Buffer: ₹{net_worth:,.2f} ({nw_ratio:.1f}x budget)")
        elif nw_ratio >= 0.3:
            score += 20.0
            evidence.append(f"Healthy positive net worth: ₹{net_worth:,.2f}")
        elif nw_ratio > 0:
            score += 10.0
        else:
            score -= 15.0
            risks.append("Risk Indicator: Marginal or negative net worth reported.")

        final_score = max(0.0, min(100.0, round(score, 2)))
        return final_score, evidence, risks

    @staticmethod
    def normalize_past_performance(
        bid: BidderEvaluationInput
    ) -> Tuple[float, List[str], List[str]]:
        """
        Normalizes historical contract execution, ratings and completion records to 0-100 scale.
        """
        perf = bid.past_performance or {}
        rating = float(perf.get("avg_rating", 4.0))  # Default 4.0 out of 5 for neutral standing
        on_time = float(perf.get("on_time_completion_pct", 90.0))
        disputes = int(perf.get("contractual_disputes", 0))

        score = 0.0
        evidence = []
        risks = []

        # 1. Rating contribution (Up to 50 pts)
        rating_score = (rating / 5.0) * 50.0
        score += rating_score
        evidence.append(f"Client Satisfaction Index: {rating:.1f}/5.0")

        # 2. On-Time Completion (Up to 40 pts)
        on_time_score = (on_time / 100.0) * 40.0
        score += on_time_score
        evidence.append(f"Historical On-Time Delivery Record: {on_time:.1f}%")

        # 3. Clean record bonus / dispute penalty (10 pts)
        if disputes == 0:
            score += 10.0
            evidence.append("Zero recorded contractual defaults or arbitration disputes.")
        else:
            deduction = min(25.0, disputes * 12.0)
            score = max(10.0, score - deduction)
            risks.append(f"Risk Indicator: {disputes} past contractual dispute(s) on record.")

        final_score = max(0.0, min(100.0, round(score, 2)))
        return final_score, evidence, risks

    @staticmethod
    def normalize_risk(
        bid: BidderEvaluationInput,
        tender: TenderEvaluationContext,
        accumulated_risks: List[str]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Computes composite Risk Indicator score on 0-100 scale.
        100 = Minimal Risk (optimal, compliant). Deductions occur for detected anomalies.
        """
        base_score = 100.0
        evidence = []
        risks = list(accumulated_risks)

        # 1. Delivery timeline risk
        req_days = tender.required_delivery_days or 180
        proposed_days = bid.completion_days

        if proposed_days < req_days * 0.5:
            base_score -= 20.0
            risks.append(f"Risk Indicator: Proposed delivery ({proposed_days}d) is suspiciously aggressive (<50% of {req_days}d).")
        elif proposed_days > req_days * 1.15:
            base_score -= 15.0
            risks.append(f"Risk Indicator: Proposed delivery ({proposed_days}d) exceeds target window ({req_days}d).")
        else:
            evidence.append(f"Proposed schedule ({proposed_days} days) aligns with operational feasibility.")

        # 2. Deductions for accumulated risks from other domains
        risk_count = len(accumulated_risks)
        if risk_count > 0:
            penalty = min(40.0, risk_count * 10.0)
            base_score -= penalty
            evidence.append(f"{risk_count} operational risk indicator(s) evaluated.")
        else:
            evidence.append("Zero critical compliance or financial anomalies identified.")

        final_score = max(0.0, min(100.0, round(base_score, 2)))
        return final_score, evidence, risks
