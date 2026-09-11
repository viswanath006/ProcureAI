"""
ProcureAI Phase 9 — Feature 2: Possible Bid Collusion Indicators.
Identifies patterns such as:
- Unusually similar bids
- Repeated bidder combinations
- Winner rotation patterns
- Repeated price relationships
- Unusual participation behavior

Standard Output Label: "Potential suspicious pattern detected"
Strict Safeguard: NEVER say "Company X is corrupt."
"""

from typing import List, Dict, Any, Optional, Tuple
import itertools
import re

from ..models.anomaly import CollusionPatternIndicator
from ..models.evaluation import BidderEvaluationInput, TenderEvaluationContext


class CollusionPatternDetector:
    """
    Analyzes multi-bidder relationships to identify potential collusion or cartel indicators
    without generating unsupported accusations.
    """

    LABEL = "Potential suspicious pattern detected"

    @staticmethod
    def _normalize_address(addr: Optional[str]) -> str:
        if not addr:
            return ""
        # Remove punctuation, uppercase, normalize tokens
        s = addr.lower()
        s = re.sub(r'[,.\-/\\#()]+', ' ', s)
        tokens = s.split()
        replacements = {
            "rd": "road",
            "st": "street",
            "flr": "floor",
            "pvt": "private",
            "ltd": "limited",
            "pl": "plot",
            "sec": "sector",
            "ind": "industrial",
            "bldg": "building",
            "apt": "apartment",
            "gurgaon": "gurugram",
            "bangalore": "bengaluru",
            "bombay": "mumbai",
            "calcutta": "kolkata",
            "madras": "chennai",
            "poona": "pune",
            "no": "",
            "near": "",
            "opp": "",
            "opposite": "",
        }
        normalized_tokens = [replacements.get(t, t) for t in tokens if len(t) > 1 or t.isdigit()]
        return " ".join([t for t in normalized_tokens if t])

    @staticmethod
    def _normalize_name(name: Optional[str]) -> str:
        if not name:
            return ""
        s = name.lower()
        s = re.sub(r'^(mr|mrs|ms|dr|shri|smt)\.?\s+', '', s)
        s = re.sub(r'[^a-z0-9]', '', s)
        return s

    @classmethod
    def detect_cross_bidder_osint_collusion(
        cls,
        bids: List[BidderEvaluationInput]
    ) -> Tuple[Dict[str, Dict[str, Any]], List[CollusionPatternIndicator]]:
        """
        Cross-checks registered_address and director names/DINs pairwise across all bidders.
        Returns:
        1. Mapping of bid_id -> {"collusion_flag": bool, "reasons": List[str], "matching_bidders": List[str]}
        2. List of CollusionPatternIndicator objects for risk reporting
        """
        bid_map: Dict[str, Dict[str, Any]] = {
            b.bid_id: {"collusion_flag": False, "reasons": [], "matching_bidders": []}
            for b in bids
        }
        indicators: List[CollusionPatternIndicator] = []

        if len(bids) < 2:
            return bid_map, indicators

        for b1, b2 in itertools.combinations(bids, 2):
            # ── A. Check Shared Registered Address ────────────────────────────
            addr1 = cls._normalize_address(b1.registered_address)
            addr2 = cls._normalize_address(b2.registered_address)

            has_shared_address = False
            if addr1 and addr2 and len(addr1) >= 8 and len(addr2) >= 8:
                if addr1 == addr2:
                    has_shared_address = True
                else:
                    tokens1 = set(addr1.split())
                    tokens2 = set(addr2.split())
                    intersection = tokens1.intersection(tokens2)
                    union = tokens1.union(tokens2)
                    jaccard = len(intersection) / len(union) if union else 0.0
                    min_len = min(len(tokens1), len(tokens2))
                    overlap_coef = len(intersection) / min_len if min_len > 0 else 0.0

                    # Match if high Jaccard (>= 0.60) or Overlap Coefficient >= 0.75 with at least 4 common tokens
                    if (jaccard >= 0.60) or (overlap_coef >= 0.75 and len(intersection) >= 4):
                        has_shared_address = True

            if has_shared_address:
                reason_1 = f"Shares registered corporate address with {b2.company_name} ({b2.registered_address})"
                reason_2 = f"Shares registered corporate address with {b1.company_name} ({b1.registered_address})"

                bid_map[b1.bid_id]["collusion_flag"] = True
                bid_map[b1.bid_id]["reasons"].append(reason_1)
                bid_map[b1.bid_id]["matching_bidders"].append(b2.company_name)

                bid_map[b2.bid_id]["collusion_flag"] = True
                bid_map[b2.bid_id]["reasons"].append(reason_2)
                bid_map[b2.bid_id]["matching_bidders"].append(b1.company_name)

                indicators.append(CollusionPatternIndicator(
                    pattern_type="shared_registered_address",
                    label=cls.LABEL,
                    pattern_name="Shared Registered Corporate Address",
                    severity="HIGH",
                    involved_companies=[b1.company_name, b2.company_name],
                    evidence_summary=(
                        f"{cls.LABEL}: Direct co-location detected between competing bidders "
                        f"{b1.company_name} and {b2.company_name} sharing registered office: "
                        f"'{b1.registered_address}'."
                    ),
                    metrics={
                        "b1_id": b1.bid_id,
                        "b2_id": b2.bid_id,
                        "address": b1.registered_address,
                    }
                ))

            # ── B. Check Shared Directors or DINs ──────────────────────────────
            dirs1 = b1.directors or []
            dirs2 = b2.directors or []

            shared_director_names = []
            shared_dins = []

            for d1 in dirs1:
                name1 = d1.get("name", "") if isinstance(d1, dict) else str(d1)
                din1 = str(d1.get("din", "")).strip() if isinstance(d1, dict) and d1.get("din") else ""
                norm_name1 = cls._normalize_name(name1)

                for d2 in dirs2:
                    name2 = d2.get("name", "") if isinstance(d2, dict) else str(d2)
                    din2 = str(d2.get("din", "")).strip() if isinstance(d2, dict) and d2.get("din") else ""
                    norm_name2 = cls._normalize_name(name2)

                    # Match by DIN first if available
                    if din1 and din2 and din1 == din2:
                        shared_dins.append((din1, name1))
                    elif norm_name1 and norm_name2 and norm_name1 == norm_name2 and len(norm_name1) >= 5:
                        shared_director_names.append(name1)

            if shared_dins or shared_director_names:
                match_desc = (
                    f"DIN: {shared_dins[0][0]} ({shared_dins[0][1]})"
                    if shared_dins
                    else f"Director: {shared_director_names[0]}"
                )

                reason_1 = f"Common director/DIN identified with {b2.company_name}: {match_desc}"
                reason_2 = f"Common director/DIN identified with {b1.company_name}: {match_desc}"

                bid_map[b1.bid_id]["collusion_flag"] = True
                bid_map[b1.bid_id]["reasons"].append(reason_1)
                bid_map[b1.bid_id]["matching_bidders"].append(b2.company_name)

                bid_map[b2.bid_id]["collusion_flag"] = True
                bid_map[b2.bid_id]["reasons"].append(reason_2)
                bid_map[b2.bid_id]["matching_bidders"].append(b1.company_name)

                indicators.append(CollusionPatternIndicator(
                    pattern_type="shared_director_din",
                    label=cls.LABEL,
                    pattern_name="Common Board Director or Signatory (DIN Link)",
                    severity="HIGH",
                    involved_companies=[b1.company_name, b2.company_name],
                    evidence_summary=(
                        f"{cls.LABEL}: Cross-company directorship identified between "
                        f"{b1.company_name} and {b2.company_name} through common key personnel: {match_desc}."
                    ),
                    metrics={
                        "b1_id": b1.bid_id,
                        "b2_id": b2.bid_id,
                        "shared_identifier": match_desc,
                    }
                ))

        return bid_map, indicators

    @classmethod
    def analyze_patterns(
        cls,
        bids: List[BidderEvaluationInput],
        tender: TenderEvaluationContext,
        historical_tenders: Optional[List[Dict[str, Any]]] = None
    ) -> List[CollusionPatternIndicator]:
        """
        Executes collusion and cartel pattern detection across current bids and historical records.
        """
        indicators: List[CollusionPatternIndicator] = []

        if len(bids) < 2:
            return indicators

        # ── 0. Cross-Bidder OSINT Checks (Shared Address & Common Directors) ──
        _, osint_indicators = cls.detect_cross_bidder_osint_collusion(bids)
        indicators.extend(osint_indicators)

        # ── 1. Unusually Similar Bids ─────────────────────────────────────────
        # Check pairwise price differences (< 0.5% difference)
        for b1, b2 in itertools.combinations(bids, 2):
            p1, p2 = float(b1.bid_amount_inr), float(b2.bid_amount_inr)
            if p1 > 0 and p2 > 0:
                delta = abs(p1 - p2)
                mean_p = (p1 + p2) / 2.0
                diff_pct = (delta / mean_p) * 100.0

                if diff_pct < 0.50:
                    indicators.append(CollusionPatternIndicator(
                        pattern_type="price_similarity",
                        label=cls.LABEL,
                        pattern_name="Unusually Similar Bid Prices",
                        severity="HIGH" if diff_pct < 0.20 else "MEDIUM",
                        involved_companies=[b1.company_name, b2.company_name],
                        evidence_summary=(
                            f"{cls.LABEL}: High pairwise price similarity between "
                            f"{b1.company_name} (₹{p1:,.2f}) and {b2.company_name} (₹{p2:,.2f}) "
                            f"with a difference margin of only {diff_pct:.2f}%. "
                            f"Statistical probability of independent identical pricing is low."
                        ),
                        metrics={
                            "price_1": p1,
                            "price_2": p2,
                            "delta_amount": round(delta, 2),
                            "difference_pct": round(diff_pct, 3),
                        }
                    ))

        # ── 2. Repeated Bidder Combinations ───────────────────────────────────
        # Check if same set of companies frequently co-bid together across tenders
        if historical_tenders:
            company_ids = set(b.company_id for b in bids)
            co_occurrences: Dict[tuple, int] = {}

            for hist in historical_tenders:
                hist_companies = set(hist.get("bidders", []))
                common = company_ids.intersection(hist_companies)
                if len(common) >= 2:
                    for pair in itertools.combinations(sorted(list(common)), 2):
                        co_occurrences[pair] = co_occurrences.get(pair, 0) + 1

            for pair, count in co_occurrences.items():
                if count >= 3:
                    c1_name = next((b.company_name for b in bids if b.company_id == pair[0]), pair[0])
                    c2_name = next((b.company_name for b in bids if b.company_id == pair[1]), pair[1])
                    indicators.append(CollusionPatternIndicator(
                        pattern_type="repeated_combination",
                        label=cls.LABEL,
                        pattern_name="Repeated Bidder Pairing",
                        severity="MEDIUM",
                        involved_companies=[c1_name, c2_name],
                        evidence_summary=(
                            f"{cls.LABEL}: Frequent co-bidding partnership observed. "
                            f"{c1_name} and {c2_name} have appeared together in {count} tenders "
                            f"over the observed period with limited external competition."
                        ),
                        metrics={"co_occurrence_count": count, "pair": list(pair)}
                    ))

        # ── 3. Winner Rotation Patterns ───────────────────────────────────────
        # Check cyclic alternation of winning contracts among a closed group
        if historical_tenders and len(historical_tenders) >= 3:
            winner_sequence = [h.get("awarded_company_id") for h in historical_tenders if h.get("awarded_company_id")]
            if len(winner_sequence) >= 3:
                # Check for alternating A -> B -> A pattern
                for i in range(len(winner_sequence) - 2):
                    if winner_sequence[i] == winner_sequence[i+2] and winner_sequence[i] != winner_sequence[i+1]:
                        win_c1 = winner_sequence[i]
                        win_c2 = winner_sequence[i+1]
                        current_bidders = [b.company_id for b in bids]
                        if win_c1 in current_bidders and win_c2 in current_bidders:
                            c1_name = next((b.company_name for b in bids if b.company_id == win_c1), win_c1)
                            c2_name = next((b.company_name for b in bids if b.company_id == win_c2), win_c2)
                            indicators.append(CollusionPatternIndicator(
                                pattern_type="winner_rotation",
                                label=cls.LABEL,
                                pattern_name="Cyclic Winner Rotation Pattern",
                                severity="HIGH",
                                involved_companies=[c1_name, c2_name],
                                evidence_summary=(
                                    f"{cls.LABEL}: Sequential contract award alternation detected "
                                    f"between {c1_name} and {c2_name} across recent procurement cycles."
                                ),
                                metrics={"sequence": [c1_name, c2_name, c1_name]}
                            ))
                            break

        # ── 4. Repeated Price Relationships (Constant Mark-up / Cover Bidding) ─
        # When Bidder B is consistently ~5-10% higher than Bidder A
        for b1, b2 in itertools.combinations(bids, 2):
            p1, p2 = float(b1.bid_amount_inr), float(b2.bid_amount_inr)
            if p1 > 0 and p2 > 0:
                ratio = p2 / p1
                # Check if ratio is suspicious constant margin e.g. exactly 1.050 or 1.100 (+/- 0.2%)
                if abs(ratio - 1.05) < 0.003 or abs(ratio - 1.10) < 0.003:
                    margin_pct = (ratio - 1.0) * 100.0
                    indicators.append(CollusionPatternIndicator(
                        pattern_type="repeated_price_relationship",
                        label=cls.LABEL,
                        pattern_name="Structured Price Margin Relationship",
                        severity="MEDIUM",
                        involved_companies=[b1.company_name, b2.company_name],
                        evidence_summary=(
                            f"{cls.LABEL}: Potential cover-bidding relationship detected. "
                            f"{b2.company_name}'s price is structured with a uniform {margin_pct:.1f}% "
                            f"step above {b1.company_name}."
                        ),
                        metrics={"ratio": round(ratio, 4), "margin_pct": round(margin_pct, 2)}
                    ))

        # ── 5. Unusual Participation Behavior (Decoy / Non-competitive Bids) ──
        budget = float(tender.estimated_budget_inr) if tender.estimated_budget_inr > 0 else 100_000_000.0
        for bid in bids:
            price = float(bid.bid_amount_inr)
            if price > budget * 1.30:
                indicators.append(CollusionPatternIndicator(
                    pattern_type="unusual_participation",
                    label=cls.LABEL,
                    pattern_name="Non-Competitive Price Participation",
                    severity="LOW",
                    involved_companies=[bid.company_name],
                    evidence_summary=(
                        f"{cls.LABEL}: Non-competitive pricing behavior. "
                        f"{bid.company_name} submitted a bid {((price - budget)/budget)*100:.1f}% "
                        f"above estimated budget, consistent with token or cover participation."
                    ),
                    metrics={"bid_amount": price, "budget": budget}
                ))

        return indicators
