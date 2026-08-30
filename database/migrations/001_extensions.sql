-- =============================================================================
-- Migration 001 — PostgreSQL Extensions
-- ProcureAI Phase 2 Database Architecture
-- =============================================================================

-- pgcrypto: gen_random_uuid(), crypt(), digest() — UUIDs + hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- uuid-ossp: uuid_generate_v4() — alternate UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: trigram indexes for fuzzy text search on tender titles / company names
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- citext: case-insensitive text type for emails
CREATE EXTENSION IF NOT EXISTS "citext";
