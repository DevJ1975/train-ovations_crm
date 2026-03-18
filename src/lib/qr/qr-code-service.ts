import QRCode from 'qrcode';

export class QrCodeService {
  static async toDataUrl(value: string) {
    return QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });
  }

  static async toSvgString(value: string) {
    return QRCode.toString(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      type: 'svg',
      width: 320,
    });
  }
}
