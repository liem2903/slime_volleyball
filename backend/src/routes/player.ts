import { Router, Request, Response } from 'express';
import { getPlayers, getWaitlist, createPlayer, deletePlayer, getIdFromToken, setPositions } from '../controllers/playerController';
import { validate } from '../middleware/sessionMiddleware';
import { PlayerSchema } from '../schemas/player';
import { SetPositionsSchema } from '../schemas/position';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/waitlist/:sessionId', getWaitlist);
router.get('/token/:userToken', getIdFromToken);
router.get('/:sessionId', getPlayers);
router.post('/create', validate(PlayerSchema), createPlayer);
router.delete('/delete/:sessionId/:userToken', deletePlayer);
router.patch('/positions/:sessionId/:userToken', validate(SetPositionsSchema), setPositions);

export default router;
