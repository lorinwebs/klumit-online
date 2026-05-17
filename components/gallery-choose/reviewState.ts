import type { ReviewEntry, ReviewState } from './types';

export function isEffectivelySelected(
  review: ReviewState,
  path: string,
): boolean {
  const r = review[path];
  if (!r) return false;
  if (r.human === 'yes') return true;
  if (r.human === 'no') return false;
  return r.auto;
}

export function isFinallySelected(review: ReviewState, path: string): boolean {
  return review[path]?.human === 'yes';
}

/** Already picked for album — only show in the dedicated "נבחר" / final views */
export function isHiddenFromReviewBrowsing(
  review: ReviewState,
  path: string,
): boolean {
  return isFinallySelected(review, path);
}

export function applyAutoSelect(
  review: ReviewState,
  allPaths: string[],
  autoPaths: Set<string>,
): ReviewState {
  const next: ReviewState = { ...review };
  for (const path of allPaths) {
    const prev = next[path];
    next[path] = {
      auto: autoPaths.has(path),
      human: prev?.human ?? null,
    };
  }
  return next;
}

export function setHuman(
  review: ReviewState,
  path: string,
  human: ReviewEntry['human'],
): ReviewState {
  const prev = review[path] ?? { auto: false, human: null };
  return { ...review, [path]: { ...prev, human } };
}

export function clearHumanChoices(review: ReviewState): ReviewState {
  const next: ReviewState = {};
  for (const [path, entry] of Object.entries(review)) {
    next[path] = { auto: entry.auto, human: null };
  }
  return next;
}
