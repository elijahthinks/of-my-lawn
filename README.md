# Off My Lawn

Rabbits are eating Grandpa Walt's prize lawn. Biscuit the beagle is on it.

A slingshot physics game in the spirit of Angry Birds, built with React,
TypeScript and matter-js, and packaged for iOS with Capacitor. Pull Biscuit
back on her leash, let go to pounce, and tap mid-air to bark. Knock over hay
bales, cedar huts, flower pots and garden pavers until every rabbit has fled.

- A short illustrated story to open the game
- 15 levels, from a single rabbit on open grass to a stone fort
- Levels unlock in order; earn up to three bones on each
- Works offline, no tracking, progress saved on the device
- Touch, mouse and keyboard controls

## Getting started

Requires Node 20 or newer (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:5173
```

Turn a phone sideways, or use a landscape browser window.

## How to play

| Action          | Touch / mouse                    | Keyboard                  |
| --------------- | -------------------------------- | ------------------------- |
| Aim             | Drag anywhere, away from the yard | Arrow keys (angle, power) |
| Pounce          | Let go                           | Space or Enter            |
| Bark (once per pounce) | Tap while Biscuit is flying | Space or Enter          |
| Pause           | Pause button                     | Esc or P                  |

## Scripts

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the dev server.                                     |
| `npm run build`        | Typecheck and build to `dist/`.                           |
| `npm test`             | Run unit tests (Vitest).                                  |
| `npm run typecheck`    | TypeScript only.                                          |
| `npm run levels:check` | Simulate every level: stable at rest, and beatable within its pounces. |
| `npm run ios:sync`     | Build and copy into the iOS project.                      |
| `npm run ios:open`     | Open the iOS project in Xcode.                            |

## Project layout

```
.github/        CI workflow, issue and pull request templates
src/game/       Physics session, levels, rendering (no DOM dependencies)
src/components/ React screens: title, story, yard map, game
src/state/      Saved progress
src/audio/      Synthesized sound effects
test/           Unit tests
scripts/        Level simulator, iOS setup
docs/           Architecture, level design, visual design, App Store release
```

## Documentation

- [Architecture](docs/architecture.md)
- [Level design and the level checker](docs/levels.md)
- [Visual design](docs/design.md)
- [Releasing on the App Store](docs/ios-release.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
