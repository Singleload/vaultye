// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import systemRoutes from './routes/systemRoutes.js';
import pointRoutes from './routes/pointRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import decisionRoutes from './routes/decisionRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import easitRoutes from './routes/easitRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { createFirstAdmin } from './controllers/authController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/systems', systemRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/easit', easitRoutes);

createFirstAdmin();

app.get('/', (req, res) => {
  res.send('Waulty Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});