import express from 'express';
import { PORT } from './config.js';
import userRoutes from './routes/users.routes.js';
import documentsRoutes from './routes/documents.routes.js'
import authRoutes from './routes/auth.routes.js';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:8100',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(authRoutes);
app.use(userRoutes);
app.use(documentsRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});