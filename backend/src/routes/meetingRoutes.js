import express from 'express';
import { createMeeting, getMeetingById, updateMeeting, deleteMeeting } from '../controllers/meetingController.js';

const router = express.Router();

router.post('/', createMeeting);
router.get('/:id', getMeetingById);
router.patch('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

export default router;