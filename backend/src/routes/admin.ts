import { Router, Request, Response } from 'express';
import { lockSession, kickPlayer, swapStates, confirmPlayer } from '../controllers/adminController';

import { validate } from '../middleware/sessionMiddleware'
import { ChangeStateSchema } from '../schemas/changeSessionState';

const router = Router({mergeParams: true});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.patch('/lockSession', validate(ChangeStateSchema), lockSession);
router.delete('/:playerId/deletePlayer', kickPlayer);
router.patch('/:waitlistId/:interestedId/swapStates', swapStates);
router.patch('/:playerId/confirm', confirmPlayer);

export default router;
