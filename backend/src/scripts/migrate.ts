import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
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

async function runSqlFile(client: any, filePath: string, description: string) {
  console.log(`⏳ Executing ${description} (${path.basename(filePath)})...`);
  const sql = fs.readFileSync(filePath, 'utf-8');
  await client.query(sql);
  console.log(`✅ Completed ${description}`);
}

async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔌 Connecting to database (attempt ${i}/${retries})...`);
      const client = await pool.connect();
      console.log('✅ Database connected successfully!');
      return client;
    } catch (err: any) {
      console.warn(`⚠️ Connection failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
      if (i === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not connect to database after maximum retries');
}

async function migrate() {
  let client;
  try {
    console.log('🚀 Starting database migration and seeding for Render/Cloud Postgres...\n');
    console.log(`📍 DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
    client = await connectWithRetry();

    // Check for self-contained bundle first (works when rootDir is backend)
    const bundleMigrations = path.resolve(__dirname, '../db-bundle/all_migrations.sql');
    const bundleSeeds = path.resolve(__dirname, '../db-bundle/all_seeds.sql');

    if (fs.existsSync(bundleMigrations)) {
      console.log('📦 Using self-contained db-bundle inside backend service...');
      await runSqlFile(client, bundleMigrations, 'All Database Migrations');
      if (fs.existsSync(bundleSeeds)) {
        await runSqlFile(client, bundleSeeds, 'All Initial Seeds');
      }
    } else {
      // Fallback to reading root database directory
      const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
      if (!fs.existsSync(migrationsDir)) {
        throw new Error(`Migrations directory not found at: ${migrationsDir}`);
      }

      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      console.log(`Found ${migrationFiles.length} migration files.`);
      for (const file of migrationFiles) {
        await runSqlFile(client, path.join(migrationsDir, file), `Migration ${file}`);
      }

      const seedsDir = path.resolve(__dirname, '../../../database/seeds');
      if (fs.existsSync(seedsDir)) {
        const seedFiles = fs
          .readdirSync(seedsDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        console.log(`\nFound ${seedFiles.length} seed files.`);
        for (const file of seedFiles) {
          await runSqlFile(client, path.join(seedsDir, file), `Seed ${file}`);
        }
      }
    }

    console.log('\n🎉 All database migrations and seeds applied successfully!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

migrate();
