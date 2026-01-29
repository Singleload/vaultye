import express from 'express';
import { createUpgrade, updateUpgrade, deleteUpgrade } from '../controllers/upgradeController.js';
const router = express.Router();
router.post('/', createUpgrade);
router.patch('/:id', updateUpgrade);
router.delete('/:id', deleteUpgrade);
export default router;