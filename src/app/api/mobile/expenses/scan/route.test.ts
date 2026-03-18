import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, parseReceipt, fsMkdir, fsWriteFile } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  parseReceipt: vi.fn(),
  fsMkdir: vi.fn().mockResolvedValue(undefined),
  fsWriteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/services/mindee-service', () => ({ parseReceipt }));
vi.mock('node:fs/promises', () => ({
  default: { mkdir: fsMkdir, writeFile: fsWriteFile },
  mkdir: fsMkdir,
  writeFile: fsWriteFile,
}));

import { POST } from './route';

// JSDOM's File doesn't implement arrayBuffer(); use a plain object that satisfies the route's duck-typing.
function makeFileLike(type: string, sizeBytes = 100) {
  const buf = new Uint8Array(sizeBytes).fill(0xaa);
  return {
    type,
    size: sizeBytes,
    arrayBuffer: vi.fn().mockResolvedValue(buf.buffer as ArrayBuffer),
  };
}

// Builds a Request whose formData() mock returns a FormData-like object.
function makeRequest(fileLike: ReturnType<typeof makeFileLike> | null, noReceipt = false): Request {
  const req = new Request('http://localhost/api/mobile/expenses/scan', { method: 'POST' });
  if (fileLike === null) {
    vi.spyOn(req, 'formData').mockRejectedValue(new Error('not multipart'));
  } else {
    const fd = { get: (key: string) => (key === 'receipt' && !noReceipt ? fileLike : null) } as unknown as FormData;
    vi.spyOn(req, 'formData').mockResolvedValue(fd);
  }
  return req;
}

describe('/api/mobile/expenses/scan', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    parseReceipt.mockResolvedValue({
      vendor: 'Starbucks',
      date: '2026-03-10T00:00:00.000Z',
      amount: 12.5,
      currency: 'USD',
      category: 'meals',
      rawJson: { parsed: true },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await POST(new Request('http://localhost/api/mobile/expenses/scan', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when formData parsing fails', async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no receipt field in formData', async () => {
    const res = await POST(makeRequest(makeFileLike('image/jpeg'), true));
    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported file type', async () => {
    const res = await POST(makeRequest(makeFileLike('application/pdf')));
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toMatch(/unsupported file type/i);
  });

  it('returns receiptUrl and ocr on success', async () => {
    const res = await POST(makeRequest(makeFileLike('image/jpeg')));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.receiptUrl).toMatch(/^\/uploads\/receipts\/user_1-\d+\.jpg$/);
    expect(payload.ocr.vendor).toBe('Starbucks');
    expect(payload.ocr.amount).toBe(12.5);
    expect(fsMkdir).toHaveBeenCalled();
    expect(fsWriteFile).toHaveBeenCalled();
  });

  it('still returns receiptUrl with empty ocr when OCR throws', async () => {
    parseReceipt.mockRejectedValue(new Error('MINDEE_API_KEY not set'));
    const res = await POST(makeRequest(makeFileLike('image/jpeg')));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.receiptUrl).toBeDefined();
    expect(payload.ocr.vendor).toBeNull();
    expect(payload.ocr.amount).toBeNull();
  });
});
