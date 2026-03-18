import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
const db = getPrismaClient();
import { verifyPassword } from '@/lib/auth/password';
import { buildTokenUser } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'development'
    ? 'trainovations-crm-dev-secret'
    : null);

/** Minimal HS256 JWT — no external dep needed */
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }));
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${data}.${sigB64}`;
}

export async function POST(request: Request) {
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const tokenUser = buildTokenUser(user);
  const token = await signJwt(tokenUser as unknown as Record<string, unknown>, JWT_SECRET);

  return NextResponse.json({ token, user: tokenUser });
}
