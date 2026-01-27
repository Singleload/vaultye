import express from 'express';
import { getSystems, createSystem, getSystemById, updateSystem } from '../controllers/systemController.js'; // <--- Importera getSystemById

const router = express.Router();

router.get('/', getSystems);
router.post('/', createSystem);
router.get('/:id', getSystemById);
router.patch('/:id', updateSystem);

export default router;