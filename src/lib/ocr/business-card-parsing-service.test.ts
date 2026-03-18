import { describe, expect, it, vi } from 'vitest';

const { extractText } = vi.hoisted(() => ({
  extractText: vi.fn(),
}));

vi.mock('./ocr-service', () => ({
  OcrService: {
    extractText,
  },
}));

import { BusinessCardParsingService } from './business-card-parsing-service';

describe('BusinessCardParsingService', () => {
  it('maps OCR text into likely business card fields with confidence labels', async () => {
    extractText.mockResolvedValueOnce(`Jordan Lee
Operations Director
Apex Industrial
jordan@example.com
(555) 202-1111`);

    const result = await BusinessCardParsingService.parseCard('image-data');

    expect(result.rawText).toContain('Jordan Lee');
    expect(result.extractedFields.name).toEqual({
      value: 'Jordan Lee',
      confidence: 'medium',
    });
    expect(result.extractedFields.company).toEqual({
      value: 'Operations Director',
      confidence: 'low',
    });
    expect(result.extractedFields.email).toEqual({
      value: 'jordan@example.com',
      confidence: 'high',
    });
    expect(result.extractedFields.phone).toEqual({
      value: '(555) 202-1111',
      confidence: 'medium',
    });
  });
});
