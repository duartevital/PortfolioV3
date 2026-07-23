import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ActionError } from 'astro:actions';
import { ADMIN_PASSWORD_HASH, SESSION_SECRET } from 'astro:env/server';

export const SESSION_COOKIE_NAME = 'vital_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ADMIN_PASSWORD_HASH is stored base64-encoded in .env, not as a raw bcrypt hash.
// Reason: this same .env file is read by two mechanisms with opposite handling of
// "$" - Vite's dotenv-expand (used by `astro dev`/`astro build`) silently deletes
// an unescaped `$name` reference, so it needs "\$" escaping; Docker's env_file
// (used at container runtime) passes values through completely literally, so
// escaping there just leaves literal backslashes in the value. There's no one
// escaping convention for a raw hash that satisfies both. Base64 has no "$", so
// it round-trips correctly through either path.
//
// Decoded and validated lazily (not at module load): this module is imported by
// middleware, which runs for every route including static pages during
// prerendering - a build with no ADMIN_PASSWORD_HASH set (e.g. the Docker build
// stage, which deliberately excludes .env) must still be able to prerender
// /, /about, /contact. The check only needs to actually run once someone submits
// the login form.
let decodedHash: string | undefined;

function getPasswordHash(): string {
  if (decodedHash) return decodedHash;

  const decoded = Buffer.from(ADMIN_PASSWORD_HASH, 'base64').toString('utf-8');
  if (!/^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(decoded)) {
    throw new Error(
      'ADMIN_PASSWORD_HASH is not a valid base64-encoded bcrypt hash - see .env.example.'
    );
  }

  decodedHash = decoded;
  return decodedHash;
}

export function verifyPassword(password: string): boolean {
  return bcrypt.compareSync(password, getPasswordHash());
}

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function createSessionCookie() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 })
  ).toString('base64url');

  return {
    name: SESSION_COOKIE_NAME,
    value: `${payload}.${sign(payload)}`,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: import.meta.env.PROD,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export function isSessionValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  const [payload, signature] = cookieValue.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = sign(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Throws an ActionError if the request has no valid session cookie. Use at the top of every admin mutation action. */
export function requireAuth(context: { cookies: { get: (name: string) => { value: string } | undefined } }) {
  const session = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!isSessionValid(session)) {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'Not authenticated.' });
  }
}
