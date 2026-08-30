# ProcureAI — Explainable AI (XAI) Engine (Phase 8)

## Overview

The ProcureAI Explainable AI (XAI) Engine ensures that artificial intelligence in public procurement is never an impenetrable "black box." It provides transparent, mathematically backed, and non-technical explanations answering the core question:

> **"Why did the AI recommend this company?"**

The engine utilizes **SHAP (SHapley Additive exPlanations)** grounded in cooperative game theory to quantify the exact marginal contribution of each evaluation factor against historical and benchmark baseline distributions.

---

## 1. Governance Principles & Terminology Safeguards

1. **Non-Technical Government Officer Centric**:
   Procurement officers, auditors, and evaluation committees do not need to decipher raw machine learning tensors, loss gradients, or model hyperparameters. The system surfaces qualitative non-technical ratings and intuitive directional contributors.
2. **Approved Terminology Mandate**:
   - `Recommendation` (e.g. `award`, `shortlist`, `reserve`)
   - `Risk Indicator`
   - `Anomaly`
   - `Potential Bias Pattern`
   - Strictly disclaims claiming that the AI has "proved corruption" or "proved fairness".
3. **Synthetic Data Labeling**:
   Demonstration and testing datasets are explicitly labeled `[SYNTHETIC DATASET]`. Real government records are never fabricated.

---

## 2. Structured Explanation Object

Each evaluated proposal receives an `explanation_object`:

```json
{
  "bid_id": "bid-alpha-001",
  "bid_reference": "SYNTH-BID-2026-001",
  "company_name": "[SYNTHETIC DATASET] Alpha Enterprise Solutions Ltd",
  "rank": 1,
  "total_score": 87.4,
  "why_summary": "Alpha Enterprise Solutions Ltd was recommended for award because it achieved the highest composite score (87.4/100), balancing competitive price, strong technical capability, and verified historical performance with minimal risk.",
  "ratings": {
    "Price": "Excellent",
    "Technical capability": "Very strong",
    "Experience": "Strong",
    "Financial capacity": "Good",
    "Past performance": "Excellent",
    "Risk": "Low"
  },
  "positive_contributors": [
    "+ Competitive price",
    "+ Strong technical capability",
    "+ Relevant experience",
    "+ Strong past performance",
    "+ Low operational risk"
  ],
  "negative_contributors": [
    "- Moderate financial capacity"
  ],
  "shap_attributions": {
    "price": 3.8,
    "technical": 2.6,
    "experience": 1.4,
    "financial": -0.5,
    "past_performance": 1.9,
    "risk": 0.8
  },
  "baseline_expected_score": 72.0,
  "plain_language_narrative": "The AI evaluated Alpha Enterprise Solutions Ltd against the full tender specifications. Its commercial proposal scored Excellent, while technical capability was rated Very strong..."
}
```

---

## 3. Qualitative Non-Technical Rating Scale

| Score Range (Raw 0–100) | Standard Dimensions (Price, Tech, Exp, Fin, Perf) | Risk Dimension |
|---|---|---|
| **90.0 – 100.0** | **Excellent** | **Low Risk (Optimal)** |
| **80.0 – 89.9** | **Very strong** | **Low Risk** |
| **70.0 – 79.9** | **Strong** | **Moderate Risk** |
| **60.0 – 69.9** | **Good** | **Moderate Risk** |
| **50.0 – 59.9** | **Moderate** | **Elevated Risk** |
| **< 50.0** | **Low** | **High Risk Indicator** |

---

## 4. REST API Endpoints

- `POST /evaluate` (AI Service): Computes evaluation with attached `explanation` objects.
- `POST /explain` (AI Service): Dedicated endpoint returning standalone explanations for all bidders.
- `GET /api/v1/tenders/:id/ai-recommendations` (Backend): Returns latest recommendations including `explanation_object`.
- `GET /api/v1/tenders/:id/ai-explanation/:bidId` (Backend): Returns targeted single-company XAI dossier.

---

## 5. Automated Verification

Run test suites from the respective directories:
```bash
# Python AI Service (5 XAI tests, 19 total pytest tests)
cd ai-service
python -m pytest tests/test_xai_explainability.py -v

# Backend Integration Test Suite (35 XAI tests)
cd backend
npm run test:xai
```
