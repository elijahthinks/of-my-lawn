import { GROUND_Y, RABBIT_RADIUS } from "./constants";
import type { BlockDef, LevelDef, Material, RabbitDef, RabbitSize } from "./types";

const G = GROUND_Y;
const POST = 20;
const SLAB = 20;

/**
 * Small builder for laying out a backyard. Every helper takes the y of the
 * surface it stands on ("bottom") and returns the y of its own top surface,
 * so structures can be stacked without doing the arithmetic by hand.
 */
class Yard {
  blocks: BlockDef[] = [];
  rabbits: RabbitDef[] = [];

  box(material: Material, x: number, bottom: number, w: number, h: number): number {
    this.blocks.push({ material, x, y: bottom - h / 2, w, h });
    return bottom - h;
  }

  /** Two posts with a slab across them. Leaves room for a rabbit inside. */
  hut(material: Material, x: number, bottom: number, w = 150, h = 90, roof: Material = material): number {
    this.box(material, x - w / 2 + POST / 2, bottom, POST, h);
    this.box(material, x + w / 2 - POST / 2, bottom, POST, h);
    return this.box(roof, x, bottom - h, w, SLAB);
  }

  pot(x: number, bottom: number): number {
    return this.box("pot", x, bottom, 36, 46);
  }

  bale(x: number, bottom: number, w = 70): number {
    return this.box("hay", x, bottom, w, 50);
  }

  rabbit(x: number, bottom: number, size: RabbitSize = "kit"): void {
    this.rabbits.push({ x, y: bottom - RABBIT_RADIUS[size], size });
  }

  level(meta: Omit<LevelDef, "blocks" | "rabbits">): LevelDef {
    return { ...meta, blocks: this.blocks, rabbits: this.rabbits };
  }
}

function build(fn: (y: Yard) => Omit<LevelDef, "blocks" | "rabbits">): LevelDef {
  const yard = new Yard();
  const meta = fn(yard);
  return yard.level(meta);
}

