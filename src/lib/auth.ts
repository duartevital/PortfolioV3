import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ActionError } from 'astro:actions';
import { ADMIN_PASSWORD_HASH, SESSION_SECRET } from 'astro:env/server';

export const SESSION_COOKIE_NAME = 'vital_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Vite's dotenv-expand runs on .env and treats an unescaped `$name` as a variable
// reference, silently deleting it if undefined - this corrupts an unescaped bcrypt
// hash. Fail loudly at startup rather than rejecting every login as "incorrect
// password" with no clue why. See .env.example for the required escaping (\$).
if (!/^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(ADMIN_PASSWORD_HASH)) {
  throw new Error(
    'ADMIN_PASSWORD_HASH is not a valid bcrypt hash. If you just set it in .env, ' +
      'make sure every "$" is escaped as "\\$" - see .env.example.'
  );
}

export function verifyPassword(password: string): boolean {
  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
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
