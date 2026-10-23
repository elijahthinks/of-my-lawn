import { LEVELS } from "../game/levels";
import type { Stars } from "../game/scoring";
import type { SessionResult } from "../game/session";

export interface Progress {
  /** Best bones (stars) earned per level id. */
  stars: Record<number, Stars>;
  best: Record<number, number>;
  storySeen: boolean;
  muted: boolean;
}

const KEY = "off-my-lawn.progress.v1";

export const EMPTY_PROGRESS: Progress = { stars: {}, best: {}, storySeen: false, muted: false };

/** Storage is optional: private browsing or a full disk must never break the game. */
export function loadProgress(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Progress {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      stars: parsed.stars ?? {},
      best: parsed.best ?? {},
      storySeen: parsed.storySeen ?? false,
      muted: parsed.muted ?? false,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(p: Progress, storage: Pick<Storage, "setItem"> | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(p));
  } catch {
    // Nothing to do; progress just won't persist this session.
  }
}

/** Keeps the best result per level. Losing never takes anything away. */
export function recordResult(p: Progress, levelId: number, r: SessionResult): Progress {
  if (!r.won) return p;
  const prevStars = p.stars[levelId] ?? 0;
  const prevBest = p.best[levelId] ?? 0;
  return {
    ...p,
    stars: { ...p.stars, [levelId]: Math.max(prevStars, r.stars) as Stars },
    best: { ...p.best, [levelId]: Math.max(prevBest, r.score) },
  };
}

/** Level 1 is always open; every other level opens once the one before it is cleared. */
export function isUnlocked(p: Progress, levelId: number): boolean {
  if (levelId <= 1) return true;
  return (p.stars[levelId - 1] ?? 0) > 0;
}

export function totalStars(p: Progress): number {
  return LEVELS.reduce((sum, l) => sum + (p.stars[l.id] ?? 0), 0);
}

/** The first level not yet cleared, or the last level if everything is done. */
export function nextLevelId(p: Progress): number {
  const open = LEVELS.find((l) => !(p.stars[l.id] ?? 0));
  return open ? open.id : LEVELS[LEVELS.length - 1].id;
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
