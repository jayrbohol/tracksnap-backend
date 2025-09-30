import { parcelService } from '../services/parcelService.js';
import { notificationService } from '../services/notificationService.js';

export async function verifyScan(req, res, next) {
  try {
    const { parcelId, courierId, gps, timestamp, photoURL } = req.body;
    const result = await parcelService.logHandoff({ parcelId, courierId, gps, timestamp, photoURL });

    if (result && result.recipient) {
      await notificationService.notifyRecipientHandoff(result);
    }

    res.json({ status: 'logged', parcel: result });
  } catch (err) {
    next(err);
  }
}
