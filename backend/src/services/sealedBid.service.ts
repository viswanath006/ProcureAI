import crypto from 'crypto';
import { env } from '../config/env';
import { queryOne, queryRows, query } from '../config/database';
import { Bid, BidHash, BidDocument, TamperAuditLog } from '../types/database';

export interface BidPayloadToEncrypt {
  amountPaisa: number;
  technicalProposal?: string;
  financialProposal?: string;
  coverLetter?: string;
  notes?: string;
}

export interface DecryptedBidPayload {
  amountPaisa: number;
  technicalProposal?: string;
  financialProposal?: string;
  coverLetter?: string;
  notes?: string;
  decryptedAt: string;
}

export interface CanonicalBidInput {
  tenderId: string;
  companyId: string;
  bidReference: string;
  sealedEnvelope: string;
  completionDays: number;
  submittedAt: string;
  documents: Array<{ fileName: string; sha256Hash: string }>;
}

export interface TamperCheckResult {
  isIntact: boolean;
  status: 'MATCH' | 'MISMATCH';
  originalHash: string;
  currentCalculatedHash: string;
  details: string;
  checkedAt: string;
}

/**
 * Derive 32-byte key buffer from environment config.
 */
function getEncryptionKey(): Buffer {
  const raw = env.SEALED_BID_KEY;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

/**
 * ── 1. AES-256-GCM Envelope Encryption ──────────────────────────────────────
 * Sensitive bid figures and proposals are encrypted at application level.
 * Plaintext amounts are NEVER stored in the database.
 */
export function encryptBidEnvelope(payload: BidPayloadToEncrypt): {
  sealedEnvelope: string;
  keyId: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV standard for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = JSON.stringify(payload);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  // Envelope format: SEALED_v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
  const sealedEnvelope = `SEALED_v1:${ivHex}:${authTag}:${encrypted}`;

  return {
    sealedEnvelope,
    keyId: 'KMS_DEV_AES256GCM_V1',
  };
}

/**
 * ── 2. AES-256-GCM Envelope Decryption ──────────────────────────────────────
 * Decrypts a sealed envelope. Authorized ONLY after the tender submission deadline has passed.
 * Throws an error if ciphertext or tag was tampered with.
 */
export function decryptBidEnvelope(sealedEnvelope: string): DecryptedBidPayload {
  const parts = sealedEnvelope.split(':');
  if (parts.length !== 4 || parts[0] !== 'SEALED_v1') {
    throw new Error('INVALID_SEALED_ENVELOPE: Malformed cryptographic envelope format.');
  }

  const [, ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  const parsed = JSON.parse(decrypted);
  return {
    ...parsed,
    decryptedAt: new Date().toISOString(),
  };
}

/**
 * ── 3. Deterministic Canonical SHA-256 Hashing ─────────────────────────────
 * Sorts all attributes deterministically so that re-computing the hash
 * at any time produces the EXACT same SHA-256 output.
 */
export function generateCanonicalBidHash(input: CanonicalBidInput): {
  contentHash: string;
  canonicalJson: string;
} {
  // Sort documents by fileName
  const sortedDocs = [...input.documents].sort((a, b) =>
    a.fileName.localeCompare(b.fileName)
  );

  // Deterministically ordered object
  const canonicalObj = {
    bidReference: input.bidReference,
    companyId: input.companyId,
    completionDays: input.completionDays,
    documents: sortedDocs.map((d) => ({
      fileName: d.fileName,
      sha256Hash: d.sha256Hash.toLowerCase(),
    })),
    sealedEnvelope: input.sealedEnvelope,
    submittedAt: input.submittedAt,
    tenderId: input.tenderId,
  };

  const canonicalJson = JSON.stringify(canonicalObj);
  const contentHash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

  return {
    contentHash,
    canonicalJson,
  };
}

/**
 * ── 4. Cryptographic Receipt Token Generation ──────────────────────────────
 * Generates an immutable, verifiable receipt token for the bidder.
 */
export function generateReceiptToken(bidId: string, contentHash: string): string {
  const prefix = contentHash.substring(0, 16).toUpperCase();
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `REC-2026-${prefix}-${suffix}`;
}

/**
 * ── 5. Tamper Verification Engine ──────────────────────────────────────────
 * Fetches the bid and its original snapshot, recomputes the canonical hash,
 * and checks for MATCH vs MISMATCH. Records result in tamper_audit_logs.
 */
export async function verifyBidTamperStatus(
  bidId: string,
  checkedByUser?: string
): Promise<TamperCheckResult> {
  const bid = await queryOne<Bid>(`SELECT * FROM bids WHERE id = $1`, [bidId]);
  if (!bid) {
    throw new Error('BID_NOT_FOUND: Bid record not found for tamper verification.');
  }

  const originalHashRecord = await queryOne<BidHash>(
    `SELECT * FROM bid_hashes WHERE bid_id = $1 ORDER BY version DESC LIMIT 1`,
    [bidId]
  );

  const originalHash = originalHashRecord
    ? originalHashRecord.content_hash
    : bid.canonical_hash || '';

  if (!originalHash) {
    throw new Error('NO_ORIGINAL_HASH: No baseline cryptographic hash recorded for this bid.');
  }

  // Fetch attached documents
  const docs = await queryRows<BidDocument>(
    `SELECT file_name, sha256_hash FROM bid_documents WHERE bid_id = $1 ORDER BY file_name ASC`,
    [bidId]
  );

  // Re-compute canonical hash from current database values
  const { contentHash: currentCalculatedHash } = generateCanonicalBidHash({
    tenderId: bid.tender_id,
    companyId: bid.company_id,
    bidReference: bid.bid_reference,
    sealedEnvelope: bid.bid_amount_enc || '',
    completionDays: bid.completion_days || 0,
    submittedAt: bid.submitted_at ? new Date(bid.submitted_at).toISOString() : '',
    documents: docs.map((d) => ({
      fileName: d.file_name,
      sha256Hash: d.sha256_hash,
    })),
  });

  const isIntact = originalHash.toLowerCase() === currentCalculatedHash.toLowerCase();
  const status: 'MATCH' | 'MISMATCH' = isIntact ? 'MATCH' : 'MISMATCH';

  const details = isIntact
    ? '✓ Bid integrity verified: Current calculated SHA-256 matches the original immutable submission hash.'
    : '⚠ Possible tampering detected: Calculated SHA-256 differs from original submission hash. Content or ciphertext has been altered!';

  // Update bid integrity_status
  await query(
    `UPDATE bids SET integrity_status = $1 WHERE id = $2`,
    [isIntact ? 'verified' : 'tampered', bidId]
  );

  // Record in tamper_audit_logs
  try {
    await query(
      `INSERT INTO tamper_audit_logs (bid_id, checked_by, original_hash, calculated_hash, status, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [bidId, checkedByUser || null, originalHash, currentCalculatedHash, status, details]
    );
  } catch (err) {
    console.error('Failed to write to tamper_audit_logs:', err);
  }

  return {
    isIntact,
    status,
    originalHash,
    currentCalculatedHash,
    details,
    checkedAt: new Date().toISOString(),
  };
}
