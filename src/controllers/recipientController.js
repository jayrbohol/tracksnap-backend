import { parcelService } from '../services/parcelService.js';
import { notificationService } from '../services/notificationService.js';

export async function submitFeedback(req, res, next) {
  try {
    const { parcelId, rating, issue } = req.body;
    const updated = await parcelService.addFeedback({ parcelId, rating, issue });

    if (issue) {
      await notificationService.notifyIssueFlag(updated);
    }

    res.json({ status: 'feedback-recorded', parcel: updated });
  } catch (err) {
    next(err);
  }
}
