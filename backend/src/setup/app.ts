import express from 'express';
import sessionRouter from '../routes/session';
import playerRouter from '../routes/player';
import teamsRouter from '../routes/teams';
import adminRouter from '../routes/admin';

import { error_handler, check_is_admin } from '../middleware/sessionMiddleware';

export const app = express();

app.use(express.json());
app.use('/api/session', sessionRouter);
app.use('/api/players', playerRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/admin/:sessionId/:adminId', check_is_admin, adminRouter);
app.use(error_handler);