# ProcureAI — Bidder Eligibility Engine (Phase 5)

## Overview

The Bidder Eligibility Engine performs objective, deterministic, and explainable qualification screening of bidder companies against tender requirements.

> **AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.**  
> **Mandatory Rule: Eligibility screening must be completed BEFORE AI ranking.**

---

## 1. Engine Rules

1. **Financial Turnover Gate:** `required_turnover <= company_turnover`
2. **Experience Gate:** `required_experience <= company_experience`
3. **Completed Projects Gate:** `required_projects <= completed_projects`
4. **Technical Capabilities Gate:** Required technical accreditations & certified competencies present.
5. **Legal Non-Debarment Gate:** Company confirmed NOT on statutory debarment register and sworn affidavit verified.
6. **Document Validity Gate:** Required documents are present, approved, and not expired.

---

## 2. Non-Discrimination Policy

The engine contains an explicit guard that strictly rejects any tender requirement evaluating prohibited personal characteristics (e.g. gender, race, religion, ethnicity, or personal background). Only objective corporate qualifications are evaluated.

---

## 3. APIs

- `GET /api/v1/eligibility/company/profile` — Fetch bidder company profile & documents
- `PUT /api/v1/eligibility/company/profile` — Update company profile & credentials
- `POST /api/v1/eligibility/company/documents` — Register compliance document with SHA-256 hash
- `DELETE /api/v1/eligibility/company/documents/:docId` — Delete compliance document
- `POST /api/v1/eligibility/precheck/:tenderId` — Bidder self-check on any tender
- `POST /api/v1/eligibility/evaluate-bid/:bidId` — Screen single bid
- `POST /api/v1/eligibility/evaluate-tender/:tenderId` — Screen all bids for tender
- `GET /api/v1/eligibility/tender/:tenderId/summary` — Full eligibility screening report
