import { Request, Response, NextFunction } from 'express';
import { query, queryOne, queryRows, withTransaction } from '../config/database';
import { Bid, Tender, Company, CompanyDocument, TenderRequirement, BidHash } from '../types/database';
import {
  encryptBidEnvelope,
  decryptBidEnvelope,
  generateCanonicalBidHash,
  generateReceiptToken,
  verifyBidTamperStatus,
} from '../services/sealedBid.service';
import { evaluateBidderEligibility } from '../services/eligibility.engine';
import { ValidationError, ForbiddenError, NotFoundError } from '../utils/errors';
import { recordChainEvent } from '../services/auditChain.service';

// Helper for audit logging
async function recordAuditLog(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  newState: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, target_ref, new_state)
       VALUES ($1, $2, $3, $4, $4, $5)`,
      [actorId, action, targetType, targetId, JSON.stringify(newState)]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// ── 1. Submit Sealed Bid (12-Step Validation Pipeline) ─────────────────────────
export async function submitSealedBid(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      throw new ForbiddenError('Only authenticated bidders linked to a company can submit bids.');
    }

    const {
      tenderId,
      bidAmountInr,
      completionDays,
      technicalProposal,
      financialProposal,
      coverLetter,
      notes,
      documents = [],
      declarationAccepted,
    } = req.body;

    // Step 1: Validate declaration acceptance
    if (!declarationAccepted) {
      throw new ValidationError(
        'You must accept the statutory submission declaration confirming your proposal is final and binding.',
        'DECLARATION_REQUIRED'
      );
    }

    // Step 2: Validate bid amount
    const amountNum = Number(bidAmountInr);
    if (!amountNum || amountNum <= 0) {
      throw new ValidationError('Bid amount must be a positive number greater than 0 INR.', 'INVALID_BID_AMOUNT');
    }
    const amountPaisa = Math.round(amountNum * 100);

    const daysNum = Number(completionDays);
    if (!daysNum || daysNum <= 0) {
      throw new ValidationError('Completion days must be a positive integer.', 'INVALID_COMPLETION_DAYS');
    }

    // Step 3: Validate tender is OPEN and within submission window
    const tender = await queryOne<Tender>(`SELECT * FROM tenders WHERE id = $1`, [tenderId]);
    if (!tender) {
      throw new NotFoundError('Tender not found.');
    }

    const now = new Date();
    const openTime = new Date(tender.submission_start_at);
    const deadlineTime = new Date(tender.submission_deadline_at);

    if (tender.status !== 'OPEN' && tender.status !== 'PUBLISHED') {
      throw new ValidationError(
        `Tender is not open for submissions. Current status is ${tender.status}.`,
        'TENDER_NOT_OPEN'
      );
    }

    if (now < openTime) {
      throw new ValidationError(
        `Submissions have not opened yet. Opening time: ${openTime.toISOString()}`,
        'SUBMISSION_NOT_STARTED'
      );
    }

    if (now >= deadlineTime) {
      throw new ValidationError(
        `Submission deadline has passed on ${deadlineTime.toISOString()}. Tender is closed to new bids.`,
        'DEADLINE_ELAPSED'
      );
    }

    // Step 4: Enforce single-bid policy (check for existing active bid)
    const existingBid = await queryOne<Bid>(
      `SELECT * FROM bids
       WHERE tender_id = $1 AND company_id = $2 AND status NOT IN ('withdrawn', 'disqualified')`,
      [tenderId, user.companyId]
    );

    if (existingBid) {
      recordChainEvent({
        actor: user.email || user.userId,
        role: user.roleCode || 'BIDDER',
        action: 'suspicious_activity',
        entity: 'bids',
        entity_id: existingBid.id,
        tender_id: tenderId,
        company_id: user.companyId,
        risk_level: 'HIGH',
        details: {
          violation: 'Bidder attempted duplicate submission or overwrite of locked sealed bid',
          existingBidReference: existingBid.bid_reference,
          tenderId,
        },
      }).catch((err) => console.error('Failed to log duplicate bid attempt to audit chain:', err));

      throw new ValidationError(
        `Your company already has an active locked submission (${existingBid.bid_reference}) for this tender. Multiple submissions are strictly prohibited.`,
        'DUPLICATE_BID_PROHIBITED'
      );
    }

    // Step 5: Validate Bidder Eligibility (Phase 5 Eligibility Engine)
    const [company, requirements, companyDocs] = await Promise.all([
      queryOne<Company>(`SELECT * FROM companies WHERE id = $1`, [user.companyId]),
      queryRows<TenderRequirement>(
        `SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC`,
        [tenderId]
      ),
      queryRows<CompanyDocument>(`SELECT * FROM company_documents WHERE company_id = $1`, [user.companyId]),
    ]);

    if (!company) {
      throw new NotFoundError('Company record not found.');
    }

    if (requirements.length > 0) {
      const eligibilityReport = evaluateBidderEligibility(requirements, company, companyDocs);
      if (!eligibilityReport.isEligible) {
        throw new ValidationError(
          `Bidder eligibility gate failed: ${eligibilityReport.disqualificationReason}. Ineligible bidders cannot submit sealed proposals.`,
          'ELIGIBILITY_FAILED'
        );
      }
    }

    // Step 6: Generate unique bid reference
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM bids WHERE tender_id = $1`,
      [tenderId]
    );
    const seq = (Number(countRow?.count || 0) + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const bidReference = `BID-${year}-${tender.reference_number}-${seq}`;

    // Step 7: Application-Layer AES-256-GCM Envelope Encryption
    const { sealedEnvelope, keyId } = encryptBidEnvelope({
      amountPaisa,
      technicalProposal: technicalProposal || 'Standard Technical Proposal Specification',
      financialProposal: financialProposal || `Commercial Quote: INR ${amountNum}`,
      coverLetter: coverLetter || '',
      notes: notes || '',
    });

    const submittedAtIso = now.toISOString();

    // Step 8: Compute Canonical SHA-256 Hash
    const docInputs = Array.isArray(documents)
      ? documents.map((d: any) => ({
          fileName: String(d.fileName || d.file_name || 'Document.pdf'),
          sha256Hash: String(d.sha256Hash || d.sha256_hash || '0'.repeat(64)),
        }))
      : [];

    const { contentHash, canonicalJson } = generateCanonicalBidHash({
      tenderId,
      companyId: user.companyId,
      bidReference,
      sealedEnvelope,
      completionDays: daysNum,
      submittedAt: submittedAtIso,
      documents: docInputs,
    });

    // Step 9: Generate Cryptographic Receipt Token
    const receiptToken = generateReceiptToken(bidReference, contentHash);

    // Step 10: Insert into database in a single atomic transaction
    let newBidId = '';

    await withTransaction(async (client) => {
      // 10a: Insert into bids (Locked & Sealed)
      const bidRes = await client.query<Bid>(
        `INSERT INTO bids (
          tender_id, company_id, created_by, bid_reference, bid_amount_enc,
          bid_amount_currency, technical_proposal, financial_proposal, cover_letter,
          completion_days, status, submitted_at, encryption_key_id, is_locked,
          integrity_status, canonical_hash, receipt_token, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, 'INR', $6, $7, $8, $9, 'submitted', $10, $11, TRUE,
          'verified', $12, $13, $14
        ) RETURNING *`,
        [
          tenderId,
          user.companyId,
          user.userId,
          bidReference,
          sealedEnvelope, // AES-GCM Ciphertext only
          technicalProposal || null,
          financialProposal || null,
          coverLetter || null,
          daysNum,
          now,
          keyId,
          contentHash,
          receiptToken,
          JSON.stringify({
            clientTimestamp: submittedAtIso,
            documentsCount: docInputs.length,
          }),
        ]
      );

      const createdBid = bidRes.rows[0];
      newBidId = createdBid.id;

      // 10b: Insert into bid_hashes
      const hashRes = await client.query<BidHash>(
        `INSERT INTO bid_hashes (
          bid_id, version, hash_algorithm, content_hash, hash_input_json, created_at
        ) VALUES ($1, 1, 'SHA-256', $2, $3, NOW())
        RETURNING id`,
        [newBidId, contentHash, canonicalJson]
      );
      const bidHashId = hashRes.rows[0].id;

      // 10c: Insert into bid_submissions (Sealed Envelope Event)
      await client.query(
        `INSERT INTO bid_submissions (
          bid_id, submitted_by, submission_type, bid_hash_id, ip_address,
          user_agent, declaration_accepted, receipt_token, submitted_at, is_withdrawn
        ) VALUES ($1, $2, 'initial', $3, $4, $5, TRUE, $6, NOW(), FALSE)`,
        [
          newBidId,
          user.userId,
          bidHashId,
          req.ip || '127.0.0.1',
          req.headers['user-agent'] || 'ProcureAI-WebClient',
          receiptToken,
        ]
      );

      // 10d: Insert bid_documents
      for (const doc of docInputs) {
        await client.query(
          `INSERT INTO bid_documents (
            bid_id, uploaded_by, document_type, file_name, file_size_bytes,
            mime_type, storage_key, sha256_hash, is_encrypted, encryption_key_id
          ) VALUES ($1, $2, 'other', $3, 1048576, 'application/pdf', $4, $5, TRUE, $6)`,
          [
            newBidId,
            user.userId,
            doc.fileName,
            `bids/${newBidId}/docs/${doc.fileName}`,
            doc.sha256Hash,
            keyId,
          ]
        );
      }
    });

    await recordAuditLog(
      user.userId,
      'bid_submitted_and_sealed',
      'bids',
      newBidId,
      {
        bidReference,
        tenderId,
        canonicalHash: contentHash,
        receiptToken,
        submittedAt: submittedAtIso,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Bid successfully sealed and cryptographically locked.',
      data: {
        bidId: newBidId,
        bidReference,
        tenderId,
        status: 'SEALED',
        isLocked: true,
        submittedAt: submittedAtIso,
        canonicalHash: contentHash,
        receiptToken,
        tamperStatus: 'MATCH',
        integrityMessage: '✓ Bid integrity verified: Sealed with AES-256-GCM & SHA-256 integrity token.',
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 2. Get Bidder's Own Bids ──────────────────────────────────────────────────
export async function getMyBids(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      throw new ForbiddenError('User is not associated with a registered company.');
    }

    const bids = await queryRows<any>(
      `SELECT
        b.id,
        b.tender_id,
        t.reference_number as tender_reference,
        t.title as tender_title,
        t.status as tender_status,
        t.submission_deadline_at,
        b.bid_reference,
        b.completion_days,
        b.status,
        b.is_locked,
        b.integrity_status,
        b.canonical_hash,
        b.receipt_token,
        b.submitted_at,
        b.unsealed_at
      FROM bids b
      JOIN tenders t ON t.id = b.tender_id
      WHERE b.company_id = $1
      ORDER BY b.created_at DESC`,
      [user.companyId]
    );

    res.json({
      success: true,
      data: { bids },
    });
  } catch (error) {
    next(error);
  }
}

// ── 3. Get Tender Bids for Officer (Enforces Pre-Deadline Secrecy) ─────────────
export async function getTenderBidsForOfficer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenderId = req.params.tenderId as string;
    const tender = await queryOne<Tender>(`SELECT * FROM tenders WHERE id = $1`, [tenderId]);
    if (!tender) {
      throw new NotFoundError('Tender not found.');
    }

    const now = new Date();
    const deadline = new Date(tender.submission_deadline_at);
    const isPastDeadline = now >= deadline;
    const isUnsealed = tender.status === 'BIDS_REVEALED' || tender.status === 'UNDER_EVALUATION' || tender.status === 'RECOMMENDATION_READY' || tender.status === 'DECISION_MADE' || tender.status === 'COMPLETED';

    const bids = await queryRows<any>(
      `SELECT
        b.id,
        b.tender_id,
        b.bid_reference,
        b.company_id,
        c.name as company_name,
        b.completion_days,
        b.status,
        b.is_locked,
        b.integrity_status,
        b.canonical_hash,
        b.receipt_token,
        b.submitted_at,
        b.unsealed_at,
        b.bid_amount_enc
      FROM bids b
      JOIN companies c ON c.id = b.company_id
      WHERE b.tender_id = $1 AND b.status != 'withdrawn'
      ORDER BY b.submitted_at ASC`,
      [tenderId]
    );

    // Filter amounts based on sealing policy
    const sanitizedBids = bids.map((b) => {
      let decryptedAmount: number | null = null;

      if (isUnsealed && b.bid_amount_enc && b.bid_amount_enc.startsWith('SEALED_v1:')) {
        try {
          const payload = decryptBidEnvelope(b.bid_amount_enc);
          decryptedAmount = payload.amountPaisa / 100; // in INR
        } catch {
          decryptedAmount = null;
        }
      }

      return {
        id: b.id,
        bid_reference: b.bid_reference,
        company_name: isPastDeadline || isUnsealed ? b.company_name : 'Sealed Bidder Entity',
        completion_days: b.completion_days,
        status: b.status,
        is_locked: b.is_locked,
        integrity_status: b.integrity_status,
        canonical_hash: b.canonical_hash,
        receipt_token: b.receipt_token,
        submitted_at: b.submitted_at,
        unsealed_at: b.unsealed_at,
        // If sealed, mask ciphertext
        bid_amount_enc: isUnsealed ? b.bid_amount_enc : '[ENCRYPTED_SEALED_ENVELOPE]',
        amount_inr: decryptedAmount,
        envelope_status: isUnsealed ? 'REVEALED' : isPastDeadline ? 'DEADLINE_CLOSED' : 'SEALED_AND_LOCKED',
      };
    });

    res.json({
      success: true,
      data: {
        tenderId,
        status: tender.status,
        deadline: tender.submission_deadline_at,
        isPastDeadline,
        isUnsealed,
        bidsCount: sanitizedBids.length,
        bids: sanitizedBids,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 4. Unseal Tender Bids (Authorized Officer Post-Deadline Action) ───────────
export async function unsealTenderBids(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenderId = req.params.tenderId as string;
    const user = req.user;

    const tender = await queryOne<Tender>(`SELECT * FROM tenders WHERE id = $1`, [tenderId]);
    if (!tender) {
      throw new NotFoundError('Tender not found.');
    }

    const now = new Date();
    const deadline = new Date(tender.submission_deadline_at);

    // Rule: Cannot unseal before deadline
    if (now < deadline) {
      recordChainEvent({
        actor: user?.email || user?.userId || 'unknown',
        role: user?.roleCode || 'GOVT_OFFICER',
        action: 'suspicious_activity',
        entity: 'bids',
        tender_id: tenderId,
        risk_level: 'HIGH',
        details: {
          violation: 'Government officer attempted premature unsealing of cryptographically locked bids before deadline',
          tenderId,
          deadline: deadline.toISOString(),
          attemptedAt: now.toISOString(),
        },
      }).catch((err) => console.error('Failed to log premature unsealing attempt:', err));

      throw new ValidationError(
        `Pre-deadline unsealing is strictly blocked. Bids remain cryptographically sealed until ${deadline.toISOString()}.`,
        'PRE_DEADLINE_UNSEALING_BLOCKED'
      );
    }

    const bids = await queryRows<Bid>(
      `SELECT * FROM bids WHERE tender_id = $1 AND status != 'withdrawn'`,
      [tenderId]
    );

    if (bids.length === 0) {
      throw new ValidationError('No submitted bids to unseal for this tender.', 'NO_BIDS_TO_UNSEAL');
    }

    // Step A: Run tamper check on all bids prior to opening
    const tamperResults = await Promise.all(
      bids.map((b) => verifyBidTamperStatus(b.id, user?.userId))
    );

    const hasTampering = tamperResults.some((t) => !t.isIntact);

    // Step B: Mark tender as BIDS_REVEALED and record unsealed timestamp
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE tenders SET status = 'BIDS_REVEALED', updated_at = NOW() WHERE id = $1`,
        [tenderId]
      );

      await client.query(
        `UPDATE bids SET unsealed_at = NOW(), unsealed_by = $1, updated_at = NOW() WHERE tender_id = $2`,
        [user?.userId || null, tenderId]
      );
    });

    await recordAuditLog(
      user!.userId,
      'tender_bids_unsealed',
      'tenders',
      tenderId,
      {
        bidsCount: bids.length,
        hasTampering,
        unsealedAt: now.toISOString(),
      }
    );

    res.json({
      success: true,
      message: hasTampering
        ? '⚠️ Bids unsealed with tampering warnings. Audit log recorded.'
        : '✓ All bids successfully unsealed. Cryptographic integrity verified for all proposals.',
      data: {
        tenderId,
        status: 'BIDS_REVEALED',
        bidsCount: bids.length,
        hasTampering,
        tamperResults,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 5. Verify Bid Integrity (On-Demand Tamper Check) ───────────────────────────
export async function verifyBidIntegrity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bidId = req.params.bidId as string;
    const result = await verifyBidTamperStatus(bidId, req.user?.userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ── 6. Get Single Bid By ID with IDOR Defense ────────────────────────────────
export async function getBidById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bidId = req.params.bidId as string;
    const user = req.user;

    const bid = await queryOne<any>(
      `SELECT b.*, t.reference_number as tender_reference, t.title as tender_title,
              t.submission_deadline_at, t.status as tender_status, c.name as company_name
       FROM bids b
       JOIN tenders t ON t.id = b.tender_id
       JOIN companies c ON c.id = b.company_id
       WHERE b.id = $1`,
      [bidId]
    );

    if (!bid) {
      throw new NotFoundError('Bid proposal not found.');
    }

    // IDOR Protection: If caller is a BIDDER, they can ONLY view bids from their OWN company
    if (user?.roleCode === 'BIDDER') {
      if (!user.companyId || bid.company_id !== user.companyId) {
        await recordChainEvent({
          actor: user.email || user.userId,
          role: 'BIDDER',
          action: 'suspicious_activity',
          entity: 'bids',
          entity_id: bid.id,
          tender_id: bid.tender_id,
          company_id: user.companyId || undefined,
          risk_level: 'CRITICAL',
          details: {
            violation: 'IDOR Security Violation: Bidder attempted unauthorized access to competitor proposal',
            attackerCompanyId: user.companyId,
            targetCompanyId: bid.company_id,
            targetBidId: bidId,
            targetBidReference: bid.bid_reference,
          },
        });

        throw new ForbiddenError(
          'Security Policy Violation: Access to competing bidder proposals is strictly prohibited.',
          'IDOR_FORBIDDEN'
        );
      }
    }

    // Pre-deadline secrecy protection for officers
    const now = new Date();
    const deadline = new Date(bid.submission_deadline_at);
    const isPastDeadline = now >= deadline;
    const isUnsealed = ['BIDS_REVEALED', 'UNDER_EVALUATION', 'RECOMMENDATION_READY', 'DECISION_MADE', 'COMPLETED'].includes(bid.tender_status);

    let decryptedAmount: number | null = null;
    if (isUnsealed && bid.bid_amount_enc && bid.bid_amount_enc.startsWith('SEALED_v1:')) {
      try {
        const payload = decryptBidEnvelope(bid.bid_amount_enc);
        decryptedAmount = payload.amountPaisa / 100;
      } catch {
        decryptedAmount = null;
      }
    }

    res.json({
      success: true,
      data: {
        id: bid.id,
        bid_reference: bid.bid_reference,
        tender_id: bid.tender_id,
        tender_reference: bid.tender_reference,
        company_name: isPastDeadline || isUnsealed || user?.companyId === bid.company_id ? bid.company_name : 'Sealed Bidder Entity',
        status: bid.status,
        is_locked: bid.is_locked,
        integrity_status: bid.integrity_status,
        canonical_hash: bid.canonical_hash,
        receipt_token: bid.receipt_token,
        submitted_at: bid.submitted_at,
        amount_inr: decryptedAmount,
        bid_amount_enc: isUnsealed || user?.companyId === bid.company_id ? bid.bid_amount_enc : '[ENCRYPTED_SEALED_ENVELOPE]',
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 7. Explicit Reject on Bid Modification ──────────────────────────────────
export async function rejectBidModification(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user;
  const bidId = String(req.params.bidId);

  recordChainEvent({
    actor: user?.email || user?.userId || 'unknown',
    role: user?.roleCode || 'ANONYMOUS',
    action: 'suspicious_activity',
    entity: 'bids',
    entity_id: bidId,
    risk_level: 'CRITICAL',
    details: {
      violation: 'Unauthorized attempt to modify or mutate submitted sealed bid proposal',
      bidId,
      method: req.method,
    },
  }).catch((err) => console.error('Failed to log bid modification attempt:', err));

  next(
    new ForbiddenError(
      'GOVERNANCE AUDIT NOTICE: Submitted sealed bids are immutable legal instruments. Any alteration or modification is strictly prohibited.',
      'BID_MODIFICATION_PROHIBITED'
    )
  );
}
