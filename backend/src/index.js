// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import systemRoutes from './routes/systemRoutes.js';
import pointRoutes from './routes/pointRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/systems', systemRoutes);
app.use('/api/points', pointRoutes);

app.get('/', (req, res) => {
  res.send('Waulty Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});