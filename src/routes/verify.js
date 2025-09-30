import { Router } from 'express';
import { verifyScan } from '../controllers/verifyController.js';

const router = Router();

router.post('/verify-scan', verifyScan); // POST /verify-scan

export default router;
