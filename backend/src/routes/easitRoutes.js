import express from 'express';
import { exportToEasit } from '../controllers/easitController.js';

const router = express.Router();

router.post('/export', exportToEasit);

export default router;