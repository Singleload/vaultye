import express from 'express';
import { createMeeting, getMeetingById, updateMeeting } from '../controllers/meetingController.js';

const router = express.Router();

router.post('/', createMeeting);
router.get('/:id', getMeetingById);
router.patch('/:id', updateMeeting);

export default router;