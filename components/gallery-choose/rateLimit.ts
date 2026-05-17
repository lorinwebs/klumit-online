export class RateLimitError extends Error {
  retryAfterSec: number;

  constructor(message: string, retryAfterSec = 30) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitError(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || /rate limit/i.test(msg);
}

export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  opts: {
    onWait?: (seconds: number, attempt: number) => void;
    shouldAbort?: () => boolean;
    maxAttempts?: number;
  } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (opts.shouldAbort?.()) throw new Error('aborted');
    try {
      return await fn();
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= maxAttempts) throw err;
      const wait =
        err instanceof RateLimitError ? err.retryAfterSec : 30 + attempt * 5;
      opts.onWait?.(wait, attempt);
      await sleep(wait * 1000);
    }
  }
  throw new Error('rate limit retries exhausted');
}
