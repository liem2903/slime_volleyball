import { Router, Request, Response } from 'express';
import { changeSessionState, kickPlayer, swapStates } from '../controllers/adminController';

const router = Router({mergeParams: true});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.patch('/changeSessionState', changeSessionState);
router.delete('/:playerId/deletePlayer', kickPlayer);
router.patch('/:waitlistId/:interestedId/swapStates', swapStates);

export default router;
