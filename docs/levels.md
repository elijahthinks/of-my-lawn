# Level design

Levels live in `src/game/levels.ts`. Each one is built with a `Yard` helper:
every method takes the y of the surface it stands on and returns the y of its
own top, so you stack instead of doing arithmetic.

```ts
build((y) => {
  y.rabbit(1150, G);                     // on the lawn
  const roof = y.hut("wood", 1150, G);   // two posts and a slab
  y.rabbit(1150, roof);                  // on the roof
  return { id: 3, name: "Two for lunch", dogs: 3, par: 2 };
});
```

- `dogs`: pounces available.
- `par`: pounces for three bones. One over par is two bones; anything else
  that wins is one.
- `hint`: optional, shown before the first pounce.

## Difficulty curve

| Levels | What's new                                                     |
| ------ | -------------------------------------------------------------- |
| 1–2    | Open lawn, hay. Learn the pounce, then the bark.               |
| 3–6    | Cedar huts and flower pots; rabbits up high.                   |
| 7–10   | Bucks (tougher rabbits), stone pavers, the far fence, towers.  |
| 11–15  | Several structures at once, stone forts, four to six rabbits.  |

## Checking a level

```sh
npm run levels:check          # all levels
npm run levels:check -- 7     # one level
```

For every level the checker:

1. leaves the yard alone for four seconds and fails if anything breaks or
   drifts, which catches overlapping or unsupported blocks;
2. runs a greedy search over pull angle, power and bark timing, and fails if
   it can't clear the yard within the level's pounces;
3. reports the share of opening shots that win outright and the average number
   of rabbits an opening shot scares. Low numbers mean the level needs a
   precise shot.

CI runs it on every push, so a level that is unstable or impossible can't
ship. If you change physics tuning in `session.ts`, run it and adjust par.
