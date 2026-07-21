import { Router, Request, Response } from 'express';
import { getSession, createSession, getPlayers, getWaitlist } from '../controllers/sessionController';
import { validate } from '../middleware/sessionMiddleware';
import { SessionSchema } from '../schemas/session';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.post('/create', validate(SessionSchema), createSession);
router.get('/:sessionId', getSession);
router.get('/players/:sessionId', getPlayers);
router.get('/waitlist/:sessionId', getWaitlist);


export default router;
