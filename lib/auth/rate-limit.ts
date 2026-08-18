const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_FAILURES = 20;
const MAX_ACCOUNT_FAILURES = 5;

interface Bucket {
  attempts: number[];
}

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket): void {
  const cutoff = Date.now() - WINDOW_MS;
  bucket.attempts = bucket.attempts.filter((t) => t >= cutoff);
}

function recordAndCheck(
  key: string,
  maxFailures: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { attempts: [] };
  prune(bucket);
  if (bucket.attempts.length >= maxFailures) {
    buckets.set(key, bucket);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - bucket.attempts[0])) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }
  bucket.attempts.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function consumeLoginAttempt(
  ip: string,
  npp: string,
): { allowed: boolean; retryAfterSeconds: number } {
  const ipCheck = recordAndCheck(`ip:${ip}`, MAX_IP_FAILURES);
  if (!ipCheck.allowed) return ipCheck;
  return recordAndCheck(`npp:${npp}`, MAX_ACCOUNT_FAILURES);
}

export function clearLoginAttempts(ip: string, npp: string): void {
  buckets.delete(`ip:${ip}`);
  buckets.delete(`npp:${npp}`);
}