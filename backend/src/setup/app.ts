import express from 'express';
import sessionRouter from '../routes/session';
import playerRouter from '../routes/player';

import { error_handler } from '../middleware/sessionMiddleware';

export const app = express();

app.use(express.json());
app.use('/api/session', sessionRouter);
app.use('/api/players', playerRouter)
app.use(error_handler);