import express from 'express';
import { createAction, updateAction, getSystemActions } from '../controllers/actionController.js';

const router = express.Router();

router.post('/', createAction);
router.patch('/:id', updateAction);
router.get('/system/:systemId', getSystemActions); // Hämta för mötesrummet

export default router;