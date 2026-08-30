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

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest

from ..models.anomaly import BidAnomalyProfile, BidAnomalyFactor
from ..models.evaluation import BidderEvaluationInput, TenderEvaluationContext


class IsolationForestAnomalyDetector:
    """
    Evaluates multi-dimensional bid features using scikit-learn Isolation Forest
    and heuristic validation to classify bids into standard risk tiers.
    """

    @classmethod
    def extract_features(
        cls,
        bid: BidderEvaluationInput,
        all_bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Extracts 7 analytical dimensions for a bid:
        1. Price deviation vs median and budget
        2. Unusual pricing digits / roundness
        3. Repeated bid margin
        4. Participation frequency & capacity ratio
        5. Submission timing anomaly
        6. Nearest price similarity ratio
        7. Historical operational track record deviation
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

        feature_vector = np.array([
            abs(dev_vs_budget),
            abs(dev_vs_median),
            unusual_pricing_score,
            repeated_pattern_score,
            capacity_feature,
            timing_anomaly,
            similarity_feature,
            historical_feature,
        ], dtype=np.float64)

        metadata = {
            "dev_vs_budget_pct": round(dev_vs_budget * 100, 2),
            "dev_vs_median_pct": round(dev_vs_median * 100, 2),
            "unusual_pricing": bool(unusual_pricing_score > 0),
            "timing_anomaly": bool(timing_anomaly > 0),
            "min_dist_pct": round(min_dist_pct * 100, 2) if other_prices else 20.0,
            "is_price_similar": bool(similarity_feature > 0),
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
        """
        if not bids:
            return []

        # Extract features for all bids
        vectors = []
        metas = []
        for bid in bids:
            vec, meta = cls.extract_features(bid, bids, tender)
            vectors.append(vec)
            metas.append(meta)

        X = np.array(vectors)

        # Synthesize typical procurement background distribution for calibration
        np.random.seed(42)
        n_background = 40
        X_bg = np.random.normal(loc=[0.08, 0.05, 0.0, 0.0, 2.5, 0.0, 0.0, 0.0],
                                scale=[0.05, 0.04, 0.1, 0.1, 1.0, 0.1, 0.05, 0.05],
                                size=(n_background, 8))
        X_bg = np.clip(X_bg, 0.0, 10.0)

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

            # Determine Risk Tier based on Isolation Forest score + specific risks
            # Output MUST be one of: NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK
            if score < -0.10 or len(risks) >= 3 or abs(price_dev) >= 38.0:
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
                factors=factors,
                risk_indicators=risks
            ))

        return profiles
