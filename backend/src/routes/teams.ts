import { Router } from 'express';
import { getTeams } from '../controllers/teamsController';

const router = Router();

router.get('/:sessionId', getTeams);

export default router;
