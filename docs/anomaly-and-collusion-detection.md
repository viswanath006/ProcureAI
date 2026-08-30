# ProcureAI — Anti-Bias, Anomaly Detection & Collusion Tracking (Phase 9)

## Executive Overview

Public procurement systems are vulnerable to price distortion, bid rigging, and arbitrary decision-making. Phase 9 implements an advanced, explainable risk-analysis module designed to detect suspicious patterns without making unsupported accusations.

### Foundational Governance Safeguards

1. **Zero Unsupported Accusations Rule**:
   - The system **never** outputs statements such as *"Company X is corrupt"* or accuses officers of crimes.
   - All findings are labeled with neutral, mathematical decision-support phrases:
     - **`"Potential suspicious pattern detected"`** for bid-level & market-level collusion signals.
     - **`"Potential decision-making pattern detected."`** for repeated officer override patterns.
2. **Transparent Evidence**:
   - Every flag cites specific, reproducible numerical metrics (e.g. pairwise delta $< 0.12\%$, cover markup $5.0\%$, delivery compression $< 50\%$).

---

## 1. Feature 1: Bid Anomaly Detection (Isolation Forest)

Uses scikit-learn's `IsolationForest` unsupervised outlier ensemble combined with rule-based heuristics.

### Dimensions Analyzed:
1. **Bid Price Deviation**: Percentage deviation from median and official estimated budget ($\frac{P - \text{budget}}{\text{budget}}$).
2. **Unusual Pricing**: Detection of repeating non-zero digits (e.g., `99999999`, `88888888`) or exact budget match.
3. **Repeated Bid Patterns**: Recurring identical margins across procurement categories.
4. **Participation Frequency & Capacity**: Turnover-to-budget ratio vs historical track record.
5. **Unusual Timing**: Schedule compression ($< 50\%$ required window) or extreme delivery extensions.
6. **Price Proximity / Similarity**: Nearest competing bid distance ($< 0.50\%$ is anomalous).
7. **Historical Operational Baseline**: Past performance rating divergence vs commercial pricing aggressiveness.

### Standard Output Risk Tiers:
- **`NORMAL`**: Statistical consistency within standard competitive bounds.
- **`LOW RISK`**: Minor single-metric deviation (e.g., $\pm 15\%$ budget deviation).
- **`MEDIUM RISK`**: Significant deviation or multiple mild risk indicators (e.g. price proximity $< 0.5\%$).
- **`HIGH RISK`**: Critical statistical outlier (e.g. abnormal dumping bid $> 35\%$ below budget with compressed delivery window).

---

## 2. Feature 2: Possible Bid Collusion Indicators

Detects market allocation schemes, cover bidding, and cartels.

### Patterns Identified:
1. **Unusually Similar Bids**:
   - Distinct entities submitting prices within $< 0.50\%$ of each other.
   - Output: `"Potential suspicious pattern detected: Close pairwise pricing between Company A and Company B (0.12% delta)."`
2. **Structured Price Margin Relationships (Cover Bidding)**:
   - Company B consistently bidding a fixed margin (e.g. $5.0\%$ or $10.0\%$) above Company A.
3. **Repeated Bidder Combinations**:
   - Pairs/triplets of companies that co-bid together in a high proportion of tenders ($\ge 3$ co-occurrences).
4. **Winner Rotation Patterns**:
   - Alternating contract award sequences among a closed group of vendors.
5. **Non-Competitive Participation (Decoy Bidding)**:
   - High bids ($> 30\%$ above budget) submitted solely to fulfill minimum bidder quotas.

---

## 3. Feature 3: Decision Override Analysis

Tracks human decisions versus automated multi-criteria recommendations.

### Tracked Attributes:
```
AI recommendation:
Company A (Alpha Enterprise Solutions Ltd) — Score: 87.4/100

Government selection:
Company C (Gamma National Technologies Corp)

Override:
YES

Mandatory reason:
[Stored in tamper-evident audit log with min 50 characters]
```

### Pattern Detection:
When repeated overrides occur:
- $\ge 2$ overrides favoring the same non-recommended vendor, or
- Override frequency $> 50\%$ across $\ge 3$ decisions.

Output Label:
> **"Potential decision-making pattern detected."**  
> *"Multiple overrides (2 instances) have selected Gamma National Technologies Corp over the top AI-recommended proposal."*  
> *(Strict Safeguard: Does NOT accuse the officer of misconduct).*

---

## 4. REST API Endpoints

- `POST /anomaly/detect` (AI Service): Runs Isolation Forest on bid set.
- `POST /collusion/analyze` (AI Service): Analyzes tender bids for collusion patterns.
- `POST /risk/analyze` (AI Service): Unified anomaly and collusion engine.
- `GET /api/v1/tenders/:id/risk-analysis` (Backend): Returns complete risk dossier for a tender.
- `GET /api/v1/tenders/:id/override-analysis` (Backend): Returns AI vs Human decision comparison, override status, and pattern indicators.
- `POST /api/v1/tenders/:id/decision` (Backend): Records final decision, enforces mandatory override reasons, runs pattern checks, and writes to `audit_logs`.
