import express from 'express';
import { createUpgrade, deleteUpgrade } from '../controllers/upgradeController.js';
const router = express.Router();
router.post('/', createUpgrade);
router.delete('/:id', deleteUpgrade);
export default router;