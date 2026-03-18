import { describe, expect, it } from 'vitest';

import { QrCodeService } from './qr-code-service';

describe('QrCodeService', () => {
  it('generates a QR code data URL', async () => {
    const result = await QrCodeService.toDataUrl('https://trainovations.com/rep/jay-jones');

    expect(result.startsWith('data:image/png;base64,')).toBe(true);
  });
});
