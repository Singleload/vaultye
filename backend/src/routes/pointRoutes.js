import express from 'express';
import { createPoint, updatePoint, deletePoint } from '../controllers/pointController.js';

const router = express.Router();

router.post('/', createPoint);
router.patch('/:id', updatePoint);
router.delete('/:id', deletePoint);

export default router;