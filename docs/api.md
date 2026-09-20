# ProcureAI API Specification 📡

> **Internal Reference**: This document contains the REST API specifications for the ProcureAI Gateway.  
> All sensitive routes require Dual-Token JWT authentication and Role-Based Access Control (RBAC).

---

## Architecture Principles
1. **Statutory RBAC**: Routes strictly enforce roles (`GOVT_OFFICER`, `BIDDER`, `AUDITOR`, `ADMIN`).
2. **Tenant Isolation**: Bidders can only access their own submissions; IDOR is strictly blocked.
3. **Sealed-Envelope Confidentiality**: Pre-deadline bid queries return ciphertext only; plaintext unsealing is time-locked.
4. **Audit Immutability**: All sensitive mutations generate a SHA-256 chained audit record.

---

## Core Endpoints

### 1. Authentication & Session (`/api/v1/auth`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Self-registration for eligible vendor or officer personas |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and issues dual-token pair (Access + Refresh) |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Rotates access token with reuse detection |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revokes current refresh token and clears auth cookies |

### 2. Tenders & Specifications (`/api/v1/tenders`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/tenders` | Authenticated | Lists tenders with stage filtering, category tags, and search |
| `POST` | `/api/v1/tenders` | `GOVT_OFFICER` | Creates new tender specification and qualification gates |
| `GET` | `/api/v1/tenders/:id` | Authenticated | Returns detailed tender metadata, eligibility gates, and milestones |
| `GET` | `/api/v1/officer/dashboard` | `GOVT_OFFICER`, `ADMIN` | Returns aggregated metrics, KPI cards, and active tenders |

### 3. Eligibility Verification (`/api/v1/eligibility`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/eligibility/evaluate` | Authenticated | Evaluates company profile against 6 statutory qualification gates |
| `GET` | `/api/v1/eligibility/company/:id` | Authenticated | Retrieves company qualification dossier and statutory documents |

### 4. Sealed Bids & Unsealing (`/api/v1/bids`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/bids/submit` | `BIDDER` | Submits AES-256-GCM encrypted proposal envelope |
| `GET` | `/api/v1/bids/:bidId` | Multi-Tenant | Views single bid; enforces strict company-scoped IDOR checks |
| `GET` | `/api/v1/bids/tender/:id` | `GOVT_OFFICER` | Lists submitted bids (masked if before deadline, unsealed if ceremony completed) |
| `POST` | `/api/v1/bids/tender/:id/unseal` | `GOVT_OFFICER` | Authorizes unsealing ceremony post-deadline |

### 5. AI Evaluation & Risk Radar (`/api/v1/ai`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/ai/evaluate` | `GOVT_OFFICER` | Executes QCBS multi-criteria weighted scoring engine |
| `POST` | `/api/v1/ai/explain` | Authenticated | Generates SHAP game-theoretic feature attributions in plain language |
| `POST` | `/api/v1/ai/anomaly` | `GOVT_OFFICER` | Runs Isolation Forest and proximity collusion radar |
| `GET` | `/api/v1/ai/health` | Public | Health and capabilities check for the Python AI microservice |

### 6. Decisions & Award Finalization (`/api/v1/tenders/:id/decision`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/tenders/:id/decision` | `GOVT_OFFICER` | Records contract award or justified override with mandatory reason codes |
| `GET` | `/api/v1/tenders/:id/decision` | Authenticated | Retrieves finalized, tamper-locked decision certificate |

### 7. Cryptographic Audit Ledger (`/api/v1/audit`)
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/audit/logs` | `AUDITOR` | Queries audit chain with multi-factor filtering |
| `GET` | `/api/v1/audit/verify` | `AUDITOR` | Recalculates full SHA-256 cryptographic ledger integrity |
| `GET` | `/api/v1/audit/tamper-check` | `AUDITOR` | Runs automated verification check across all historical blocks |

---

## Interactive Documentation
For interactive testing, launch the backend and AI service locally and visit:
- **FastAPI Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Interactive**: `http://localhost:8000/redoc`
