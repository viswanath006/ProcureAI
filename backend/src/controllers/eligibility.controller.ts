import { Request, Response, NextFunction } from 'express';
import { query, queryOne, queryRows, withTransaction } from '../config/database';
import { Company, CompanyDocument, TenderRequirement, Bid } from '../types/database';
import { evaluateBidderEligibility, BidderEligibilityReport } from '../services/eligibility.engine';
import crypto from 'crypto';

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

// ── 1. Get Bidder's Company Profile ───────────────────────────────────────────
export async function getMyCompanyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_COMPANY_AFFILIATION', message: 'User is not linked to a registered bidder company.' },
      });
      return;
    }

    const company = await queryOne<Company>(
      `SELECT * FROM companies WHERE id = $1`,
      [companyId]
    );

    if (!company) {
      res.status(404).json({
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'Company record not found.' },
      });
      return;
    }

    const documents = await queryRows<CompanyDocument>(
      `SELECT * FROM company_documents WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );

    res.json({
      success: true,
      data: {
        company,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 2. Update Bidder's Company Profile ────────────────────────────────────────
export async function updateMyCompanyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_COMPANY_AFFILIATION', message: 'User is not linked to a company.' },
      });
      return;
    }

    const {
      name,
      legal_name,
      tax_id,
      industry,
      address_line1,
      city,
      state,
      postal_code,
      website,
      annual_turnover_inr,
      net_worth_inr,
      years_in_operation,
      employee_count,
      completed_projects,
      technical_capabilities,
      financial_capacity,
      compliance_info,
    } = req.body;

    const annualTurnoverPaisa = annual_turnover_inr !== undefined ? Math.round(Number(annual_turnover_inr) * 100) : undefined;
    const netWorthPaisa = net_worth_inr !== undefined ? Math.round(Number(net_worth_inr) * 100) : undefined;
    const projectsCount = Array.isArray(completed_projects) ? completed_projects.length : undefined;

    const updated = await queryOne<Company>(
      `UPDATE companies SET
        name = COALESCE($1, name),
        legal_name = COALESCE($2, legal_name),
        tax_id = COALESCE($3, tax_id),
        industry = COALESCE($4, industry),
        address_line1 = COALESCE($5, address_line1),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        postal_code = COALESCE($8, postal_code),
        website = COALESCE($9, website),
        annual_turnover_paisa = COALESCE($10, annual_turnover_paisa),
        net_worth_paisa = COALESCE($11, net_worth_paisa),
        years_in_operation = COALESCE($12, years_in_operation),
        employee_count = COALESCE($13, employee_count),
        completed_projects = COALESCE($14::jsonb, completed_projects),
        completed_projects_count = COALESCE($15, completed_projects_count),
        technical_capabilities = COALESCE($16::jsonb, technical_capabilities),
        financial_capacity = COALESCE($17::jsonb, financial_capacity),
        compliance_info = COALESCE($18::jsonb, compliance_info),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *`,
      [
        name,
        legal_name,
        tax_id,
        industry,
        address_line1,
        city,
        state,
        postal_code,
        website,
        annualTurnoverPaisa,
        netWorthPaisa,
        years_in_operation,
        employee_count,
        completed_projects ? JSON.stringify(completed_projects) : null,
        projectsCount,
        technical_capabilities ? JSON.stringify(technical_capabilities) : null,
        financial_capacity ? JSON.stringify(financial_capacity) : null,
        compliance_info ? JSON.stringify(compliance_info) : null,
        companyId,
      ]
    );

    await recordAuditLog(
      req.user!.userId,
      'company_verified',
      'companies',
      companyId,
      { name, annualTurnoverPaisa, years_in_operation }
    );

    res.json({
      success: true,
      message: 'Company profile updated successfully.',
      data: { company: updated },
    });
  } catch (error) {
    next(error);
  }
}

// ── 3. Upload / Register Company Document ─────────────────────────────────────
export async function uploadCompanyDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_COMPANY_AFFILIATION', message: 'User is not linked to a company.' },
      });
      return;
    }

    const {
      document_type,
      file_name,
      file_size_bytes = 1048576,
      mime_type = 'application/pdf',
      sha256_hash,
      valid_until,
      metadata = {},
    } = req.body;

    if (!file_name || !document_type) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'document_type and file_name are required.' },
      });
      return;
    }

    // Generate or validate SHA-256 hash
    const finalHash = sha256_hash && sha256_hash.length === 64
      ? sha256_hash
      : crypto.createHash('sha256').update(file_name + Date.now().toString()).digest('hex');

    const storageKey = `company/${companyId}/docs/${Date.now()}_${file_name.replace(/\s+/g, '_')}`;

    const doc = await queryOne<CompanyDocument>(
      `INSERT INTO company_documents (
        company_id, uploaded_by, document_type, file_name, file_size_bytes,
        mime_type, storage_key, sha256_hash, status, valid_until, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9, $10)
      RETURNING *`,
      [
        companyId,
        req.user!.userId,
        document_type,
        file_name,
        file_size_bytes,
        mime_type,
        storageKey,
        finalHash,
        valid_until || null,
        JSON.stringify(metadata),
      ]
    );

    await recordAuditLog(
      req.user!.userId,
      'document_uploaded',
      'company_documents',
      doc!.id,
      { file_name, sha256_hash: finalHash }
    );

    res.status(201).json({
      success: true,
      message: 'Compliance document registered successfully.',
      data: { document: doc },
    });
  } catch (error) {
    next(error);
  }
}

// ── 4. Delete Company Document ────────────────────────────────────────────────
export async function deleteCompanyDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    const docId = req.params.docId as string;

    const deleted = await queryOne<CompanyDocument>(
      `DELETE FROM company_documents WHERE id = $1 AND company_id = $2 RETURNING *`,
      [docId, companyId]
    );

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// ── 5. Bidder Self-Check Eligibility (Pre-check) ──────────────────────────────
export async function precheckEligibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    const tenderId = req.params.tenderId as string;

    if (!companyId) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'Bidder must belong to a company to run pre-check.' },
      });
      return;
    }

    const [company, requirements, documents] = await Promise.all([
      queryOne<Company>(`SELECT * FROM companies WHERE id = $1`, [companyId]),
      queryRows<TenderRequirement>(
        `SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC, created_at ASC`,
        [tenderId]
      ),
      queryRows<CompanyDocument>(`SELECT * FROM company_documents WHERE company_id = $1`, [companyId]),
    ]);

    if (!company) {
      res.status(404).json({ success: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found.' } });
      return;
    }

    if (requirements.length === 0) {
      res.json({
        success: true,
        data: {
          report: {
            companyId,
            companyName: company.name,
            tenderId,
            isEligible: true,
            verdict: 'ELIGIBLE',
            summaryExplanation: 'No mandatory eligibility requirements defined for this tender. Entity is automatically qualified.',
            checks: [],
            evaluatedAt: new Date().toISOString(),
            nonDiscriminationVerified: true,
          },
        },
      });
      return;
    }

    const report = evaluateBidderEligibility(requirements, company, documents);

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
}

// ── 6. Evaluate Single Bid Eligibility ────────────────────────────────────────
export async function evaluateBidEligibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bidId = req.params.bidId as string;

    const bid = await queryOne<Bid>(`SELECT * FROM bids WHERE id = $1`, [bidId]);
    if (!bid) {
      res.status(404).json({ success: false, error: { code: 'BID_NOT_FOUND', message: 'Bid not found.' } });
      return;
    }

    const [company, requirements, documents] = await Promise.all([
      queryOne<Company>(`SELECT * FROM companies WHERE id = $1`, [bid.company_id]),
      queryRows<TenderRequirement>(
        `SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC, created_at ASC`,
        [bid.tender_id]
      ),
      queryRows<CompanyDocument>(`SELECT * FROM company_documents WHERE company_id = $1`, [bid.company_id]),
    ]);

    if (!company) {
      res.status(404).json({ success: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Company record missing.' } });
      return;
    }

    const report = evaluateBidderEligibility(requirements, company, documents, bidId);

    // Persist results into eligibility_results and update bid status
    await withTransaction(async (client) => {
      for (const check of report.checks) {
        await client.query(
          `INSERT INTO eligibility_results (
            bid_id, requirement_id, status, score, evidence_summary,
            evidence_detail, rule_type, is_disqualifying, checked_by_user, checked_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (bid_id, requirement_id) DO UPDATE SET
            status = EXCLUDED.status,
            score = EXCLUDED.score,
            evidence_summary = EXCLUDED.evidence_summary,
            evidence_detail = EXCLUDED.evidence_detail,
            rule_type = EXCLUDED.rule_type,
            is_disqualifying = EXCLUDED.is_disqualifying,
            checked_at = NOW()`,
          [
            bidId,
            check.requirementId,
            check.status,
            check.score,
            check.evidenceSummary,
            JSON.stringify(check.evidenceDetail),
            check.ruleType,
            !check.passed && check.isMandatory,
            req.user?.userId || null,
          ]
        );
      }

      // Update bid status
      const newStatus = report.isEligible ? 'under_review' : 'disqualified';
      await client.query(
        `UPDATE bids SET
          status = $1,
          disqualification_reason = $2,
          updated_at = NOW()
        WHERE id = $3`,
        [newStatus, report.disqualificationReason || null, bidId]
      );
    });

    res.json({
      success: true,
      message: `Bid eligibility evaluated: ${report.verdict}`,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
}

// ── 7. Screen All Bidders for a Tender (Government Officer Action) ────────────
export async function evaluateTenderEligibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenderId = req.params.tenderId as string;

    const requirements = await queryRows<TenderRequirement>(
      `SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [tenderId]
    );

    const bids = await queryRows<Bid>(
      `SELECT * FROM bids WHERE tender_id = $1 AND status != 'withdrawn'`,
      [tenderId]
    );

    if (bids.length === 0) {
      res.json({
        success: true,
        message: 'No active bids submitted for this tender.',
        data: { totalBids: 0, eligibleBids: 0, disqualifiedBids: 0, reports: [] },
      });
      return;
    }

    const reports: BidderEligibilityReport[] = [];
    let eligibleCount = 0;
    let disqualifiedCount = 0;

    await withTransaction(async (client) => {
      for (const bid of bids) {
        const [company, documents] = await Promise.all([
          queryOne<Company>(`SELECT * FROM companies WHERE id = $1`, [bid.company_id]),
          queryRows<CompanyDocument>(`SELECT * FROM company_documents WHERE company_id = $1`, [bid.company_id]),
        ]);

        if (!company) continue;

        const report = evaluateBidderEligibility(requirements, company, documents, bid.id);
        reports.push(report);

        if (report.isEligible) {
          eligibleCount++;
        } else {
          disqualifiedCount++;
        }

        // Upsert eligibility_results for each requirement
        for (const check of report.checks) {
          await client.query(
            `INSERT INTO eligibility_results (
              bid_id, requirement_id, status, score, evidence_summary,
              evidence_detail, rule_type, is_disqualifying, checked_by_user, checked_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (bid_id, requirement_id) DO UPDATE SET
              status = EXCLUDED.status,
              score = EXCLUDED.score,
              evidence_summary = EXCLUDED.evidence_summary,
              evidence_detail = EXCLUDED.evidence_detail,
              rule_type = EXCLUDED.rule_type,
              is_disqualifying = EXCLUDED.is_disqualifying,
              checked_at = NOW()`,
            [
              bid.id,
              check.requirementId,
              check.status,
              check.score,
              check.evidenceSummary,
              JSON.stringify(check.evidenceDetail),
              check.ruleType,
              !check.passed && check.isMandatory,
              req.user?.userId || null,
            ]
          );
        }

        // Update bid status
        const newStatus = report.isEligible ? 'under_review' : 'disqualified';
        await client.query(
          `UPDATE bids SET
            status = $1,
            disqualification_reason = $2,
            updated_at = NOW()
          WHERE id = $3`,
          [newStatus, report.disqualificationReason || null, bid.id]
        );
      }
    });

    await recordAuditLog(
      req.user!.userId,
      'eligibility_check_run',
      'tenders',
      tenderId,
      { totalBids: bids.length, eligibleCount, disqualifiedCount }
    );

    res.json({
      success: true,
      message: `Eligibility screening complete. ${eligibleCount} eligible, ${disqualifiedCount} disqualified.`,
      data: {
        tenderId,
        totalBids: bids.length,
        eligibleBids: eligibleCount,
        disqualifiedBids: disqualifiedCount,
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── 8. Get Eligibility Screening Summary for Tender ───────────────────────────
export async function getTenderEligibilitySummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenderId = req.params.tenderId as string;

    const bidsWithEligibility = await queryRows<any>(
      `SELECT
        b.id as bid_id,
        b.bid_reference,
        b.status as bid_status,
        b.disqualification_reason,
        c.id as company_id,
        c.name as company_name,
        c.years_in_operation,
        c.annual_turnover_paisa,
        c.completed_projects_count,
        COALESCE(
          json_agg(
            json_build_object(
              'requirement_id', er.requirement_id,
              'requirement_title', tr.title,
              'requirement_type', tr.requirement_type,
              'is_mandatory', tr.is_mandatory,
              'status', er.status,
              'score', er.score,
              'evidence_summary', er.evidence_summary,
              'evidence_detail', er.evidence_detail,
              'rule_type', er.rule_type,
              'is_disqualifying', er.is_disqualifying
            )
          ) FILTER (WHERE er.id IS NOT NULL), '[]'
        ) as checks
      FROM bids b
      JOIN companies c ON c.id = b.company_id
      LEFT JOIN eligibility_results er ON er.bid_id = b.id
      LEFT JOIN tender_requirements tr ON tr.id = er.requirement_id
      WHERE b.tender_id = $1 AND b.status != 'withdrawn'
      GROUP BY b.id, c.id, c.name, c.years_in_operation, c.annual_turnover_paisa, c.completed_projects_count`,
      [tenderId]
    );

    const total = bidsWithEligibility.length;
    const eligible = bidsWithEligibility.filter((b) => b.bid_status !== 'disqualified').length;
    const disqualified = total - eligible;

    res.json({
      success: true,
      data: {
        tenderId,
        totalBids: total,
        eligibleBids: eligible,
        disqualifiedBids: disqualified,
        bids: bidsWithEligibility,
      },
    });
  } catch (error) {
    next(error);
  }
}
