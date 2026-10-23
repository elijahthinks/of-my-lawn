# Contributing

1. Branch from `main`.
2. `npm install`, then make your change.
3. Before opening a pull request, run:

   ```sh
   npm run typecheck
   npm test
   npm run levels:check
   ```

4. Fill in the pull request template. Include a screenshot for visual changes.

## Adding or changing a level

Read [docs/levels.md](docs/levels.md). Every level must pass
`npm run levels:check`: stable when left alone, and beatable within its
pounces. Set `par` from what the checker reports, plus some slack for humans.

## Code style

- `src/game` stays free of DOM and React so it can run headless.
- Prefer clear names over comments; comment the why, not the what.
- Colours come from the tokens in `src/styles.css` and `PAL` in
  `src/game/render.ts`. Don't introduce new ones without updating
  [docs/design.md](docs/design.md).
