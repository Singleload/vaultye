import express from 'express';
import { createPoint, updatePoint } from '../controllers/pointController.js';

const router = express.Router();

router.post('/', createPoint);
router.patch('/:id', updatePoint); // Ändrat från '/:id/status' till '/:id' för att vara mer generell

export default router;