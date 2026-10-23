import type { LevelDef } from "./types";

export type Stars = 0 | 1 | 2 | 3;

/** Bones (stars) depend on how many pounces Biscuit needed against the level's par. */
export function starsFor(level: LevelDef, dogsUsed: number, won: boolean): Stars {
  if (!won) return 0;
  if (dogsUsed <= level.par) return 3;
  if (dogsUsed <= level.par + 1) return 2;
  return 1;
}
