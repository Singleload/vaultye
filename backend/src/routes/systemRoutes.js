import express from 'express';
import { getSystems, createSystem, getSystemById } from '../controllers/systemController.js'; // <--- Importera getSystemById

const router = express.Router();

router.get('/', getSystems);
router.post('/', createSystem);
router.get('/:id', getSystemById); // <--- NY ROUTE

export default router;