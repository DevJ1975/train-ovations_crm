import { describe, expect, it, vi } from 'vitest';

const recognize = vi.fn().mockResolvedValue({
  data: {
    text: 'Jordan Lee\nApex Industrial\njordan@example.com',
  },
});
const terminate = vi.fn().mockResolvedValue(undefined);
const createWorker = vi.fn().mockResolvedValue({
  recognize,
  terminate,
});

vi.mock('tesseract.js', () => ({
  createWorker,
}));

import { OcrService } from './ocr-service';

describe('OcrService', () => {
  it('extracts OCR text through the Tesseract worker abstraction', async () => {
    const text = await OcrService.extractText('image-data');

    expect(createWorker).toHaveBeenCalledWith('eng');
    expect(text).toContain('Jordan Lee');
  });
});
