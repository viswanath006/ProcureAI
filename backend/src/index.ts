import app from './app';
import { env } from './config/env';
import { pool } from './config/database';

const server = app.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    PROCUREAI BACKEND                     ║
║         Intelligent. Fair. Transparent.                  ║
║                                                          ║
║  AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.            ║
╚══════════════════════════════════════════════════════════╝

  Environment : ${env.NODE_ENV}
  Port        : ${env.PORT}
  API Base    : http://localhost:${env.PORT}/api/v1
  Health      : http://localhost:${env.PORT}/api/v1/health
  `);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
