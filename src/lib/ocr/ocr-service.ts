import type { RecognizeResult, Worker } from 'tesseract.js';

import { ObservabilityService } from '@/lib/observability/observability-service';

export class OcrService {
  static async extractText(image: string | Blob) {
    let worker: Worker | undefined;

    try {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng');
      const result = (await (worker as Worker).recognize(image)) as RecognizeResult;
      return result.data.text;
    } catch (error) {
      ObservabilityService.captureIntegrationError('ocr', error, {
        imageType: typeof image === 'string' ? 'string' : 'blob',
      });
      throw error;
    } finally {
      await worker?.terminate();
    }
  }
}
