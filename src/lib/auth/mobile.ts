import { NextResponse } from 'next/server';

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'development' ? 'trainovations-crm-dev-secret' : null);

export interface MobileTokenUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

/**
 * Verifies the Bearer JWT issued by /api/mobile/auth.
 * Returns the decoded user payload or null if invalid/expired.
 */
export async function verifyMobileJwt(
  authorization: string | null | undefined,
): Promise<MobileTokenUser | null> {
  if (!JWT_SECRET || !authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Signature was encoded as base64url — convert back to base64 for atob
    const sigStd = sigB64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(sigB64.length + ((4 - (sigB64.length % 4)) % 4), '=');

    const sigBytes = Uint8Array.from(atob(sigStd), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );

    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64)) as MobileTokenUser & { exp: number };
    if (payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Use in route handlers — returns user or a 401 Response. */
export async function requireMobileAuth(
  request: Request,
): Promise<MobileTokenUser | NextResponse> {
  const user = await verifyMobileJwt(request.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/** Paginated response helper */
export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return { items, total, page, pageSize, hasMore: page * pageSize < total };
}
