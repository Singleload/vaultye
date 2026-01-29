import express from 'express';
import { getSystems, createSystem, getSystemById, updateSystem, deleteSystem, toggleArchiveSystem } from '../controllers/systemController.js'; // <--- Importera getSystemById

const router = express.Router();

router.get('/', getSystems);
router.post('/', createSystem);
router.get('/:id', getSystemById);
router.patch('/:id', updateSystem);
router.patch('/:id/archive', toggleArchiveSystem);
router.delete('/:id', deleteSystem);

export default router;