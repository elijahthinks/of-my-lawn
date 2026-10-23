/** The world is a fixed 1600 x 800 stage; the renderer scales it to fit the screen. */
export const WORLD_W = 1600;
export const WORLD_H = 800;
export const GROUND_Y = 700;

/** Rest point of the leash: pulls are measured from here, like a slingshot pouch. */
export const ANCHOR = { x: 290, y: 500 } as const;
/** Hook on the house wall the leash is clipped to. */
export const LEASH_HOOK = { x: 112, y: 470 } as const;
/** Top of the back deck Biscuit waits on. */
export const PORCH_TOP = 610;
export const PORCH_RIGHT = 370;

export const DOG_RADIUS = 26;
/** Where Biscuit sits on the deck between pounces. */
export const DOG_SEAT = { x: ANCHOR.x, y: PORCH_TOP - DOG_RADIUS } as const;
export const MAX_PULL = 130;
/** The deck is in the way below the anchor. */
export const MAX_PULL_DOWN = 84;
export const MAX_LAUNCH_SPEED = 20;

export const RABBIT_RADIUS = { kit: 18, buck: 26 } as const;
export const RABBIT_HEALTH = { kit: 30, buck: 90 } as const;

/** Fixed simulation step (ms). Physics is deterministic at this rate. */
export const STEP_MS = 1000 / 60;
/** Gravity per step, matching matter-js defaults (1 * 0.001 * STEP_MS^2). */
export const GRAVITY_PER_STEP = 0.001 * STEP_MS * STEP_MS;

export const BARK_RADIUS = 210;
export const BARK_SCARE_RADIUS = 120;

export const POINTS = {
  rabbit: 5000,
  spareDog: 10000,
} as const;
