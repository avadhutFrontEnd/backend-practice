import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app:Express = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('User CRUD API');
});

app.use('/api',userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});