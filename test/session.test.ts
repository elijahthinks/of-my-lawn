import { describe, expect, it } from "vitest";
import { ANCHOR, MAX_PULL, MAX_PULL_DOWN } from "../src/game/constants";
import { LEVELS } from "../src/game/levels";
import { clampPull, GameSession, predictPath } from "../src/game/session";
import type { LevelDef } from "../src/game/types";

const settle = (s: GameSession, n = 60) => {
  for (let i = 0; i < n; i++) s.step();
};

const playOut = (s: GameSession) => {
  for (let i = 0; i < 2000 && s.phase === "flying"; i++) s.step();
};

describe("aiming", () => {
  it("limits the pull to the leash and keeps Biscuit above the deck", () => {
    const long = clampPull({ x: -1000, y: 0 });
    expect(Math.hypot(long.x, long.y)).toBeCloseTo(MAX_PULL);
    expect(clampPull({ x: 0, y: 500 }).y).toBe(MAX_PULL_DOWN);
  });

  it("ignores a tap that barely moves the leash", () => {
    const s = new GameSession(LEVELS[0]);
    s.aim({ x: -5, y: 3 });
    expect(s.release()).toBe(false);
    expect(s.phase).toBe("aiming");
    expect(s.dogsLeft).toBe(LEVELS[0].dogs);
  });

  it("predicts the arc Biscuit actually flies", () => {
    // An empty yard far from anything, so nothing interrupts the flight.
    const empty: LevelDef = { id: 99, name: "test", dogs: 1, par: 1, blocks: [], rabbits: [{ x: 1550, y: 680, size: "kit" }] };
    const s = new GameSession(empty);
    const pull = { x: -100, y: 60 };
    const path = predictPath(pull, 30, 1);
    s.aim(pull);
    s.release();
    for (let i = 0; i < 30; i++) s.step();
    const p = s.dog!.position;
    expect(Math.abs(p.x - path[29].x)).toBeLessThan(2);
    expect(Math.abs(p.y - path[29].y)).toBeLessThan(2);
    expect(path[0].x).toBeGreaterThan(ANCHOR.x + pull.x);
  });
});

describe("a round", () => {
  it.each(LEVELS)("level $id is calm when nobody touches it", (level) => {
    const s = new GameSession(level);
    settle(s, 240);
    expect(s.rabbitsLeft).toBe(level.rabbits.length);
    expect(s.blocks.length).toBe(level.blocks.length);
    expect(s.score).toBe(0);
  });

  it("allows one bark per pounce, only in flight", () => {
    const s = new GameSession(LEVELS[0]);
    expect(s.bark()).toBe(false);
    s.aim({ x: -120, y: 40 });
    s.release();
    s.step();
    expect(s.bark()).toBe(true);
    expect(s.bark()).toBe(false);
  });

  it("ends in a loss when every pounce misses", () => {
    let finished = 0;
    const s = new GameSession(LEVELS[0], { finished: () => finished++ });
    settle(s);
    for (let i = 0; i < LEVELS[0].dogs; i++) {
      // A feeble hop that lands on the lawn just past the deck.
      s.aim({ x: -30, y: -10 });
      expect(s.release()).toBe(true);
      playOut(s);
    }
    expect(s.phase).toBe("lost");
    expect(finished).toBe(1);
    expect(s.result()).toMatchObject({ won: false, stars: 0, dogsUsed: LEVELS[0].dogs });
  });

  it("wins and pays for unused pounces once the last rabbit is gone", () => {
    const s = new GameSession(LEVELS[0]);
    settle(s);
    // Clear the yard directly; aiming skill is covered by scripts/simulate-levels.ts.
    for (const r of [...s.rabbits]) (s as unknown as { scareRabbit: (x: unknown) => void }).scareRabbit(r);
    for (let i = 0; i < 120 && s.phase === "aiming"; i++) s.step();
    expect(s.phase).toBe("won");
    expect(s.result().stars).toBe(3);
    expect(s.score).toBe(5000 + LEVELS[0].dogs * 10000);
  });
});
