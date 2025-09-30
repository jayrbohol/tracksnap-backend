import sendgrid from '@sendgrid/mail';

export const emailService = {
  async send(to, subject, text) {
    if (!process.env.SENDGRID_API_KEY || process.env.DISABLE_EXTERNAL === 'true') {
      console.log('[emailService noop]', to, subject);
      return { id: 'noop' };
    }
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    return sendgrid.send({ to, from: process.env.SENDGRID_FROM_EMAIL, subject, text });
  }
};
