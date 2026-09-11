"""
ProcureAI OSINT Module — MCA Company Master Data Lookup Service
Retrieves, verifies, and caches public company records from data.gov.in.

Key Requirements:
1. Lookup by CIN (Corporate Identification Number)
2. Read API key from MCA_OGD_API_KEY environment variable (NEVER hardcoded)
3. Return: company_status (active/struck-off), incorporation_date, registered_address,
   directors (names + DIN if available), authorized_capital
4. 30-day TTL caching in PostgreSQL (osint_company_cache) with in-memory fallback
5. Graceful failure handling: Never block bid submission; return 'unavailable' for manual review
"""

import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("procureai.osint")
logging.basicConfig(level=logging.INFO)

# In-memory TTL cache for offline/testing/fallback execution
_IN_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}

DEFAULT_OGD_RESOURCE_ID = "e37d5796-0e3a-4ef8-83ec-232185d2630a"
OGD_BASE_URL = "https://api.data.gov.in/resource/"


class DirectorRecord(BaseModel):
    name: str
    din: Optional[str] = None
    designation: Optional[str] = "Director"
    appointed_date: Optional[str] = None


class MCACompanyRecord(BaseModel):
    cin: str
    company_name: str
    company_status: str = "ACTIVE"  # "ACTIVE" | "STRUCK OFF" | "UNDER LIQUIDATION" | "DORMANT"
    incorporation_date: Optional[str] = None  # YYYY-MM-DD
    registered_address: Optional[str] = None
    directors: List[DirectorRecord] = Field(default_factory=list)
    authorized_capital: float = 0.0
    paid_up_capital: float = 0.0
    source: str = "api"  # "api" | "cache"
    fetched_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str = Field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(days=30)).isoformat())


class OSINTLookupResult(BaseModel):
    cin: str
    verification_status: str  # "verified" | "mismatch" | "unavailable"
    company_status: Optional[str] = None
    company_record: Optional[MCACompanyRecord] = None
    discrepancy_details: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None
    is_cached: bool = False
    source: str = "ogd"


