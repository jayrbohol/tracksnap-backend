import { Router } from 'express';
import { createParcel, getParcelById, updateParcelHubs } from '../controllers/parcelController.js';

const router = Router();

router.post('/', createParcel); // POST /parcel
router.get('/:id', getParcelById); // GET /parcel/:id
router.patch('/:id/hubs', updateParcelHubs); // PATCH /parcel/:id/hubs

export default router;
