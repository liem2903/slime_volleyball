import express from 'express';
import router from './routes';
import sessionRouter from './routes/session';
import { validate } from './middleware/sessionMiddleware';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', router);
app.use('/api/session', sessionRouter);
app.use(validate);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
