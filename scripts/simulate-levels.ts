/**
 * Headless level checker.
 *
 *   npm run levels:check            # all levels
 *   npm run levels:check -- 7 8     # just levels 7 and 8
 *
 * For each level it verifies that:
 *   1. the yard is stable: left alone for four seconds, nothing breaks or wanders off;
 *   2. the level is beatable: a greedy search over pull angle, pull strength and
 *      bark timing clears every rabbit within the level's pounce budget.
 *
 * It also reports how many pounces the search needed next to the level's par,
 * which is a rough read on difficulty. Exit code is non-zero if any level fails.
 */
import { MAX_PULL } from "../src/game/constants";
import { LEVELS } from "../src/game/levels";
import { GameSession } from "../src/game/session";
import type { LevelDef, Vec } from "../src/game/types";

interface Shot {
  pull: Vec;
  barkWithin: number | null;
}

const ANGLES = [-10, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72];
const POWERS = [0.55, 0.7, 0.85, 1];
const BARK_OPTIONS = [null, 70, 130];

function candidateShots(): Shot[] {
  const shots: Shot[] = [];
  for (const deg of ANGLES) {
    for (const power of POWERS) {
      const a = (deg * Math.PI) / 180;
      const pull = { x: -Math.cos(a) * MAX_PULL * power, y: Math.sin(a) * MAX_PULL * power };
      for (const barkWithin of BARK_OPTIONS) shots.push({ pull, barkWithin });
    }
  }
  return shots;
}

/** Plays a shot to the end of its turn. Barks when the dog first gets close to a rabbit. */
function play(session: GameSession, shot: Shot): void {
  session.aim(shot.pull);
  session.release();
  while (session.phase === "flying") {
    if (shot.barkWithin !== null && session.canBark && session.dog) {
      const d = session.dog.position;
      const near = session.rabbits.some(
        (r) => Math.hypot(r.body.position.x - d.x, r.body.position.y - d.y) < shot.barkWithin!,
      );
      if (near) session.bark();
    }
    session.step();
  }
}

function replay(level: LevelDef, shots: Shot[]): GameSession {
  const session = new GameSession(level);
  for (let i = 0; i < 60; i++) session.step();
  for (const shot of shots) {
    if (session.phase !== "aiming") break;
    play(session, shot);
  }
  // Let a pending win resolve.
  for (let i = 0; i < 120 && session.phase === "flying"; i++) session.step();
  return session;
}

function checkStable(level: LevelDef): string | null {
  const session = new GameSession(level);
  const start = session.blocks.map((b) => ({ ...b.body.position }));
  for (let i = 0; i < 240; i++) session.step();
  if (session.rabbitsLeft !== level.rabbits.length) return "a rabbit was hurt while the yard settled";
  if (session.blocks.length !== level.blocks.length) return "a block broke while the yard settled";
  for (let i = 0; i < start.length; i++) {
    const p = session.blocks[i].body.position;
    const drift = Math.hypot(p.x - start[i].x, p.y - start[i].y);
    if (drift > 6) return `block ${i} (${session.blocks[i].def.material}) drifted ${drift.toFixed(1)}px`;
  }
  return null;
}

function solve(level: LevelDef): { shots: Shot[]; cleared: boolean } {
  const candidates = candidateShots();
  const chosen: Shot[] = [];
  for (let n = 0; n < level.dogs; n++) {
    let best: { shot: Shot; left: number; score: number } | null = null;
    for (const shot of candidates) {
      const s = replay(level, [...chosen, shot]);
      const left = s.rabbitsLeft;
      if (!best || left < best.left || (left === best.left && s.score > best.score)) {
        best = { shot, left, score: s.score };
      }
      if (left === 0) break;
    }
    chosen.push(best!.shot);
    if (best!.left === 0) return { shots: chosen, cleared: true };
  }
  return { shots: chosen, cleared: false };
}

/** How forgiving the opening shot is: share of candidate shots that win outright, and mean rabbits scared. */
function firstShotSpread(level: LevelDef): { oneShot: number; meanScared: number } {
  const candidates = candidateShots();
  let wins = 0;
  let scared = 0;
  for (const shot of candidates) {
    const s = replay(level, [shot]);
    if (s.rabbitsLeft === 0) wins += 1;
    scared += level.rabbits.length - s.rabbitsLeft;
  }
  return { oneShot: wins / candidates.length, meanScared: scared / candidates.length };
}

const only = process.argv.slice(2).map(Number).filter(Boolean);
const levels = only.length ? LEVELS.filter((l) => only.includes(l.id)) : LEVELS;
let failures = 0;

for (const level of levels) {
  const t0 = Date.now();
  const unstable = checkStable(level);
  const { shots, cleared } = solve(level);
  const spread = firstShotSpread(level);
  const ms = Date.now() - t0;
  const status = unstable ? `UNSTABLE: ${unstable}` : cleared ? "ok" : "NOT CLEARED";
  if (unstable || !cleared) failures += 1;
  console.log(
    `${String(level.id).padStart(2)}  ${level.name.padEnd(18)} ${status.padEnd(14)} ` +
      `pounces ${cleared ? shots.length : "-"}/${level.dogs}  par ${level.par}  ` +
      `one-shot wins ${(spread.oneShot * 100).toFixed(0).padStart(3)}%  ` +
      `scared/shot ${spread.meanScared.toFixed(2)} of ${level.rabbits.length}  (${ms}ms)`,
  );
}

process.exit(failures ? 1 : 0);
