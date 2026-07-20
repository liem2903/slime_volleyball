import { Router, Request, Response } from 'express';
import { getSession, createSession } from '../controllers/sessionController';
import { validate } from '../middleware/sessionMiddleware';
import { SessionSchema } from '../schemas/session';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.post('/create', validate(SessionSchema), createSession);
router.get('/:sessionId', getSession);

export default router;
