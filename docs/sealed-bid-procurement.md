# ProcureAI — Secure Sealed-Bid Procurement Architecture (Phase 6)

## Core Security Guarantee

> **A company must never be able to see another company's bid before the official bid-opening time.**  
> **Commercial figures remain encrypted with AES-256-GCM until official post-deadline unsealing.**

---

## 1. 12-Step Submission Validation Pipeline

1. **Authentication & Identity:** Confirmed JWT access token with role `BIDDER` or `ADMIN`, tied to active verified `companyId`.
2. **Tender Window:** Confirmed tender status is `OPEN` (or `PUBLISHED`), current time is `>= submission_start_at` and `< submission_deadline_at`.
3. **Bidder Eligibility Verification:** Evaluated against Phase 5 eligibility engine. Ineligible bidders failing mandatory gates are blocked with `ELIGIBILITY_FAILED`.
4. **Required Documents:** Mandatory tender document requirements confirmed present and valid.
5. **Bid Amount Validation:** Positive numeric value (> 0 INR).
6. **Anti-Gaming Single-Bid Rule:** Unique index enforces only ONE active, non-withdrawn bid per company per tender.
7. **Statutory Declaration:** Bidder must explicitly accept legal finality terms.
8. **Application-Layer AES-256-GCM Encryption:** Plaintext amounts and proposal notes are encrypted into `SEALED_v1:<iv_hex>:<tag_hex>:<cipher_hex>`.
9. **Deterministic Canonical SHA-256 Hashing:** All bid attributes and sorted document hashes are serialized into canonical JSON and hashed.
10. **Cryptographic Receipt Token:** Issued in format `REC-2026-<hash_prefix>-<random>`.
11. **Atomic Transaction:** Bid, hash snapshot, submission event, and documents inserted in a single transaction.
12. **Lock & Seal:** `bids.is_locked = TRUE`, `bids.status = 'submitted'`. Proposal cannot be edited, deleted, or replaced.

---

## 2. 5-Stage Sealing & Opening Pipeline

$$\text{SUBMITTED} \longrightarrow \text{LOCKED} \longrightarrow \text{SEALED} \longrightarrow \text{DEADLINE CLOSED} \longrightarrow \text{REVEALED}$$

- **Before Deadline:** Officers and rival bidders receive masked ciphertext `[ENCRYPTED_SEALED_ENVELOPE]`. Unsealing is cryptographically blocked.
- **After Deadline:** Authorized officers initiate the bid-opening ceremony.
- **Tamper Verification:** Compares original hash vs current calculated hash.
  - `MATCH`: `✓ Bid integrity verified`
  - `MISMATCH`: `⚠ Possible tampering detected`
