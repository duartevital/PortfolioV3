const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface FailureRecord {
  count: number;
  windowStart: number;
}

const failures = new Map<string, FailureRecord>();

function activeRecord(clientKey: string, now: number): FailureRecord | undefined {
  const record = failures.get(clientKey);
  if (record && now - record.windowStart >= WINDOW_MS) {
    failures.delete(clientKey);
    return undefined;
  }
  return record;
}

function pruneExpired(now: number) {
  for (const [key, record] of failures) {
    if (now - record.windowStart >= WINDOW_MS) failures.delete(key);
  }
}

export function lockoutMinutesRemaining(clientKey: string, now = Date.now()): number {
  const record = activeRecord(clientKey, now);
  if (!record || record.count < MAX_FAILURES) return 0;
  return Math.ceil((record.windowStart + WINDOW_MS - now) / 60_000);
}

export function recordFailedLogin(clientKey: string, now = Date.now()) {
  pruneExpired(now);
  const record = activeRecord(clientKey, now);
  if (record) {
    record.count += 1;
  } else {
    failures.set(clientKey, { count: 1, windowStart: now });
  }
}

export function clearFailedLogins(clientKey: string) {
  failures.delete(clientKey);
}

export function loginClientKey(request: Request, clientAddress: string): string {
  return request.headers.get('cf-connecting-ip') ?? clientAddress;
}
