import { Request, Response } from 'express';
import { checkDatabaseConnection, query } from '../config/database';
import { env } from '../config/env';
import { checkAiServiceHealth } from '../services/ai.service';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const dbHealthy = await checkDatabaseConnection();

  const status = dbHealthy ? 'healthy' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: dbHealthy,
    data: {
      status,
      service: 'procureai-backend',
      version: '1.0.0-phase1',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      checks: {
        database: dbHealthy ? 'up' : 'down',
      },
    },
  });
}

export function apiInfo(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      name: 'ProcureAI API',
      tagline: 'Intelligent. Fair. Transparent.',
      version: '1.0.0-phase1',
      principle: 'AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.',
      endpoints: {
        health: '/api/v1/health',
        status: '/api/v1/status',
        aiHealth: '/api/v1/ai/health',
      },
    },
  });
}

export async function systemStatus(_req: Request, res: Response): Promise<void> {
  const dbHealthy = await checkDatabaseConnection();
  const aiHealth = await checkAiServiceHealth();

  let dbLogCount = 0;
  if (dbHealthy) {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM service_health_log'
    );
    dbLogCount = parseInt(result.rows[0]?.count ?? '0', 10);
  }

  const allHealthy = dbHealthy && aiHealth.reachable;

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        backend: { status: 'up', version: '1.0.0-phase1' },
        database: {
          status: dbHealthy ? 'up' : 'down',
          healthLogEntries: dbLogCount,
        },
        aiService: {
          status: aiHealth.reachable ? 'up' : 'down',
          url: env.AI_SERVICE_URL,
          details: aiHealth.data ?? null,
          error: aiHealth.error ?? null,
        },
      },
    },
  });
}

export async function aiHealthProxy(_req: Request, res: Response): Promise<void> {
  const aiHealth = await checkAiServiceHealth();

  res.status(aiHealth.reachable ? 200 : 503).json({
    success: aiHealth.reachable,
    data: aiHealth.data ?? { status: 'unreachable', error: aiHealth.error },
  });
}
