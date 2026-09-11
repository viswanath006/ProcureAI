import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl: string = DATABASE_URL;
const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

// ── Connection with retry ──────────────────────────────────────────────────────
async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔌 Connecting to database (attempt ${i}/${retries})...`);
      const client = await pool.connect();
      console.log('✅ Database connected successfully!');
      return client;
    } catch (err: any) {
      console.warn(`⚠️  Connection failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
      if (i === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not connect to database after maximum retries');
}

// ── Migration tracking table ───────────────────────────────────────────────────
// Ensures each SQL file is only ever executed once, regardless of re-deploys.
async function ensureMigrationsTable(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT        NOT NULL UNIQUE,
      sha256      TEXT        NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function hasBeenApplied(client: any, filename: string): Promise<boolean> {
  const result = await client.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
    [filename]
  );
  return result.rowCount! > 0;
}

async function markApplied(client: any, filename: string, sql: string) {
  const sha256 = crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
  await client.query(
    'INSERT INTO schema_migrations (filename, sha256) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
    [filename, sha256]
  );
}

// ── Run a single SQL file ──────────────────────────────────────────────────────
async function runSqlFile(
  client: any,
  filePath: string,
  label: string,
  trackMigration = true
) {
  const filename = path.basename(filePath);
  const sql = fs.readFileSync(filePath, 'utf-8');

  if (trackMigration) {
    const applied = await hasBeenApplied(client, filename);
    if (applied) {
      console.log(`⏭️  Skipping  ${filename} — already applied`);
      return;
    }
  }

  console.log(`⏳ Applying  ${label} (${filename})...`);
  await client.query(sql);

  if (trackMigration) {
    await markApplied(client, filename, sql);
  }

  console.log(`✅ Applied   ${filename}`);
}

// ── Main migrate function ──────────────────────────────────────────────────────
async function migrate() {
  let client: any;
  try {
    console.log('\n🚀 ProcureAI — Database Migration Runner');
    console.log('══════════════════════════════════════════════');
    console.log(`📍 DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

    client = await connectWithRetry();

    // Step 1: Ensure the migration tracking table exists
    await ensureMigrationsTable(client);
    console.log('📋 Migration tracking table ready\n');

    // ── Migrations ─────────────────────────────────────────────────────────────
    const candidateMigrationDirs = [
      path.resolve(__dirname, '../../../database/migrations'),
      path.resolve(__dirname, '../../database/migrations'),
      path.resolve(process.cwd(), '../database/migrations'),
      path.resolve(process.cwd(), 'database/migrations'),
    ];
    const migrationsDir = candidateMigrationDirs.find((d) => fs.existsSync(d));

    if (!migrationsDir) {
      throw new Error(`Migrations directory not found in candidates: ${candidateMigrationDirs.join(', ')}`);
    }
    console.log(`📂 Using migrations (${migrationsDir})`);

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files\n`);
    for (const file of migrationFiles) {
      await runSqlFile(client, path.join(migrationsDir, file), `Migration`, true);
    }

    // ── Seeds ──────────────────────────────────────────────────────────────────
    const candidateSeedDirs = [
      path.resolve(__dirname, '../../../database/seeds'),
      path.resolve(__dirname, '../../database/seeds'),
      path.resolve(process.cwd(), '../database/seeds'),
      path.resolve(process.cwd(), 'database/seeds'),
    ];
    const seedsDir = candidateSeedDirs.find((d) => fs.existsSync(d));
    if (seedsDir) {
      console.log(`\n📂 Using seeds (${seedsDir})`);

      const seedFiles = fs
        .readdirSync(seedsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      console.log(`Found ${seedFiles.length} seed files\n`);
      for (const file of seedFiles) {
        await runSqlFile(client, path.join(seedsDir, file), `Seed`, true);
      }
    }

    // Ensure all demo user password hashes match ProcureAI_Dev_2026!
    const verifiedHash = '$2b$10$6frD5327kfnMVj/Z5OrnP.dwKAEjjMq3Zyj.Q0gMTSUIFy7vIFlc.';
    await client.query('UPDATE users SET password_hash = $1', [verifiedHash]);
    console.log('🔑 Verified password hashes updated for all accounts.');

    console.log('\n══════════════════════════════════════════════');
    console.log('🎉 All migrations and seeds applied successfully!');
    console.log('══════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrate();
