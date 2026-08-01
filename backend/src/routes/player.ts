import { Router, Request, Response } from 'express';
import { getPlayers, getWaitlist, createPlayer, deletePlayer } from '../controllers/playerController';
import { validate } from '../middleware/sessionMiddleware';
import { PlayerSchema } from '../schemas/player';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/waitlist/:sessionId', getWaitlist);
router.get('/:sessionId', getPlayers);
router.post('/create', validate(PlayerSchema), createPlayer);
router.delete('/delete/:sessionId/:playerId', deletePlayer);

export default router;
