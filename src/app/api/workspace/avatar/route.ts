import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/profile');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('avatar') as File | null;

  if (!file?.size) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum 5 MB.' }, { status: 400 });
  }

  const ext = extname(file.name) || '.jpg';
  const filename = `${repProfile.id}${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const photoUrl = `/uploads/avatars/${filename}`;

  await db.repProfile.update({
    where: { id: repProfile.id },
    data: { photoUrl },
  });

  return NextResponse.json({ photoUrl });
}
