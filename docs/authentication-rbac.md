# ProcureAI — Secure Authentication & RBAC (Phase 3)

## Overview

ProcureAI Phase 3 implements an enterprise-grade, cryptographically secure authentication and role-based authorization system built on the core principle:

> **AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.**

---

## 1. Roles & Permissions Matrix

| Domain & Operation | BIDDER | GOVT_OFFICER | AUDITOR | ADMIN | Enforced By |
|---|:---:|:---:|:---:|:---:|---|
| **Register & Login** | ✅ | ✅ | ✅ | ✅ | Rate-limited auth controller |
| **View Available Tenders** | ✅ (Published only) | ✅ (All states) | ✅ (Audit view) | ✅ (All states) | `authorize(...)` filter |
| **Create New Tender** | ❌ (403) | ✅ | ❌ (403) | ✅ | `authorize('GOVT_OFFICER', 'ADMIN')` |
| **Submit Sealed Bid** | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | `authorize('BIDDER')` + company gate |
| **View Own Submissions** | ✅ (Isolated) | ❌ (403) | ❌ (403) | ❌ (403) | `authorize('BIDDER')` + company match |
| **Unseal Bids Pre-Deadline**| ❌ (403) | ❌ (403) | ✅ (Audit only) | ✅ (Admin only) | Cryptographic deadline check |
| **Unseal Bids Post-Deadline**| ❌ (403) | ✅ | ✅ | ✅ | Timestamp check vs deadline |
| **Trigger AI Evaluation** | ❌ (403) | ✅ | ❌ (403) | ✅ | `authorize('GOVT_OFFICER', 'ADMIN')` |
| **View AI Recommendations** | ❌ (403) | ✅ | ✅ | ✅ | `authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN')` |
| **Award / Decision** | ❌ (403) | ✅ | ❌ (403) | ✅ | `authorize('GOVT_OFFICER', 'ADMIN')` |
| **Override AI Without Reason**| ❌ (403) | ❌ (400) | ❌ (403) | ❌ (400) | Mandatory override schema check |
| **Override AI With Reason** | ❌ (403) | ✅ | ❌ (403) | ✅ | `decision_overrides` record saved |
| **View Audit Logs** | ❌ (403) | ❌ (403) | ✅ | ✅ | `authorize('AUDITOR', 'ADMIN')` |
| **Manage Users & System** | ❌ (403) | ❌ (403) | ❌ (403) | ✅ | `authorize('ADMIN')` |

---

## 2. Token Strategy

- **Access Token:** RS256/HS256 JWT, 15-minute lifetime, kept in React memory (never localStorage).
- **Refresh Token:** 7-day token stored in an `httpOnly`, `Secure`, `SameSite=Strict/Lax` cookie. Single-use: rotating a token invalidates it; reusing a rotated token revokes the entire session family (anti-theft).
- **Password Hashing:** BCrypt with cost factor 12.
- **Brute Force Mitigation:** Express rate-limiting (5 requests / 15 min) + DB account lockout after 5 failed attempts.

---

## 3. Automated Verification

Run the security test suite anytime from the backend:

```bash
cd backend
npm test
```

This programmatically executes **30 distinct cryptographic and RBAC checks** verifying every permission rule and edge case.
