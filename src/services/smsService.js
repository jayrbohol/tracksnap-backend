export const smsService = {
  async send(to, body) {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.DISABLE_EXTERNAL === 'true') {
      console.log('[smsService noop]', to, body);
      return { sid: 'noop' };
    }
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return client.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
  }
};
