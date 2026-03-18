import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { parseReceipt } from '@/lib/services/mindee-service';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('receipt') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'receipt file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP, or HEIC.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum 10 MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Save receipt image to disk
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${auth.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  const receiptUrl = `/uploads/receipts/${filename}`;

  // Run OCR
  try {
    const ocr = await parseReceipt(buffer, file.type);
    return NextResponse.json({ receiptUrl, ocr });
  } catch (err) {
    // OCR failed (e.g. no API key in dev) — still return the upload URL with empty OCR
    console.error('[mindee] OCR failed:', err);
    return NextResponse.json({
      receiptUrl,
      ocr: { vendor: null, date: null, amount: null, currency: 'USD', category: null, rawJson: null },
    });
  }
}
