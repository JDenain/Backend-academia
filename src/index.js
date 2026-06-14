import express from 'express';
import { PORT } from './config.js';
import { pool } from './db.js';
import userRoutes from './routes/users.routes.js';
import documentsRoutes from './routes/documents.routes.js'
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/reports.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import departamentosRoutes from './routes/departamentos.routes.js';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:8100',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(authRoutes);
app.use(userRoutes);
app.use(documentsRoutes)
app.use(reportRoutes);
app.use(notificationRoutes);
app.use(departamentosRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  pool.query('SELECT 1').then(() => console.log('Base de datos conectada correctamente')).catch(err => console.error('Error conectando a la base de datos:', err));
});