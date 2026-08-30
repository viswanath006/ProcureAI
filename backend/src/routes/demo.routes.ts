import { Router, Request, Response, NextFunction } from 'express';
import {
  resetAndSeedDemoScenario,
  runScenario1Approval,
  runScenario2Override,
  getDemoScenarioStatus,
} from '../services/demoScenario.service';

const router = Router();

// 1. Reset and initialize demo scenario
router.post('/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await resetAndSeedDemoScenario();
    res.json({
      success: true,
      message: 'Demonstration scenario reset successfully. School Infrastructure Project initialized.',
      data: state,
    });
  } catch (error) {
    next(error);
  }
});

// 2. Execute Scenario 1: Approve AI Recommendation (Company A)
router.post('/scenario-1', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await runScenario1Approval();
    res.json({
      success: true,
      message: 'Scenario 1 executed: Government approved AI recommendation for Company A. Decision locked & audit chained.',
      data: state,
    });
  } catch (error) {
    next(error);
  }
});

// 3. Execute Scenario 2: Human Override to Company C
router.post('/scenario-2', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await runScenario2Override();
    res.json({
      success: true,
      message: 'Scenario 2 executed: Government override to Company C recorded with statutory justification. Flagged as potential governance-risk event.',
      data: state,
    });
  } catch (error) {
    next(error);
  }
});

// 4. Get current demo status and 17-step telemetry
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await getDemoScenarioStatus();
    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
