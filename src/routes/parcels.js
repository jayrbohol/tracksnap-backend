import { Router } from 'express';
import { createParcel, getParcelById } from '../controllers/parcelController.js';

const router = Router();

router.post('/', createParcel); // POST /parcel
router.get('/:id', getParcelById); // GET /parcel/:id

export default router;
