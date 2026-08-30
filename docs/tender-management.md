# ProcureAI — Tender Management Module (Phase 4)

## Overview

The Tender Management Module delivers an end-to-end government procurement authoring and lifecycle controller. It enforces the core principle:

> **AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.**

---

## 1. 9-Stage Lifecycle Sequence

Tenders strictly advance through the 9 states:

1. `DRAFT`: Authoring specifications, criteria, and requirements.
2. `PUBLISHED`: Official notice released to public; awaiting opening date.
3. `OPEN`: Open for cryptographic sealed bid submissions.
4. `CLOSED`: Deadline passed; bidding closed; bids remain sealed.
5. `BIDS_REVEALED`: Post-deadline unsealing; cryptographic hashes verified.
6. `UNDER_EVALUATION`: AI scoring algorithms and eligibility verification running.
7. `RECOMMENDATION_READY`: AI ranking, confidence, and reasoning summaries available.
8. `DECISION_MADE`: Official human procurement award/rejection recorded.
9. `COMPLETED`: Contract finalized and procurement cycle complete.

---

## 2. Transition Rules

- **Forward Progression Only:** Cannot skip stages (e.g. `DRAFT` cannot jump directly to `BIDS_REVEALED`).
- **Post-Deadline Unsealing:** Bids can only be unsealed after the tender closing date has elapsed.
- **Specification Immutability:** Requirements and evaluation criteria can only be edited while in `DRAFT`.
- **Criteria Weights Sum:** Evaluation criteria weights must sum to exactly **100%** before publishing is permitted.

---

## 3. APIs

- `POST /api/v1/tenders` — Create tender (DRAFT or PUBLISHED)
- `PUT /api/v1/tenders/:id` — Update tender draft
- `POST /api/v1/tenders/:id/publish` — Publish tender
- `POST /api/v1/tenders/:id/close` — Close tender
- `POST /api/v1/tenders/:id/reveal-bids` — Unseal bids post-deadline
- `POST /api/v1/tenders/:id/transition` — Transition lifecycle state
- `GET /api/v1/tenders/:id/details` — Full tender dossier
- `GET /api/v1/officer/dashboard` — Executive dashboard metrics
