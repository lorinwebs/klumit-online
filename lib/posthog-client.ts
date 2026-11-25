/**
 * PostHog in the browser. Its script is loaded by Google Tag Manager (see app/layout.tsx),
 * which puts it on `window.posthog` once the page has finished loading. Anything reported
 * before then waits here (keeping its original time) and is sent in order.
 */
type PostHog = {
  capture: (event: string, properties?: Record<string, unknown>, options?: { timestamp?: Date }) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};

const CHECK_EVERY_MS = 250;
/** Give up if PostHog never arrives (blocked by an ad blocker, or removed from Tag Manager). */
const GIVE_UP_AFTER_MS = 30_000;

let queue: Array<(posthog: PostHog) => void> = [];
let waiting = false;

function getPostHog(): PostHog | undefined {
  return (window as Window & { posthog?: PostHog }).posthog;
}

function waitForPostHog(waitedMs = 0): void {
  const posthog = getPostHog();
  if (posthog) {
    queue.forEach((send) => send(posthog));
  } else if (waitedMs < GIVE_UP_AFTER_MS) {
    setTimeout(() => waitForPostHog(waitedMs + CHECK_EVERY_MS), CHECK_EVERY_MS);
    return;
  }
  queue = [];
  waiting = false;
}

function whenReady(send: (posthog: PostHog) => void): void {
  if (typeof window === 'undefined') return;
  const posthog = getPostHog();
  if (posthog && !waiting) {
    send(posthog);
    return;
  }
  queue.push(send);
  if (!waiting) {
    waiting = true;
    waitForPostHog();
  }
}

export function capturePostHog(eventName: string, properties?: Record<string, unknown>): void {
  const timestamp = new Date();
  whenReady((posthog) => posthog.capture(eventName, properties, { timestamp }));
}

export function identifyPostHog(userId: string, properties?: Record<string, unknown>): void {
  whenReady((posthog) => posthog.identify(userId, properties));
}

export function resetPostHog(): void {
  whenReady((posthog) => posthog.reset());
}
