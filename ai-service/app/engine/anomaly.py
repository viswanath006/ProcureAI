"""
ProcureAI Phase 9 — Feature 1: Bid Anomaly Detection using Isolation Forest.
Analyzes:
1. Bid price deviation
2. Unusual pricing
3. Repeated bid patterns
4. Participation frequency
5. Unusual timing
6. Price similarity
7. Historical patterns
Output: NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import IsolationForest

from ..models.anomaly import BidAnomalyProfile, BidAnomalyFactor
from ..models.evaluation import BidderEvaluationInput, TenderEvaluationContext
from .collusion import CollusionPatternDetector


def _calculate_company_age_days(bid: BidderEvaluationInput) -> float:
    """Calculates company age in days at evaluation time from incorporation_date or operations."""
    if bid.incorporation_date:
        raw = str(bid.incorporation_date).strip()
        if "T" in raw:
            raw = raw.split("T")[0]
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d.%m.%Y"):
            try:
                dt = datetime.strptime(raw[:10], fmt)
                age = (datetime.now(timezone.utc).date() - dt.date()).days
                return max(0.0, float(age))
            except ValueError:
                continue

    if bid.osint_profile and isinstance(bid.osint_profile, dict):
        inc = bid.osint_profile.get("incorporation_date")
        if inc:
            raw = str(inc).strip()
            if "T" in raw:
                raw = raw.split("T")[0]
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d.%m.%Y"):
                try:
                    dt = datetime.strptime(raw[:10], fmt)
                    age = (datetime.now(timezone.utc).date() - dt.date()).days
                    return max(0.0, float(age))
                except ValueError:
                    continue

    years = float(bid.years_in_operation) if bid.years_in_operation is not None else 5.0
    return max(0.0, years * 365.0)


class IsolationForestAnomalyDetector:
    """
    Evaluates multi-dimensional bid features using scikit-learn Isolation Forest
    and heuristic validation to classify bids into standard risk tiers.
    Extended with OSINT features: cross-bidder collusion flag and statutory company age.
    """

    @classmethod
    def extract_features(
        cls,
        bid: BidderEvaluationInput,
        all_bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext,
        collusion_flag: bool = False
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Extracts 9 analytical dimensions (10 features) for a bid:
        1. Price deviation vs median and budget
        2. Unusual pricing digits / roundness
        3. Repeated bid margin
        4. Participation frequency & capacity ratio
        5. Submission timing anomaly
        6. Nearest price similarity ratio
        7. Historical operational track record deviation
        8. Cross-bidder collusion flag (shared address/directors)
        9. Company age in days at bid time
        """
        prices = [b.bid_amount_inr for b in all_bids if b.bid_amount_inr > 0]
        median_price = float(np.median(prices)) if prices else float(bid.bid_amount_inr)
        budget = float(tender.estimated_budget_inr) if tender.estimated_budget_inr > 0 else 100_000_000.0

        price = float(bid.bid_amount_inr)

        # 1. Price deviation (%)
        dev_vs_median = (price - median_price) / max(median_price, 1.0)
        dev_vs_budget = (price - budget) / budget

        # 2. Unusual pricing check: repeating non-zero digits (e.g. 99999999) or exact budget match
        digits_str = str(int(price))
        last4 = digits_str[-4:] if len(digits_str) >= 4 else ""
        is_repeating_digits = len(digits_str) >= 6 and last4 and last4[0] != '0' and len(set(last4)) <= 1
        is_exact_budget = abs(price - budget) < 1.0
        unusual_pricing_score = 1.0 if (is_repeating_digits or is_exact_budget) else 0.0

        # 3. Repeated bid pattern / decimal clustering
        decimal_tail = round(price % 1000, 2)
        repeated_pattern_score = 1.0 if decimal_tail in [999.0, 777.0, 500.0] else 0.0

        # 4. Participation frequency / turnover capacity ratio
        turnover = float(bid.annual_turnover_inr or 0.0)
        capacity_ratio = turnover / max(budget, 1.0)
        capacity_feature = min(5.0, capacity_ratio)

        # 5. Timing anomaly (suspicious schedule compression or rapid turnaround)
        req_days = float(tender.required_delivery_days or 180)
        comp_days = float(bid.completion_days or req_days)
        timing_ratio = comp_days / max(req_days, 1.0)
        timing_anomaly = 1.0 if (timing_ratio < 0.5 or timing_ratio > 1.25) else 0.0

        # 6. Price similarity (nearest neighbor delta %)
        other_prices = [p for p in prices if abs(p - price) > 0.01]
        if other_prices:
            min_dist = min([abs(p - price) for p in other_prices])
            min_dist_pct = min_dist / max(price, 1.0)
        else:
            min_dist_pct = 0.20  # default safe if single bid
        similarity_feature = 1.0 if min_dist_pct < 0.005 else (0.5 if min_dist_pct < 0.015 else 0.0)

        # 7. Historical pattern deviation (past performance rating vs commercial bid aggressiveness)
        perf = bid.past_performance or {}
        rating = float(perf.get("avg_rating", 4.0))
        historical_feature = 1.0 if (rating < 3.5 and dev_vs_budget < -0.3) else 0.0

        # 8 & 9: OSINT Enrichment Features
        collusion_val = 1.0 if (collusion_flag or getattr(bid, "collusion_flag", False)) else 0.0
        company_age_days = _calculate_company_age_days(bid)

        feature_vector = np.array([
            abs(dev_vs_budget),
            abs(dev_vs_median),
            unusual_pricing_score,
            repeated_pattern_score,
            capacity_feature,
            timing_anomaly,
            similarity_feature,
            historical_feature,
            collusion_val,
            company_age_days,
        ], dtype=np.float64)

        metadata = {
            "dev_vs_budget_pct": round(dev_vs_budget * 100, 2),
            "dev_vs_median_pct": round(dev_vs_median * 100, 2),
            "unusual_pricing": bool(unusual_pricing_score > 0),
            "timing_anomaly": bool(timing_anomaly > 0),
            "min_dist_pct": round(min_dist_pct * 100, 2) if other_prices else 20.0,
            "is_price_similar": bool(similarity_feature > 0),
            "collusion_flag": bool(collusion_val > 0),
            "company_age_days": round(company_age_days, 1),
        }

        return feature_vector, metadata

    @classmethod
    def detect_anomalies(
        cls,
        bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext
    ) -> List[BidAnomalyProfile]:
        """
        Executes Isolation Forest anomaly detection on all bids in the tender.
        Includes cross-bidder collusion verification and statutory company age features.
        """
        if not bids:
            return []

        # 1. Run cross-bidder OSINT collusion detection upfront
        collusion_map, collusion_indicators = CollusionPatternDetector.detect_cross_bidder_osint_collusion(bids)

        # 2. Extract 10 features for all bids
        vectors = []
        metas = []
        for bid in bids:
            c_info = collusion_map.get(bid.bid_id, {})
            is_c = bool(c_info.get("collusion_flag", False) or getattr(bid, "collusion_flag", False))
            vec, meta = cls.extract_features(bid, bids, tender, collusion_flag=is_c)
            vectors.append(vec)
            metas.append(meta)

        X = np.array(vectors)

        # 3. Synthesize typical procurement background distribution for calibration (10 dims)
        np.random.seed(42)
        n_background = 40
        # Background baseline: typical tender with 0 collusion, average company age ~3650 days (~10 yrs)
        bg_loc = [0.08, 0.05, 0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 3650.0]
        bg_scale = [0.05, 0.04, 0.1, 0.1, 1.0, 0.1, 0.05, 0.05, 0.05, 1500.0]
        X_bg = np.random.normal(loc=bg_loc, scale=bg_scale, size=(n_background, 10))
        X_bg[:, 0:9] = np.clip(X_bg[:, 0:9], 0.0, 10.0)
        X_bg[:, 9] = np.clip(X_bg[:, 9], 100.0, 30000.0)

        # Combine background and current bids
        X_train = np.vstack([X_bg, X])

        # Fit Isolation Forest
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.15,
            random_state=42
        )
        iso_forest.fit(X_train)

        # Predict on current bids
        raw_scores = iso_forest.decision_function(X)

        profiles: List[BidAnomalyProfile] = []
        for idx, bid in enumerate(bids):
            score = float(raw_scores[idx])
            meta = metas[idx]
            price_dev = meta["dev_vs_budget_pct"]

            risks: List[str] = []
            factors: List[BidAnomalyFactor] = []

            # 1. Price deviation factor
            is_price_dev = abs(price_dev) >= 30.0
            if price_dev <= -35.0:
                risks.append(f"Risk Indicator: Price is {abs(price_dev):.1f}% below estimated budget (abnormal low bid pattern).")
            elif price_dev >= 25.0:
                risks.append(f"Risk Indicator: Price exceeds estimated budget by {price_dev:.1f}%.")
            factors.append(BidAnomalyFactor(
                name="Bid Price Deviation",
                code="price_deviation",
                value=price_dev,
                is_anomaly=is_price_dev,
                description=f"Price deviates by {price_dev:+.1f}% from budget."
            ))

            # 2. Unusual pricing factor
            if meta["unusual_pricing"]:
                risks.append("Risk Indicator: Bid contains unusual round-number or repeating digit pricing patterns.")
            factors.append(BidAnomalyFactor(
                name="Unusual Pricing",
                code="unusual_pricing",
                value=1.0 if meta["unusual_pricing"] else 0.0,
                is_anomaly=meta["unusual_pricing"],
                description="Presence of repeating or perfectly round pricing numbers."
            ))

            # 3. Timing anomaly factor
            if meta["timing_anomaly"]:
                risks.append("Risk Indicator: Proposed delivery schedule deviates significantly from requested timeframe.")
            factors.append(BidAnomalyFactor(
                name="Delivery Timing Deviation",
                code="timing_deviation",
                value=1.0 if meta["timing_anomaly"] else 0.0,
                is_anomaly=meta["timing_anomaly"],
                description="Delivery window is compressed (<50%) or extended (>125%)."
            ))

            # 4. Price similarity factor
            if meta["is_price_similar"]:
                risks.append(f"Risk Indicator: Close price similarity with another bidder ({meta['min_dist_pct']:.2f}% gap).")
            factors.append(BidAnomalyFactor(
                name="Price Similarity Proximity",
                code="price_similarity",
                value=meta["min_dist_pct"],
                is_anomaly=meta["is_price_similar"],
                description=f"Nearest competing bid is within {meta['min_dist_pct']:.2f}% proximity."
            ))

            # 5. Cross-bidder collusion factor
            c_info = collusion_map.get(bid.bid_id, {})
            is_collusion = meta["collusion_flag"] or c_info.get("collusion_flag", False)
            c_reasons = c_info.get("reasons", [])
            if is_collusion:
                for cr in c_reasons:
                    risks.append(f"Risk Indicator: Collusion pattern — {cr}.")
                if not c_reasons:
                    risks.append("Risk Indicator: Potential collusion detected — shared corporate identity/ties.")
            factors.append(BidAnomalyFactor(
                name="Cross-Bidder Collusion Indicator",
                code="collusion_indicator",
                value=1.0 if is_collusion else 0.0,
                is_anomaly=is_collusion,
                description=(
                    f"Collusion signals identified: {'; '.join(c_reasons)}"
                    if is_collusion
                    else "No shared corporate address, director, or cartel ties detected."
                )
            ))

            # 6. Company statutory age factor
            age_days = meta["company_age_days"]
            is_new_co = age_days < 180.0
            if is_new_co:
                risks.append(f"Risk Indicator: Recently incorporated entity ({int(age_days)} days old at tender evaluation).")
            factors.append(BidAnomalyFactor(
                name="Company Statutory Age",
                code="company_age_days",
                value=age_days,
                is_anomaly=is_new_co,
                description=f"Company age: {int(age_days)} days ({round(age_days/365.0, 1)} years since incorporation)."
            ))

            # Determine Risk Tier based on Isolation Forest score + specific risks
            # Output MUST be one of: NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK
            if is_collusion:
                risk_tier = "HIGH RISK"
                is_outlier = True
            elif score < -0.10 or len(risks) >= 3 or abs(price_dev) >= 38.0:
                risk_tier = "HIGH RISK"
                is_outlier = True
            elif score < 0.00 or len(risks) == 2 or abs(price_dev) >= 25.0 or meta["is_price_similar"]:
                risk_tier = "MEDIUM RISK"
                is_outlier = True
            elif score < 0.06 or len(risks) == 1 or abs(price_dev) >= 15.0:
                risk_tier = "LOW RISK"
                is_outlier = False
            else:
                risk_tier = "NORMAL"
                is_outlier = False

            osint_prof = getattr(bid, "osint_profile", None)
            osint_status = getattr(bid, "osint_verification_status", None)
            if not osint_status and isinstance(osint_prof, dict):
                osint_status = osint_prof.get("verification_status", "verified")

            profiles.append(BidAnomalyProfile(
                bid_id=bid.bid_id,
                company_name=bid.company_name,
                bid_reference=bid.bid_reference,
                bid_amount_inr=bid.bid_amount_inr,
                anomaly_score=round(score, 4),
                risk_tier=risk_tier,
                is_outlier=is_outlier,
                price_deviation_pct=price_dev,
                unusual_pricing_flag=meta["unusual_pricing"],
                timing_anomaly_flag=meta["timing_anomaly"],
                price_similarity_flag=meta["is_price_similar"],
                collusion_flag=is_collusion,
                collusion_reasons=c_reasons,
                osint_verification_status=osint_status or "verified",
                osint_details=osint_prof,
                factors=factors,
                risk_indicators=risks
            ))

        return profiles