class MCALookupService:
    """
    Public Records Intelligence Service for statutory corporate identity verification.
    """

    @classmethod
    def get_api_key(cls) -> Optional[str]:
        """Reads the data.gov.in API key from the environment."""
        return os.getenv("MCA_OGD_API_KEY")

    @classmethod
    def get_database_url(cls) -> Optional[str]:
        """Reads DATABASE_URL for Postgres caching."""
        return os.getenv("DATABASE_URL")

    # ── PostgreSQL Cache Layer ────────────────────────────────────────────────

    @classmethod
    def _get_from_postgres_cache(cls, cin: str) -> Optional[MCACompanyRecord]:
        db_url = cls.get_database_url()
        if not db_url:
            return None

        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor

            conn = psycopg2.connect(db_url, connect_timeout=3)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT cin, company_name, company_status,
                           incorporation_date::text, registered_address,
                           directors, authorized_capital, fetched_at::text, expires_at::text
                    FROM osint_company_cache
                    WHERE cin = %s AND expires_at > NOW()
                    LIMIT 1
                    """,
                    (cin.strip().upper(),),
                )
                row = cur.fetchone()
                conn.close()

                if row:
                    dirs_raw = row.get("directors") or []
                    if isinstance(dirs_raw, str):
                        dirs_raw = json.loads(dirs_raw)
                    directors = [DirectorRecord(**d) if isinstance(d, dict) else DirectorRecord(name=str(d)) for d in dirs_raw]

                    return MCACompanyRecord(
                        cin=row["cin"],
                        company_name=row["company_name"],
                        company_status=row["company_status"],
                        incorporation_date=row["incorporation_date"],
                        registered_address=row["registered_address"],
                        directors=directors,
                        authorized_capital=float(row["authorized_capital"] or 0.0),
                        source="cache",
                        fetched_at=row["fetched_at"],
                        expires_at=row["expires_at"],
                    )
        except Exception as e:
            logger.warning(f"Postgres cache read failed (fallback to in-memory): {e}")
        return None

    @classmethod
    def _save_to_postgres_cache(cls, record: MCACompanyRecord) -> bool:
        db_url = cls.get_database_url()
        if not db_url:
            return False

        try:
            import psycopg2

            conn = psycopg2.connect(db_url, connect_timeout=3)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO osint_company_cache
                        (cin, company_name, company_status, incorporation_date, registered_address, directors, authorized_capital, fetched_at, expires_at)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (cin) DO UPDATE SET
                        company_name = EXCLUDED.company_name,
                        company_status = EXCLUDED.company_status,
                        incorporation_date = EXCLUDED.incorporation_date,
                        registered_address = EXCLUDED.registered_address,
                        directors = EXCLUDED.directors,
                        authorized_capital = EXCLUDED.authorized_capital,
                        fetched_at = EXCLUDED.fetched_at,
                        expires_at = EXCLUDED.expires_at
                    """,
                    (
                        record.cin,
                        record.company_name,
                        record.company_status,
                        record.incorporation_date,
                        record.registered_address,
                        json.dumps([d.dict() for d in record.directors]),
                        record.authorized_capital,
                        record.fetched_at,
                        record.expires_at,
                    ),
                )
                conn.commit()
                conn.close()
                return True
        except Exception as e:
            logger.warning(f"Postgres cache write failed: {e}")
            return False

    # ── In-Memory Cache Fallback (30-day TTL) ──────────────────────────────────

    @classmethod
    def _get_from_memory_cache(cls, cin: str) -> Optional[MCACompanyRecord]:
        cin_key = cin.strip().upper()
        entry = _IN_MEMORY_CACHE.get(cin_key)
        if not entry:
            return None

        # Check expiry
        now_dt = datetime.now(timezone.utc)
        expires_dt = datetime.fromisoformat(entry["expires_at"])
        if now_dt > expires_dt:
            del _IN_MEMORY_CACHE[cin_key]
            return None

        return MCACompanyRecord(**entry)

    @classmethod
    def _save_to_memory_cache(cls, record: MCACompanyRecord):
        cin_key = record.cin.strip().upper()
        _IN_MEMORY_CACHE[cin_key] = record.model_dump() if hasattr(record, "model_dump") else record.dict()

    # ── Core Lookup Implementation ───────────────────────────────────────────

    @classmethod
    def lookup_cin(
        cls,
        cin: str,
        declared_company_name: Optional[str] = None,
        declared_inc_date: Optional[str] = None,
        client: Optional[httpx.Client] = None,
    ) -> OSINTLookupResult:
        """
        Executes statutory lookup of a CIN against cache and data.gov.in.
        Compares declared company credentials if supplied.
        Handles timeouts and errors gracefully without raising unhandled exceptions.
        """
        if not cin or not cin.strip():
            return OSINTLookupResult(
                cin=cin or "",
                verification_status="unavailable",
                reason="No CIN provided for statutory verification",
            )

        clean_cin = cin.strip().upper()

        # 1. Check PostgreSQL Cache (30-day TTL)
        cached_record = cls._get_from_postgres_cache(clean_cin)
        if not cached_record:
            # Check In-Memory Cache
            cached_record = cls._get_from_memory_cache(clean_cin)

        if cached_record:
            logger.info(f"OSINT cache hit for CIN: {clean_cin} (Expires: {cached_record.expires_at})")
            return cls._evaluate_verification(cached_record, declared_company_name, declared_inc_date, is_cached=True)

        # 2. Check API Key
        api_key = cls.get_api_key()
        if not api_key:
            logger.warning(
                f"MCA_OGD_API_KEY not configured. Marking OSINT verification as unavailable for CIN {clean_cin}."
            )
            return OSINTLookupResult(
                cin=clean_cin,
                verification_status="unavailable",
                reason="OSINT verification unavailable (API key not configured)",
            )

        # 3. Call Official data.gov.in MCA Company Master Data API
        try:
            url = f"{OGD_BASE_URL}{DEFAULT_OGD_RESOURCE_ID}"
            params = {
                "api-key": api_key,
                "format": "json",
                "filters[cin]": clean_cin,
                "limit": 1,
            }

            headers = {
                "User-Agent": "ProcureAI-OSINT/1.0 (Government Procurement Governance)",
                "Accept": "application/json",
            }

            caller = client or httpx.Client(timeout=8.0)
            try:
                response = caller.get(url, params=params, headers=headers)
            finally:
                if client is None:
                    caller.close()

            if response.status_code != 200:
                logger.warning(
                    f"data.gov.in API returned HTTP {response.status_code} for CIN {clean_cin}: {response.text[:200]}"
                )
                return OSINTLookupResult(
                    cin=clean_cin,
                    verification_status="unavailable",
                    reason=f"OSINT verification unavailable (External API returned HTTP {response.status_code})",
                )

            data = response.json()
            records = data.get("records", [])

            if not records:
                logger.info(f"CIN {clean_cin} not found in public MCA records.")
                return OSINTLookupResult(
                    cin=clean_cin,
                    verification_status="mismatch",
                    reason="CIN not found in MCA official registrar records",
                    discrepancy_details={"error": "CIN not found in MCA Master Data"},
                )

            rec = records[0]

            # 4. Parse MCA Record Fields
            company_name = (
                rec.get("company_name")
                or rec.get("CompanyName")
                or rec.get("company")
                or "Unknown Company"
            ).strip()

            raw_status = (
                rec.get("company_status")
                or rec.get("CompanyStatus")
                or rec.get("status")
                or "ACTIVE"
            ).strip().upper()

            # Normalize status
            if "STRUCK" in raw_status or "STRIKE" in raw_status:
                company_status = "STRUCK OFF"
            elif "LIQUIDAT" in raw_status or "DISSOLV" in raw_status:
                company_status = "UNDER LIQUIDATION"
            elif "DORMANT" in raw_status:
                company_status = "DORMANT"
            else:
                company_status = "ACTIVE"

            inc_date = (
                rec.get("date_of_incorporation")
                or rec.get("incorporation_date")
                or rec.get("date_of_registration")
            )
            # Format to YYYY-MM-DD if possible
            formatted_inc_date = cls._normalize_date(inc_date)

            registered_address = (
                rec.get("registered_office_address")
                or rec.get("registered_address")
                or rec.get("address")
                or "Registered Office, India"
            ).strip()

            authorized_capital = float(rec.get("authorized_capital") or rec.get("authorized_capital_inr") or 0.0)
            paid_up_capital = float(rec.get("paid_up_capital") or rec.get("paid_up_capital_inr") or 0.0)

            # Directors parsing (if available in payload)
            directors: List[DirectorRecord] = []
            dirs_raw = rec.get("directors") or rec.get("directors_list") or []
            if isinstance(dirs_raw, list):
                for d in dirs_raw:
                    if isinstance(d, dict):
                        directors.append(DirectorRecord(
                            name=d.get("name") or d.get("director_name") or "Unknown Director",
                            din=d.get("din") or d.get("director_din"),
                            designation=d.get("designation") or "Director",
                            appointed_date=cls._normalize_date(d.get("date_of_appointment")),
                        ))
                    elif isinstance(d, str):
                        directors.append(DirectorRecord(name=d))

            company_record = MCACompanyRecord(
                cin=clean_cin,
                company_name=company_name,
                company_status=company_status,
                incorporation_date=formatted_inc_date,
                registered_address=registered_address,
                directors=directors,
                authorized_capital=authorized_capital,
                paid_up_capital=paid_up_capital,
                source="api",
            )

            # 5. Cache response in PostgreSQL & Memory (30-day TTL)
            cls._save_to_postgres_cache(company_record)
            cls._save_to_memory_cache(company_record)

            # 6. Evaluate Verification Result
            return cls._evaluate_verification(company_record, declared_company_name, declared_inc_date, is_cached=False)

        except (httpx.TimeoutException, httpx.NetworkError) as e:
            logger.warning(f"data.gov.in network timeout/failure for CIN {clean_cin}: {e}")
            return OSINTLookupResult(
                cin=clean_cin,
                verification_status="unavailable",
                reason="OSINT verification unavailable (Connection timeout / network error)",
            )
        except Exception as e:
            logger.error(f"Unexpected error during OSINT lookup for CIN {clean_cin}: {e}")
            return OSINTLookupResult(
                cin=clean_cin,
                verification_status="unavailable",
                reason=f"OSINT verification unavailable ({str(e)})",
            )

    @classmethod
    def _normalize_date(cls, raw_date: Optional[str]) -> Optional[str]:
        if not raw_date:
            return None
        raw = str(raw_date).strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y"):
            try:
                dt = datetime.strptime(raw[:10], fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return raw[:10]

    @classmethod
    def _evaluate_verification(
        cls,
        record: MCACompanyRecord,
        declared_name: Optional[str] = None,
        declared_inc_date: Optional[str] = None,
        is_cached: bool = False,
    ) -> OSINTLookupResult:
        """
        Compares returned MCA record with self-declared bidder information.
        Identifies status, name discrepancies, or date mismatches.
        """
        discrepancies: Dict[str, Any] = {}

        # 1. Company Status Check (must be ACTIVE)
        if record.company_status != "ACTIVE":
            discrepancies["company_status"] = {
                "mca_status": record.company_status,
                "detail": f"Statutory company status is {record.company_status} (Not Active)",
            }

        # 2. Company Name Check (if declared)
        if declared_name:
            import re

            def _norm_co_name(n: str) -> str:
                s = n.lower()
                s = re.sub(r'\bpvt\b\.?', 'private', s)
                s = re.sub(r'\bltd\b\.?', 'limited', s)
                s = re.sub(r'\bcorp\b\.?', 'corporation', s)
                s = re.sub(r'\binc\b\.?', 'incorporated', s)
                return "".join(c for c in s if c.isalnum())

            norm_declared = _norm_co_name(declared_name)
            norm_mca = _norm_co_name(record.company_name)

            # Check substring match or exact match
            if norm_declared not in norm_mca and norm_mca not in norm_declared:
                tokens_dec = set(re.findall(r'\w+', declared_name.lower()))
                tokens_mca = set(re.findall(r'\w+', record.company_name.lower()))
                stop_words = {'pvt', 'private', 'ltd', 'limited', 'solutions', 'services', 'the', 'and', '&'}
                meaningful_dec = tokens_dec - stop_words
                meaningful_mca = tokens_mca - stop_words
                if not (meaningful_dec and (meaningful_dec.issubset(meaningful_mca) or meaningful_mca.issubset(meaningful_dec))):
                    discrepancies["company_name"] = {
                        "declared": declared_name,
                        "mca_registered": record.company_name,
                        "detail": "Declared company name does not match MCA statutory registration",
                    }

        # 3. Incorporation Date Check (if declared)
        if declared_inc_date and record.incorporation_date:
            norm_dec_date = cls._normalize_date(declared_inc_date)
            if norm_dec_date and norm_dec_date != record.incorporation_date:
                discrepancies["incorporation_date"] = {
                    "declared": declared_inc_date,
                    "mca_registered": record.incorporation_date,
                    "detail": "Declared incorporation date does not match MCA records",
                }

        verification_status = "mismatch" if discrepancies else "verified"
        reason = (
            "Discrepancies identified between self-declared bid data and MCA public records"
            if discrepancies
            else "Statutory company identity verified with active MCA registration"
        )

        return OSINTLookupResult(
            cin=record.cin,
            verification_status=verification_status,
            company_status=record.company_status,
            company_record=record,
            discrepancy_details=discrepancies,
            reason=reason,
            is_cached=is_cached,
            source="cache" if is_cached else "ogd",
        )
