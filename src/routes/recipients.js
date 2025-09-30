import { Router } from 'express';
import { submitFeedback } from '../controllers/recipientController.js';

const router = Router();

router.post('/feedback', submitFeedback); // POST /feedback

export default router;
