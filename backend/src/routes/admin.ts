import { Router, Request, Response } from 'express';
import { lockSession, kickPlayer, swapStates, confirmPlayer, unlockSession, changeCapacity, moveToTeams } from '../controllers/adminController';

import { validate } from '../middleware/sessionMiddleware'
import { ChangeStateSchema } from '../schemas/changeSessionState';
import { ChangeCapacitySchema } from '../schemas/changeCapacity';
import { MoveToTeamsSchema } from '../schemas/moveToTeams';

const router = Router({mergeParams: true});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.patch('/lockSession', validate(ChangeStateSchema), lockSession);
router.delete('/:playerId/deletePlayer', kickPlayer);
router.patch('/:waitlistId/:interestedId/swapStates', swapStates);
router.patch('/:playerId/confirm', confirmPlayer);
router.patch('/unlockSession', unlockSession);
router.patch('/changeCapacity', validate(ChangeCapacitySchema), changeCapacity);
router.patch('/moveToTeams', validate(MoveToTeamsSchema), moveToTeams);

export default router;
