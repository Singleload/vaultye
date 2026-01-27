import express from 'express';
import { createDecisionRequest, getDecisionData, submitDecision } from '../controllers/decisionController.js';

const router = express.Router();

router.post('/request', createDecisionRequest);
router.get('/:token', getDecisionData);
router.post('/:token', submitDecision);

export default router;