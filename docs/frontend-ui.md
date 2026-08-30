# ProcureAI — Professional Enterprise UI & Multi-Persona Architecture (Phase 12)

## Brand Identity

- **Platform Name**: **ProcureAI**
- **Official Tagline**: **"Intelligent. Fair. Transparent."**
- **Core Governance Philosophy**: `AI RECOMMENDS · HUMANS DECIDE · SYSTEM AUDITS`

---

## 1. The Four Specialized Dashboards

ProcureAI delivers purpose-built, role-tailored dashboards designed for maximum operational efficiency, information density, and legal compliance.

### 1. Government Officer Dashboard (`/tenders`)
- **6 Key Executive Metric Cards**:
  1. **`ACTIVE TENDERS`**: Number of open public opportunities currently accepting sealed bids.
  2. **`BIDS AWAITING EVALUATION`**: Bids locked in cryptographic vaults ready for dual-key unsealing.
  3. **`AI RECOMMENDATIONS`**: Proposals with multi-criteria scores computed and ready for human review.
  4. **`HIGH-RISK TENDERS`**: Tenders with Isolation Forest anomaly alerts or potential collusion signals.
  5. **`PENDING DECISIONS`**: Tenders requiring authoritative government award or rejection action.
  6. **`OVERRIDE ALERTS`**: Historical decision monitoring detecting repeated human overrides.
- **Tender Page / Detail View**:
  - Full tender metadata & scope of work.
  - Bidder qualification gates & compliance documents.
  - Interactive **Bidder Comparison Chart**.
  - **Evaluation Scores** breakdown across all 6 criteria.
  - **AI Recommendation** hero card with confidence metrics.
  - **Risk Indicators** dispersion panel.
  - **Explainability (XAI)** plain-language report.
  - Authoritative **Human-in-the-Loop Decision Console** with SHA-256 integrity hash locking.

### 2. Bidder Workspace (`/bidder`)
- **Available Tenders**: Real-time registry of public opportunities with category, budget, and live **Deadline Countdown** (`DD:HH:MM:SS`).
- **Eligibility Status**: Pre-check gate indicators against statutory financial, technical, and turnover requirements.
- **Submitted Bids**: Tracking table showing submission status (`ENCRYPTED & SEALED`, `LOCKED IN VAULT`, `UNSEALED`, `AWARDED`).
- **Locked Bid Confirmation Receipt**: Modal displaying AES-256-GCM envelope hash, submission timestamp, and mathematical sealing guarantee.
- **Company Profile & Document Vault**: Management of GST, PAN, audited balance sheets, and active work order references.

### 3. Auditor Portal (`/auditor`)
- **Cryptographic Verification Banner**:
  - Live status indicator: **`✓ AUDIT CHAIN VALID`** or **`⚠ AUDIT INTEGRITY FAILURE`**.
  - Verified block count, root genesis hash, and chain head hash.
- **Interactive Integrity Controls**:
  - `[Verify Cryptographic Audit Chain]` button.
  - `[Simulate Tamper ⚠]` for live judge demonstrations.
  - `[Restore Valid Chain ✓]` for instant recovery.
- **6-Factor Filter Engine**:
  - `Tender Ref`, `User/Actor`, `Company`, `Event Action` (16 types), `Date Range`, `Risk Tier`.
- **Ledger Visualizer**:
  - Sequence numbers, timestamps, actions, actor/role, entity, previous hash, current hash, and `⛓️ LINKED` proof badges.
- **Decisions Ledger**:
  - Historical government awards, documented overrides, and AI agreement analytics.

### 4. Administrator Portal (`/admin`)
- System telemetry, active session principal directory, RBAC permission matrices, cryptographic key health, and service connection latency.

---

## 2. Dedicated Data Visualization Suite (`components/charts/`)

1. **`BidderComparisonChart`**:
   - Multi-metric comparative bar chart visualizing Commercial Price vs Technical Capability vs Composite Ranking across competing vendors.
2. **`EvaluationScoreChart`**:
   - Granular breakdown of the 6 evaluation factors: Price (40%), Technical (20%), Experience (15%), Financial (10%), Performance (10%), Risk (5%).
3. **`RiskIndicatorsChart`**:
   - Scatter/dispersion gauge illustrating budget price deviations, schedule compression, and Isolation Forest anomaly scores.
4. **`HistoricalPatternsChart`**:
   - Longitudinal trend visualizer tracking quarterly tender volume, average bidder density, and decision override frequencies.

---

## 3. SIH Demo & Judging Readiness

- **1-Click Quick Persona Switcher**: Top navigation allows evaluators to toggle seamlessly between:
  - 🏛️ **Officer** (`officer.alpha@procureai.dev`)
  - 🏢 **Bidder** (`rep.alpha@alphacorp.dev`)
  - 🔍 **Auditor** (`auditor.gamma@procureai.dev`)
  - ⚙️ **Admin** (`admin@procureai.dev`)
- **Zero Placeholder Data**: All screens are populated with realistic Indian public procurement projects (State Highway Surveillance, Smart Grid IoT, Municipal Water SCADA).
- **Sub-3s Bundle Load**: Vite production build transforms 67 modules into optimized, compressed assets in under 3 seconds.
