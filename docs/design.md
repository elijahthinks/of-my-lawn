# Visual design

## Brief

A slingshot physics game for phones. Biscuit, a beagle, defends Grandpa Walt's
prize-winning lawn from rabbits. The audience is casual players, kids and
adults alike. The interface's job is to stay out of the way of the yard.

## The idea

Everything is part of the backyard. No floating web panels: dialogs are
painted wooden signs staked into the lawn, the level select is a mown path
with stepping stones, and the "stars" are dog bones. Grandpa's lawn has mower
stripes, and you can see the bald patches where the rabbits have been eating.

## Palette

| Name   | Hex       | Use                                           |
| ------ | --------- | --------------------------------------------- |
| Sky    | `#cfe0d8` | Morning haze. Page and canvas background.     |
| Lawn   | `#7ea845` | Mown grass; stripes alternate with `#71993b`. |
| Cedar  | `#8a5a35` | Signs, the deck. `#5e3c24` for posts/edges.    |
| Ink    | `#2e2416` | Text and outlines. A soil brown, not black.   |
| Chalk  | `#fbf4e2` | Text on cedar and ink.                        |
| Ball   | `#d8e04a` | Tennis-ball yellow. Only for the forward action. |

The fence is a weathered, desaturated cedar (`#c4b49a`) so the garden objects
in front of it, which use saturated material colours, always stand out.

## Type

- **Gluten** (800): display. Title, level numbers, score, sign headings. Its
  soft, chunky shapes match the hand-drawn look.
- **Atkinson Hyperlegible** (400/700): everything people read. Built for
  legibility, which matters for kids and for small phone text.

Scale: perfect fourth from 17px (0.81, 1.06, 1.4, 1.88, 2.5rem), with a fluid
display size for the title. No all-caps labels, no eyebrows.

## Layout

```
Title                               Game
+--------------------------------+  +--------------------------------+
| house |  OFF MY LAWN!   Sound  |  | (II) 3 Two for lunch  ooo 1,200|
|       |  one line              |  |          [ hint ]              |
|       |  [Play]  Watch story   |  |                                |
| deck  ___fence_____________    |  | deck   ~arc~      [hut] rabbit |
| dog          r  r  R  r  r     |  | dog                            |
+==== lawn stripes ==============+  +==== lawn =====================+
```

Text is left-aligned throughout. The scene owns the screen; UI sits in the
sky where nothing is happening.

## Principles

1. Spend boldness once: the yard itself. UI chrome is quiet.
2. Yellow means "go forward". Nothing else gets it.
3. Motion only answers the player (the pounce, the bark, a rabbit fleeing),
   plus the rabbits chewing. Reduced-motion players get still frames.
4. Copy names things the player can see: pounces, bones, the yard map.

## Review against generic defaults

Checked the first draft of this plan against what a generic game UI would do:

- *Rounded cards with soft shadows for dialogs* → replaced with cedar signs on
  posts, which also give the result screen a physical place in the yard.
- *Numbered circles for the level select* → stepping stones on a path. The
  numbers stay because levels really are a sequence.
- *Stars* → bones, because it's a dog.
- *Blue sky* → a pale green haze, so the palette stays in the garden family.
- *Cream page background with a clay accent* → avoided; the only accent is
  tennis-ball yellow, which comes from the subject.
