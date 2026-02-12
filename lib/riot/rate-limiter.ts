/**
 * In-memory token bucket rate limiter for Riot API.
 * Handles both short-window (1s) and long-window (2min) rate limits.
 * Respects 429 Retry-After headers.
 */

interface RateBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per ms
  lastRefill: number;
}

interface RegionLimiter {
  short: RateBucket;  // e.g. 20 req/1s
  long: RateBucket;   // e.g. 100 req/2min
  retryAfter: number; // timestamp when retry is allowed (0 = no block)
  queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
  }>;
  processing: boolean;
}

const limiters = new Map<string, RegionLimiter>();

// Default personal key limits — adjust for production keys
const SHORT_LIMIT = 20;
const SHORT_WINDOW_MS = 1000;
const LONG_LIMIT = 100;
const LONG_WINDOW_MS = 120_000;

function createBucket(maxTokens: number, windowMs: number): RateBucket {
  return {
    tokens: maxTokens,
    maxTokens,
    refillRate: maxTokens / windowMs,
    lastRefill: Date.now(),
  };
}

function refillBucket(bucket: RateBucket): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate);
  bucket.lastRefill = now;
}

function getLimiter(region: string): RegionLimiter {
  let limiter = limiters.get(region);
  if (!limiter) {
    limiter = {
      short: createBucket(SHORT_LIMIT, SHORT_WINDOW_MS),
      long: createBucket(LONG_LIMIT, LONG_WINDOW_MS),
      retryAfter: 0,
      queue: [],
      processing: false,
    };
    limiters.set(region, limiter);
  }
  return limiter;
}

async function processQueue(region: string): Promise<void> {
  const limiter = getLimiter(region);
  if (limiter.processing) return;
  limiter.processing = true;

  while (limiter.queue.length > 0) {
    // Check retry-after block
    const now = Date.now();
    if (limiter.retryAfter > now) {
      const waitMs = limiter.retryAfter - now;
      console.log(`[RateLimiter] ${region}: blocked by Retry-After, waiting ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    // Refill buckets
    refillBucket(limiter.short);
    refillBucket(limiter.long);

    // Check if we have tokens
    if (limiter.short.tokens >= 1 && limiter.long.tokens >= 1) {
      limiter.short.tokens -= 1;
      limiter.long.tokens -= 1;
      const next = limiter.queue.shift();
      if (next) next.resolve();
    } else {
      // Wait until next refill
      const shortWait = limiter.short.tokens < 1
        ? (1 - limiter.short.tokens) / limiter.short.refillRate
        : 0;
      const longWait = limiter.long.tokens < 1
        ? (1 - limiter.long.tokens) / limiter.long.refillRate
        : 0;
      const waitMs = Math.max(shortWait, longWait, 50);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  limiter.processing = false;
}

/**
 * Acquire a rate limit token for the given region.
 * Returns a promise that resolves when it's safe to make a request.
 */
export function acquireToken(region: string): Promise<void> {
  const limiter = getLimiter(region);

  // Fast path: tokens available and no retry block
  refillBucket(limiter.short);
  refillBucket(limiter.long);

  if (
    limiter.retryAfter <= Date.now() &&
    limiter.short.tokens >= 1 &&
    limiter.long.tokens >= 1
  ) {
    limiter.short.tokens -= 1;
    limiter.long.tokens -= 1;
    return Promise.resolve();
  }

  // Queue the request
  return new Promise<void>((resolve, reject) => {
    limiter.queue.push({ resolve, reject });
    processQueue(region);
  });
}

/**
 * Report a 429 response with Retry-After header.
 */
export function reportRetryAfter(region: string, retryAfterSeconds: number): void {
  const limiter = getLimiter(region);
  limiter.retryAfter = Date.now() + retryAfterSeconds * 1000;
  // Drain tokens to prevent further requests
  limiter.short.tokens = 0;
  limiter.long.tokens = 0;
  console.warn(
    `[RateLimiter] ${region}: 429 received, blocking for ${retryAfterSeconds}s`
  );
}
