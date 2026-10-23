# Architecture

```
src/
  game/            Pure TypeScript, no DOM. Runs in the browser, tests and Node.
    constants.ts   World size, launch tuning, points.
    types.ts       Level, block and rabbit definitions.
    materials.ts   Hay, cedar, flower pot, paver: density, health, colours.
    levels.ts      The 15 levels, written with a small stacking builder.
    session.ts     GameSession: wraps a matter-js world for one attempt.
    scoring.ts     Bones (stars) from pounces used vs par.
    render.ts      Canvas drawing: yard, Biscuit, rabbits, blocks, effects.
  components/      React screens. They own input, timing and overlays.
  state/           Saved progress (localStorage, safe when unavailable).
  audio/           Synthesized sound effects (Web Audio, no files).
```

## Game loop

`useCanvas` drives `requestAnimationFrame`. `GameScreen` accumulates elapsed
time and advances `GameSession.step()` in fixed 1/60 s steps (max 4 per frame),
so physics is deterministic regardless of frame rate. Rendering reads the
session directly; React state only mirrors the HUD and only re-renders when a
HUD value changes.

## A turn

1. `aiming`: the player drags; `aim(pull)` stores a clamped pull vector.
2. `release()` spawns Biscuit at the anchor plus the pull, with velocity
   opposite the pull. Phase becomes `flying`.
3. While flying, `bark()` can be used once: an impulse away from Biscuit plus
   fright damage to rabbits within range.
4. Collisions deal damage based on impact speed along the contact normal and
   the other body's mass. Rabbits at zero health flee; blocks break.
5. The turn ends when everything is at rest, Biscuit leaves the yard, or after
   nine seconds. Then the next pounce, or the level ends.

A level is won the moment the last rabbit flees (after a short beat), with a
bonus for each unused pounce.

## Why matter-js

Stacking stability and rotation matter for this genre and are hard to get
right by hand. matter-js is small, has no dependencies and runs headless,
which is what makes `scripts/simulate-levels.ts` possible.

## Shipping to iOS

The web build is wrapped with Capacitor. See [ios-release.md](ios-release.md).