export const LEVELS: LevelDef[] = [
  build((y) => {
    y.rabbit(1000, G);
    y.bale(1110, G);
    return {
      id: 1,
      name: "First nibble",
      hint: "Drag Biscuit back on the leash, aim, and let go.",
      dogs: 3,
      par: 1,
    };
  }),

  build((y) => {
    const top = y.bale(940, G);
    y.bale(940, top);
    y.rabbit(1040, G);
    y.rabbit(1180, G);
    return {
      id: 2,
      name: "Hay there",
      hint: "Tap the screen while Biscuit is flying to bark. Rabbits nearby will bolt.",
      dogs: 3,
      par: 2,
    };
  }),

  build((y) => {
    y.rabbit(880, G);
    const top = y.hut("wood", 1150, G);
    y.rabbit(1150, top);
    return {
      id: 3,
      name: "Two for lunch",
      hint: "Knock the plank roof down and the rabbit goes with it.",
      dogs: 3,
      par: 2,
    };
  }),

  build((y) => {
    y.rabbit(1100, G);
    const top = y.hut("wood", 1100, G, 160);
    y.bale(1100, top, 60);
    y.rabbit(1250, G);
    return { id: 4, name: "Crate escape", dogs: 3, par: 2 };
  }),

  build((y) => {
    const deck = y.hut("wood", 1000, G, 220, 120);
    y.pot(925, deck);
    y.rabbit(1000, deck);
    y.pot(1075, deck);
    const p = y.pot(1260, G);
    y.pot(1260, p);
    y.rabbit(1330, G);
    return {
      id: 5,
      name: "Pot luck",
      hint: "Flower pots crack easily, and they're heavy when they fall.",
      dogs: 3,
      par: 2,
    };
  }),

  build((y) => {
    y.rabbit(1150, G);
    const first = y.hut("wood", 1150, G, 170);
    y.rabbit(1150, first);
    const second = y.hut("wood", 1150, first, 170);
    y.rabbit(1150, second);
    return { id: 6, name: "Garden shed", dogs: 4, par: 2 };
  }),

  build((y) => {
    const wall = y.box("stone", 930, G, 40, 90);
    y.rabbit(930, y.box("stone", 930, wall, 40, 40));
    const roof = y.hut("hay", 1080, G, 130, 80);
    y.rabbit(1080, G, "buck");
    y.bale(1080, roof, 60);
    return {
      id: 7,
      name: "Big buck",
      hint: "Bucks are tough. Hit them hard or drop something heavy on them.",
      dogs: 3,
      par: 2,
    };
  }),

  build((y) => {
    y.rabbit(1050, G);
    const base = y.hut("stone", 1050, G, 170, 90);
    y.rabbit(1050, base);
    y.hut("wood", 1050, base, 150, 80);
    y.rabbit(1310, G);
    y.box("wood", 1240, G, 20, 100);
    return { id: 8, name: "Paver patio", dogs: 3, par: 2 };
  }),

  build((y) => {
    y.rabbit(1400, G);
    const first = y.hut("wood", 1400, G, 170);
    y.rabbit(1400, first);
    const second = y.hut("wood", 1400, first, 150, 80);
    y.rabbit(1400, second);
    y.box("stone", 1270, G, 40, 70);
    return {
      id: 9,
      name: "Far corner",
      hint: "They've moved to the back fence. Pull all the way for a long pounce.",
      dogs: 3,
      par: 2,
    };
  }),

  build((y) => {
    y.rabbit(1150, G);
    const a = y.hut("stone", 1150, G, 180, 90);
    y.rabbit(1150, a);
    const b = y.hut("wood", 1150, a, 170, 90);
    y.rabbit(1150, b);
    const c = y.hut("hay", 1150, b, 150, 70);
    y.rabbit(1150, c);
    return { id: 10, name: "Bunny tower", dogs: 4, par: 2 };
  }),

  build((y) => {
    const left = y.hut("wood", 980, G, 150);
    y.rabbit(980, G);
    y.rabbit(980, y.bale(980, left, 60));
    const right = y.hut("stone", 1320, G, 160);
    y.rabbit(1320, G);
    const top = y.hut("wood", 1320, right, 140, 80);
    y.rabbit(1320, top);
    y.pot(1150, G);
    return { id: 11, name: "Twin burrows", dogs: 5, par: 3 };
  }),

  build((y) => {
    y.box("stone", 1000, G, 40, 160);
    y.box("stone", 1280, G, 40, 160);
    y.rabbit(1090, G, "buck");
    y.rabbit(1190, G, "buck");
    const roof = y.box("stone", 1140, G - 160, 320, SLAB);
    y.pot(1080, roof);
    y.rabbit(1140, roof);
    y.pot(1200, roof);
    return {
      id: 12,
      name: "Carrot fort",
      hint: "Pavers barely notice a pounce. Try bringing the roof down instead.",
      dogs: 4,
      par: 3,
    };
  }),

  build((y) => {
    const a = y.hut("wood", 950, G, 140, 200);
    y.pot(915, a);
    y.rabbit(980, a);
    const b = y.hut("wood", 1180, G, 160, 260);
    y.rabbit(1180, b);
    y.pot(1235, b);
    const c = y.hut("wood", 1400, G, 140, 160);
    y.rabbit(1400, c);
    y.rabbit(1180, G);
    return { id: 13, name: "Hanging gardens", dogs: 4, par: 3 };
  }),

  build((y) => {
    y.rabbit(900, G);
    y.bale(960, G);
    const mid = y.hut("stone", 1120, G, 170);
    y.rabbit(1120, G, "buck");
    const mid2 = y.hut("wood", 1120, mid, 150, 80);
    y.rabbit(1120, mid2);
    const far = y.hut("wood", 1380, G, 160, 110);
    y.rabbit(1380, G);
    y.pot(1340, far);
    y.rabbit(1410, far);
    return { id: 14, name: "The warren", dogs: 5, par: 3 };
  }),

  build((y) => {
    y.box("stone", 980, G, 40, 120);
    y.rabbit(1070, G);
    y.box("stone", 1120, G, 30, 120);
    y.rabbit(1180, G, "buck");
    y.box("stone", 1240, G, 30, 120);
    y.box("stone", 1380, G, 40, 120);
    y.rabbit(1310, G);
    const deck = y.box("wood", 1180, G - 120, 440, SLAB);
    y.pot(1000, deck);
    y.rabbit(1080, deck);
    const tower = y.hut("stone", 1180, deck, 130, 90);
    y.rabbit(1290, deck);
    y.pot(1360, deck);
    y.rabbit(1180, tower, "buck");
    return {
      id: 15,
      name: "King of the lawn",
      hint: "The king sits on top. Everyone else is hiding underneath.",
      dogs: 4,
      par: 3,
    };
  }),
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
