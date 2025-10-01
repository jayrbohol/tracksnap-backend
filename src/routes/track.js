import { Router } from 'express';
import { trackParcel, getTrackingHistory } from '../controllers/trackController.js';

const router = Router();

router.post('/track-parcel', trackParcel); // POST /track-parcel
router.get('/parcel/:id/tracking', getTrackingHistory); // GET /parcel/:id/tracking

export default router;
