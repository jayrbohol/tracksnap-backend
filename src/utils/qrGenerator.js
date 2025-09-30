import QRCode from 'qrcode';

export const qrGenerator = {
  async generateDataUrl(text) {
    return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, scale: 4 });
  }
};
