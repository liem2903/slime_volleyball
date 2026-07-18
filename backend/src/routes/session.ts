import { Router, Request, Response } from 'express';
import { getSession, createSession } from '../controllers/sessionController';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.post('/create', createSession);
router.get('/:sessionId', getSession);

export default router;
