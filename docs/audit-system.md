# ProcureAI — Tamper-Evident Audit System & Cryptographic Ledger (Phase 11)

## Executive Summary

Phase 11 implements an authoritative, cryptographically verified **Tamper-Evident Audit System** for ProcureAI.

By mathematically chaining every procurement lifecycle event into an unbroken SHA-256 sequence:

$$\text{HASH}(N) = \text{SHA256}(\text{event\_data} + \text{HASH}(N-1))$$

the system ensures that any unauthorized database row modification, deletion, or retro-active tampering instantly triggers a cryptographic integrity alert:

> **`⚠ AUDIT INTEGRITY FAILURE`**  
> *(identifying the exact tampered sequence index, timestamp, and corrupted payload).*

---

## 1. 16 Required Procurement Event Types

The audit chain records 16 critical procurement lifecycle actions:

| # | Event Type | Description |
|---|---|---|
| 1 | `login` | Dual-token authentication and session establishment |
| 2 | `tender_creation` | Tender metadata, NIT specification & estimated budget logging |
| 3 | `tender_publication` | Portal publishing and opening of public window |
| 4 | `tender_modification` | Corrigendum issuance and pre-bid clarifications |
| 5 | `bidder_registration` | Corporate identity verification and onboarding |
| 6 | `document_upload` | SHA-256 verification hash logging for statutory compliance certificates |
| 7 | `bid_submission` | Encrypted envelope receipt & client-side AES-256-GCM timestamping |
| 8 | `bid_locking` | Hard submission deadline enforcement & bid vault sealing |
| 9 | `bid_opening` | Dual-key cryptographic envelope decryption & HMAC audit verification |
| 10 | `ai_evaluation` | Multi-factor weighted evaluation execution (40/20/15/10/10/5) |
| 11 | `recommendation_generation` | Ranking assignment, confidence score & XAI attribution generation |
| 12 | `government_approval` | Authoritative contract award following AI recommendation |
| 13 | `government_rejection` | Proposal rejection or tender cancellation |
| 14 | `recommendation_override` | Documented AI override with mandatory statutory justification |
| 15 | `decision_modification_attempt` | Unauthorized attempt to alter locked decision (blocked by trigger) |
| 16 | `suspicious_activity` | Isolation Forest anomaly flags, price similarity alerts & collusion signals |

---

## 2. The 8 Required Event Fields

Every block in the cryptographic ledger contains:

1. **`event ID`**: Unique UUID assigned at event generation.
2. **`actor`**: Identity string of the person or daemon (e.g. `officer.suresh@finance.gov.in`).
3. **`role`**: System access role (`GOVT_OFFICER`, `BIDDER`, `AUDITOR`, `ADMIN`, `SYSTEM`).
4. **`action`**: One of the 16 standard procurement event types.
5. **`entity`**: Target table or resource (`tender`, `bid`, `company`, `document`, `government_decisions`).
6. **`timestamp`**: ISO 8601 UTC timestamp.
7. **`previous hash`**: 64-character lowercase hexadecimal SHA-256 hash of Block $N-1$ (Genesis Block points to 64 zeros).
8. **`current hash`**: SHA-256 hash of $\text{canonical(event\_data)} + \text{previous\_hash}$.

---

## 3. Cryptographic Verification Function

The verification engine traverses the ledger from Genesis ($N=0$) to Chain Head ($N=L$):
1. Verifies that Block 0 points to Genesis Hash (`0000000000000000000000000000000000000000000000000000000000000000`).
2. Verifies that $\text{prev\_hash}(N) = \text{curr\_hash}(N-1)$ for all $N > 0$.
3. Deterministically recomputes $\text{SHA256}(\text{canonical}(N) + \text{prev\_hash}(N))$ and compares with stored $\text{curr\_hash}$.

### Output States:
- **`✓ AUDIT CHAIN VALID`**: Chain is mathematically contiguous with zero modifications.
- **`⚠ AUDIT INTEGRITY FAILURE`**: A mismatch occurred, isolating the exact broken sequence number.

---

## 4. Auditor Portal with 6-Factor Filtering

Auditors can inspect and verify the ledger with multi-factor filtering across:
1. **`tender`**: Target tender ID or reference number.
2. **`user`**: Actor name or email.
3. **`company`**: Registered bidder enterprise name or ID.
4. **`event type`**: Dropdown of all 16 procurement events.
5. **`date`**: Bounded start and end date range.
6. **`risk level`**: `ALL`, `NORMAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
