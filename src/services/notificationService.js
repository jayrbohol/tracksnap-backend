import { smsService } from './smsService.js';
import { emailService } from './emailService.js';

export const notificationService = {
  async notifyRecipientHandoff(parcel) {
    const { recipient, id } = parcel;
    const message = `Parcel delivered at ${new Date().toLocaleString()} - View: https://example.com/parcel/${id}`;
    if (recipient?.phone) await smsService.send(recipient.phone, message);
    if (recipient?.email) await emailService.send(recipient.email, 'Parcel Delivered', message);
  },
  async notifyIssueFlag(parcel) {
    const { recipient, id, feedback } = parcel;
    const subject = `Issue flagged for parcel ${id}`;
    const body = `Recipient: ${recipient?.name || 'N/A'}\nIssue: ${feedback?.issue}`;
    // In real impl, send to ops team distribution list
    if (process.env.OPS_ALERT_EMAIL) {
      await emailService.send(process.env.OPS_ALERT_EMAIL, subject, body);
    }
  }
};
