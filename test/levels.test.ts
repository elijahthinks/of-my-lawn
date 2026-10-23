import { describe, expect, it } from "vitest";
import { GROUND_Y, RABBIT_RADIUS, WORLD_W } from "../src/game/constants";
import { LEVELS } from "../src/game/levels";
import type { BlockDef } from "../src/game/types";

const overlaps = (a: BlockDef, b: BlockDef) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.5 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 0.5;

describe("levels", () => {
  it("ships fifteen levels numbered 1 to 15", () => {
    expect(LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it.each(LEVELS)("level $id ($name) is well formed", (level) => {
    expect(level.rabbits.length).toBeGreaterThan(0);
    expect(level.par).toBeGreaterThanOrEqual(1);
    expect(level.par).toBeLessThanOrEqual(level.dogs);

    for (const b of level.blocks) {
      expect(b.x - b.w / 2).toBeGreaterThan(400);
      expect(b.x + b.w / 2).toBeLessThan(WORLD_W);
      expect(b.y + b.h / 2).toBeLessThanOrEqual(GROUND_Y + 0.01);
    }
    for (let i = 0; i < level.blocks.length; i++) {
      for (let j = i + 1; j < level.blocks.length; j++) {
        expect(overlaps(level.blocks[i], level.blocks[j]), `blocks ${i} and ${j} overlap`).toBe(false);
      }
    }
    for (const r of level.rabbits) {
      expect(r.y + RABBIT_RADIUS[r.size]).toBeLessThanOrEqual(GROUND_Y + 0.01);
    }
  });

  it("gets busier as you go: the last five levels hold more rabbits than the first five", () => {
    const count = (ls: typeof LEVELS) => ls.reduce((n, l) => n + l.rabbits.length, 0);
    expect(count(LEVELS.slice(10))).toBeGreaterThan(count(LEVELS.slice(0, 5)) * 2);
  });
});
