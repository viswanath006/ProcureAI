# ProcureAI — Evaluation Engine (Phase 7)

## Overview

The ProcureAI Evaluation Engine provides transparent, multi-dimensional, AI-assisted proposal scoring. It ensures that public procurement is never reduced to a naive "lowest bidder" race to the bottom, but instead balances commercial competitiveness against technical architecture, verified experience, financial capacity, past performance, and risk indicators.

> **AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.**  
> **Core Guarantee: The system must NOT simply select the lowest bidder.**

---

## 1. Weighted Multi-Factor Criteria

Tender authorities can customize evaluation weights, with all weights strictly required to sum to **100%**.

| Factor | Default Weight | Dimension Scope & Normalization (0–100 Scale) |
|---|:---:|---|
| **Price Score** | **40%** | Inverse relative commercial competitiveness ($100 \times \frac{P_{\min}}{P_i}$) relative to estimated budget. Protected by abnormal low-bid & dumping penalties when price is $< 65\%$ of budget. |
| **Technical Capability** | **20%** | Quality and depth of technical proposal, architectural methodology, security controls, and verified certifications (e.g. ISO 27001, CMMI, Tier-3 Data Center). |
| **Operational Experience** | **15%** | Verifiable years in business and count/scale of completed reference projects in similar public infrastructure domains. |
| **Financial Capacity** | **10%** | Audited annual turnover to tender budget ratio, net worth buffer, and solvency safety factor. |
| **Past Performance** | **10%** | Verified historical on-time delivery percentages, client satisfaction ratings (out of 5.0), and clean dispute records. |
| **Risk Indicators** | **5%** | Composite risk assessment starting at 100 (optimal). Deductions occur for aggressive timeline compression, price dumping, or thin financial backing. |

$$\text{FINAL SCORE} = \sum_{k} \left( \text{NormalizedScore}_k \times \frac{\text{Weight}_k}{100} \right)$$

---

## 2. Terminology & Governance Safeguards

The engine strictly complies with public governance principles:
- **No Claims of Proving Corruption or Absolute Fairness:** The engine does not claim to have "proved fraud" or "guaranteed fairness".
- **Approved Decision-Support Terminology:**
  - `Recommendation` (e.g., `award`, `shortlist`, `reserve`)
  - `Risk Indicator` (e.g., abnormally compressed schedule or dumping risk)
  - `Anomaly`
  - `Potential Bias Pattern`
- **Synthetic Datasets:** Benchmark datasets used for demonstrations or automated testing are explicitly tagged with `is_synthetic: true` and prefixed with `[SYNTHETIC DATASET]`. Real government records are never fabricated.

---

## 3. Service Architecture

```
FastAPI AI Service (Python)
├── app/main.py               # REST API (/evaluate, /synthetic/benchmark, /capabilities)
├── app/engine/normalizer.py  # Normalization to common 0–100 scale
├── app/engine/scorer.py      # Weighted factor scoring & dumping protection
├── app/engine/ranker.py      # Bidder ranking, medals & confidence indexing
├── app/engine/explainer.py   # Transparent narrative rationale generator
└── app/synthetic/generator.py# Benchmark suite ([SYNTHETIC DATASET])
```

---

## 4. Automated Verification

Run test suites from the respective directories:
```bash
# Python AI Engine (14/14 tests pass)
cd ai-service
python -m pytest tests/test_evaluation_engine.py -v

# Backend Integration (46/46 tests pass)
cd backend
npm run test:ai-eval
```
