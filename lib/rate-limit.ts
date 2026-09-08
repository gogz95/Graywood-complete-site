/**
 * lib/rate-limit.ts — In-Memory Sliding-Window Rate Limiter
 *
 * Provides protection against credential-stuffing and PIN brute-forcing.
 * Maintains bounded memory usage with automatic LRU and expiration cleanup.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ENTRIES = 5000;

function cleanupStore(now: number, windowMs: number) {
  if (rateLimitStore.size > MAX_ENTRIES) {
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
    // If still over capacity, evict oldest entries
    if (rateLimitStore.size > MAX_ENTRIES) {
      const keysToEvict = Array.from(rateLimitStore.keys()).slice(
        0,
        rateLimitStore.size - MAX_ENTRIES
      );
      for (const k of keysToEvict) {
        rateLimitStore.delete(k);
      }
    }
  }
}

/**
 * Checks whether the key has exceeded maxAttempts within windowMs.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  cleanupStore(now, windowMs);

  const record = rateLimitStore.get(key);
  if (!record) {
    return { allowed: true, remaining: maxAttempts };
  }

  // Filter out timestamps outside the active window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldest = record.timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
  };
}

/**
 * Records a failed attempt for the key.
 */
export function recordFailedAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
  record.timestamps.push(now);
  rateLimitStore.set(key, record);
}

/**
 * Clears rate limit records upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
