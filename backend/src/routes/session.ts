import { Router, Request, Response } from 'express';
import { createSession } from '../controllers/sessionController';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.post('/create', createSession);

export default router;
