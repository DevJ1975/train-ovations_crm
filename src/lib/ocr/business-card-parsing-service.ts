import { OcrService } from './ocr-service';

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function pickCandidateLine(lines: string[], ignored: Set<string>) {
  return lines.find((line) => {
    const normalized = normalizeWhitespace(line);

    return (
      normalized.length > 1 &&
      !ignored.has(normalized) &&
      !normalized.includes('@') &&
      !/\d{3}[-)\s.]*\d{3}[-.\s]*\d{4}/.test(normalized)
    );
  });
}

export class BusinessCardParsingService {
  static async parseCard(image: string | Blob) {
    const text = await OcrService.extractText(image);
    const lines = text
      .split(/\r?\n/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const phone = text.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}/)?.[0];
    const ignored = new Set<string>([email, phone].filter(Boolean) as string[]);
    const name = lines[0] && !ignored.has(lines[0]) ? lines[0] : pickCandidateLine(lines, ignored);
    if (name) {
      ignored.add(name);
    }
    const company = pickCandidateLine(lines.slice(1), ignored);

    return {
      rawText: text,
      extractedFields: {
        name: name
          ? {
              value: name,
              confidence: 'medium',
            }
          : undefined,
        company: company
          ? {
              value: company,
              confidence: 'low',
            }
          : undefined,
        email: email
          ? {
              value: email,
              confidence: 'high',
            }
          : undefined,
        phone: phone
          ? {
              value: phone,
              confidence: 'medium',
            }
          : undefined,
      },
    };
  }
}
