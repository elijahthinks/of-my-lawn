import { describe, expect, it } from "vitest";
import { starsFor } from "../src/game/scoring";
import { LEVELS } from "../src/game/levels";
import {
  EMPTY_PROGRESS,
  isUnlocked,
  loadProgress,
  nextLevelId,
  recordResult,
  saveProgress,
  totalStars,
} from "../src/state/progress";

const win = (stars: 1 | 2 | 3, score = 10000) => ({ won: true, stars, score, dogsUsed: 1 });
const loss = { won: false, stars: 0 as const, score: 500, dogsUsed: 3 };

describe("unlocking", () => {
  it("opens only level 1 for a new player", () => {
    expect(isUnlocked(EMPTY_PROGRESS, 1)).toBe(true);
    expect(isUnlocked(EMPTY_PROGRESS, 2)).toBe(false);
    expect(nextLevelId(EMPTY_PROGRESS)).toBe(1);
  });

  it("opens the next level after a win, not after a loss", () => {
    const lost = recordResult(EMPTY_PROGRESS, 1, loss);
    expect(isUnlocked(lost, 2)).toBe(false);
    const won = recordResult(lost, 1, win(1));
    expect(isUnlocked(won, 2)).toBe(true);
    expect(isUnlocked(won, 3)).toBe(false);
    expect(nextLevelId(won)).toBe(2);
  });
});

describe("recording results", () => {
  it("keeps the best bones and score", () => {
    let p = recordResult(EMPTY_PROGRESS, 1, win(3, 20000));
    p = recordResult(p, 1, win(1, 30000));
    expect(p.stars[1]).toBe(3);
    expect(p.best[1]).toBe(30000);
    expect(totalStars(p)).toBe(3);
  });

  it("round-trips through storage and survives junk", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const p = { ...recordResult(EMPTY_PROGRESS, 1, win(2)), storySeen: true };
    saveProgress(p, storage);
    expect(loadProgress(storage)).toEqual(p);

    store.set([...store.keys()][0], "{not json");
    expect(loadProgress(storage)).toEqual(EMPTY_PROGRESS);
  });
});

describe("bones", () => {
  const level = { ...LEVELS[0], par: 2 };
  it("gives three at or under par, then two, then one", () => {
    expect(starsFor(level, 1, true)).toBe(3);
    expect(starsFor(level, 2, true)).toBe(3);
    expect(starsFor(level, 3, true)).toBe(2);
    expect(starsFor(level, 4, true)).toBe(1);
    expect(starsFor(level, 1, false)).toBe(0);
  });
});
