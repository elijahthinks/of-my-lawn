import {
  ANCHOR,
  BARK_RADIUS,
  DOG_RADIUS,
  DOG_SEAT,
  GROUND_Y,
  LEASH_HOOK,
  PORCH_RIGHT,
  PORCH_TOP,
  RABBIT_RADIUS,
  WORLD_H,
  WORLD_W,
} from "./constants";
import { MATERIALS } from "./materials";
import type { Effect, GameSession } from "./session";
import { predictPath } from "./session";
import type { BlockDef, RabbitSize, Vec } from "./types";

/** Palette for everything drawn on the canvas. UI tokens in styles.css mirror these. */
export const PAL = {
  sky: "#cfe0d8",
  hedge: "#8fae84",
  hedgeDark: "#7a9a70",
  fence: "#c4b49a",
  fenceShade: "#ab9a7f",
  lawn: "#7ea845",
  lawnStripe: "#71993b",
  tuft: "#5f8530",
  dirt: "#9a7550",
  dirtDark: "#7a5a3a",
  siding: "#a9bfa0",
  sidingLine: "#93aa8a",
  porch: "#8a5b3a",
  porchEdge: "#5e3c24",
  ink: "#2e2416",
  leash: "#8e2f23",
  dogCoat: "#c98a4b",
  dogSaddle: "#3a2c20",
  dogEar: "#6b3f1f",
  dogWhite: "#f7f1e3",
  rabbit: "#9a8b78",
  buck: "#7c6c5a",
  rabbitBelly: "#ddd4c4",
  rabbitEar: "#e2a5a0",
  tennis: "#d8e04a",
} as const;

export interface View {
  scale: number;
  ox: number;
  oy: number;
  /** Visible world x range, wider than the stage on wide screens. */
  x0: number;
  x1: number;
  /** Visible world y top (negative on tall screens). */
  y0: number;
}

/**
 * How much of the stage height must be visible. The top of the sky is only
 * reached by lobbed shots, so it may be cropped on wide screens to give the
 * yard more room.
 */
const MIN_VISIBLE_H = 640;

/** Fit the stage to the canvas, pinning the lawn to the bottom edge. */
export function fitView(cssW: number, cssH: number): View {
  const scale = Math.min(cssW / WORLD_W, cssH / MIN_VISIBLE_H);
  const ox = (cssW - WORLD_W * scale) / 2;
  const oy = cssH - WORLD_H * scale;
  return { scale, ox, oy, x0: -ox / scale, x1: (cssW - ox) / scale, y0: -oy / scale };
}

export function screenToWorld(view: View, sx: number, sy: number): Vec {
  return { x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale };
}

// ---------------------------------------------------------------------------
// Backyard
// ---------------------------------------------------------------------------

export interface YardOptions {
  /** Bare patches where rabbits have been eating. */
  patches?: number[];
  night?: boolean;
}

export function drawYard(ctx: CanvasRenderingContext2D, view: View, opts: YardOptions = {}): void {
  const { x0, x1, y0 } = view;
  const left = Math.floor(x0) - 2;
  const right = Math.ceil(x1) + 2;

  ctx.fillStyle = PAL.sky;
  ctx.fillRect(left, y0 - 2, right - left, WORLD_H - y0 + 4);

  // Hedge beyond the fence: overlapping rounded clumps.
  ctx.fillStyle = PAL.hedge;
  for (let x = left - (left % 90) - 90; x < right + 90; x += 90) {
    const h = 30 + ((x / 90) % 3 === 0 ? 18 : 0);
    ctx.beginPath();
    ctx.ellipse(x, 520 - h * 0.3, 70, 40 + h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PAL.hedgeDark;
  ctx.fillRect(left, 520, right - left, 40);

  drawFence(ctx, left, right);

  // Lawn with mower stripes.
  for (let x = left - (((left % 120) + 120) % 120); x < right; x += 120) {
    ctx.fillStyle = Math.floor(x / 120) % 2 === 0 ? PAL.lawn : PAL.lawnStripe;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + 120, GROUND_Y);
    ctx.lineTo(x + 140, WORLD_H + 2);
    ctx.lineTo(x + 20, WORLD_H + 2);
    ctx.closePath();
    ctx.fill();
  }

  for (const px of opts.patches ?? []) drawPatch(ctx, px);

  // Grass tufts along the top edge.
  ctx.fillStyle = PAL.tuft;
  for (let x = left - (left % 23); x < right; x += 23) {
    const h = 6 + (Math.abs(Math.round(x * 7)) % 5);
    ctx.beginPath();
    ctx.moveTo(x - 4, GROUND_Y + 1);
    ctx.lineTo(x, GROUND_Y - h);
    ctx.lineTo(x + 4, GROUND_Y + 1);
    ctx.fill();
  }

  drawHouse(ctx, left);

  if (opts.night) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#4a5a78";
    ctx.fillRect(left, y0 - 2, right - left, WORLD_H - y0 + 4);
    ctx.restore();
    ctx.fillStyle = "#f1ecd2";
    ctx.beginPath();
    ctx.arc(1320, 180, 46, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFence(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const top = 470;
  ctx.fillStyle = PAL.fenceShade;
  ctx.fillRect(left, 540, right - left, 14);
  ctx.fillRect(left, 640, right - left, 14);
  ctx.fillStyle = PAL.fence;
  for (let x = left - (((left % 34) + 34) % 34); x < right; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x + 2, GROUND_Y);
    ctx.lineTo(x + 2, top + 14);
    ctx.lineTo(x + 15, top);
    ctx.lineTo(x + 28, top + 14);
    ctx.lineTo(x + 28, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPatch(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = PAL.dirt;
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 6, 46, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.dirtDark;
  ctx.beginPath();
  ctx.ellipse(x + 8, GROUND_Y + 7, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The back of Grandpa's house: sage siding, the deck, and the leash hook. */
function drawHouse(ctx: CanvasRenderingContext2D, left: number): void {
  const wallRight = 130;
  ctx.fillStyle = PAL.siding;
  ctx.fillRect(left, 260, wallRight - left, GROUND_Y - 260);
  ctx.strokeStyle = PAL.sidingLine;
  ctx.lineWidth = 3;
  for (let y = 278; y < GROUND_Y; y += 22) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(wallRight, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#ece6d4";
  ctx.fillRect(wallRight - 6, 260, 10, GROUND_Y - 260);

  // Deck on two posts, with a step down to the lawn.
  ctx.fillStyle = PAL.porchEdge;
  ctx.fillRect(PORCH_RIGHT - 30, PORCH_TOP, 16, GROUND_Y - PORCH_TOP);
  ctx.fillRect(wallRight + 60, PORCH_TOP, 16, GROUND_Y - PORCH_TOP);
  ctx.fillStyle = PAL.porch;
  ctx.fillRect(left, PORCH_TOP, PORCH_RIGHT - left, 22);
  ctx.fillRect(PORCH_RIGHT - 10, GROUND_Y - 40, 60, 40);
  ctx.fillStyle = PAL.porchEdge;
  ctx.fillRect(left, PORCH_TOP + 18, PORCH_RIGHT - left, 4);
  ctx.fillRect(PORCH_RIGHT - 10, GROUND_Y - 40, 60, 4);

  // Hook.
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(LEASH_HOOK.x, LEASH_HOOK.y + 6, 7, Math.PI, Math.PI * 2.4);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export type DogPose = "sit" | "strain" | "fly" | "bark";

/** Biscuit, a beagle, drawn facing right around (x, y). */
export function drawDog(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, pose: DogPose, t = 0): void {
  const R = DOG_RADIUS;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Tail, white tipped, wagging when sitting.
  const wag = pose === "sit" ? Math.sin(t / 6) * 0.35 : -0.6;
  ctx.save();
  ctx.translate(-R * 0.8, -R * 0.2);
  ctx.rotate(-0.9 + wag);
  ctx.fillStyle = PAL.dogCoat;
  ctx.fillRect(-4, -22, 8, 22);
  ctx.fillStyle = PAL.dogWhite;
  ctx.beginPath();
  ctx.arc(0, -22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body.
  ctx.fillStyle = PAL.dogCoat;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  // Saddle.
  ctx.fillStyle = PAL.dogSaddle;
  ctx.beginPath();
  ctx.arc(-4, -2, R * 0.78, Math.PI * 1.05, Math.PI * 1.75);
  ctx.lineTo(-4, -2);
  ctx.fill();
  // Chest and muzzle.
  ctx.fillStyle = PAL.dogWhite;
  ctx.beginPath();
  ctx.ellipse(R * 0.55, R * 0.25, R * 0.5, R * 0.42, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Mouth: open when barking.
  if (pose === "bark") {
    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.moveTo(R * 0.6, R * 0.2);
    ctx.lineTo(R * 1.15, R * 0.05);
    ctx.lineTo(R * 1.1, R * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Nose and eye.
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.arc(R * 1.0, -R * 0.02, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(R * 0.42, -R * 0.38, pose === "strain" ? 4.5 : 3.6, 0, Math.PI * 2);
  ctx.fill();
  if (pose === "strain") {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(R * 0.25, -R * 0.62);
    ctx.lineTo(R * 0.6, -R * 0.55);
    ctx.stroke();
  }

  // Ear: hangs when sitting, streams back in flight.
  ctx.fillStyle = PAL.dogEar;
  ctx.save();
  ctx.translate(R * 0.05, -R * 0.45);
  ctx.rotate(pose === "fly" || pose === "bark" ? -2.1 : pose === "strain" ? -0.2 : 0.35);
  ctx.beginPath();
  ctx.ellipse(0, R * 0.42, R * 0.24, R * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Collar.
  ctx.strokeStyle = PAL.leash;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.62, -0.2, 0.75);
  ctx.stroke();
  ctx.restore();
}

export function drawRabbit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: RabbitSize,
  opts: { t?: number; flinch?: number; alpha?: number } = {},
): void {
  const R = RABBIT_RADIUS[size];
  const t = opts.t ?? 0;
  const startled = (opts.flinch ?? 999) < 30;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(x, y);

  const coat = size === "buck" ? PAL.buck : PAL.rabbit;
  // Ears: upright while chewing, flat back when startled.
  for (const [dx, tilt] of [
    [-R * 0.05, -0.15],
    [R * 0.3, 0.12],
  ] as const) {
    ctx.save();
    ctx.translate(dx, -R * 0.75);
    ctx.rotate(startled ? 1.2 + tilt : tilt + Math.sin(t / 25 + dx) * 0.05);
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.7, R * 0.24, R * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.rabbitEar;
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.7, R * 0.11, R * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Tail puff faces the fence; the face turns toward the porch.
  ctx.fillStyle = PAL.dogWhite;
  ctx.beginPath();
  ctx.arc(R * 0.95, R * 0.25, R * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.rabbitBelly;
  ctx.beginPath();
  ctx.ellipse(-R * 0.35, R * 0.35, R * 0.45, R * 0.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye.
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.arc(-R * 0.45, -R * 0.3, startled ? R * 0.17 : R * 0.12, 0, Math.PI * 2);
  ctx.fill();
  if (size === "buck") {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-R * 0.7, -R * 0.55);
    ctx.lineTo(-R * 0.25, -R * 0.45);
    ctx.stroke();
  }

  // Nose, and a blade of grass being chewed.
  ctx.fillStyle = PAL.rabbitEar;
  ctx.beginPath();
  ctx.arc(-R * 0.95, -R * 0.05, R * 0.1, 0, Math.PI * 2);
  ctx.fill();
  if (!startled) {
    const chew = Math.sin(t / 4) * 2;
    ctx.strokeStyle = PAL.tuft;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-R * 0.9, R * 0.15);
    ctx.lineTo(-R * 1.45, R * 0.05 + chew);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Garden objects
// ---------------------------------------------------------------------------

function drawBlock(ctx: CanvasRenderingContext2D, def: BlockDef, x: number, y: number, angle: number, wear: number): void {
  const spec = MATERIALS[def.material];
  const { w, h } = def;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (def.material === "pot") {
    // Tapered pot with a rim and a sprig of something Grandpa planted.
    ctx.fillStyle = "#5f8f3a";
    ctx.beginPath();
    ctx.ellipse(-5, -h / 2 - 6, 5, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(6, -h / 2 - 7, 5, 11, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.fill;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2, -h / 2 + 10);
    ctx.lineTo(w / 2 - 2, -h / 2 + 10);
    ctx.lineTo(w / 2 - 6, h / 2);
    ctx.lineTo(-w / 2 + 6, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = spec.edge;
    ctx.fillRect(-w / 2, -h / 2, w, 11);
  } else {
    ctx.fillStyle = spec.fill;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = spec.edge;
    ctx.lineWidth = 3;
    ctx.strokeRect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3);

    ctx.lineWidth = 1.5;
    const long = w >= h;
    if (def.material === "wood") {
      // Grain along the long axis.
      const n = Math.max(1, Math.floor((long ? h : w) / 9));
      for (let i = 1; i <= n; i++) {
        const o = -((long ? h : w) / 2) + (i * (long ? h : w)) / (n + 1);
        ctx.beginPath();
        if (long) {
          ctx.moveTo(-w / 2 + 6, o);
          ctx.lineTo(w / 2 - 6, o + (i % 2 ? 1.5 : -1.5));
        } else {
          ctx.moveTo(o, -h / 2 + 6);
          ctx.lineTo(o + (i % 2 ? 1.5 : -1.5), h / 2 - 6);
        }
        ctx.stroke();
      }
    } else if (def.material === "hay") {
      ctx.strokeStyle = "#b8942f";
      for (let yy = -h / 2 + 8; yy < h / 2 - 4; yy += 7) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, yy);
        ctx.lineTo(w / 2 - 4, yy + 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#7d5a2a";
      ctx.fillRect(-w / 4 - 2, -h / 2, 4, h);
      ctx.fillRect(w / 4 - 2, -h / 2, 4, h);
    } else {
      ctx.fillStyle = spec.edge;
      for (let i = 0; i < (w * h) / 400; i++) {
        const sx = ((i * 37) % (w - 8)) - w / 2 + 4;
        const sy = ((i * 53) % (h - 8)) - h / 2 + 4;
        ctx.fillRect(sx, sy, 2.5, 2.5);
      }
    }
  }

  // Cracks as the block wears down.
  if (wear > 0.33) {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h / 2 + 2);
    ctx.lineTo(-w * 0.1, -h * 0.1);
    ctx.lineTo(-w * 0.2, h * 0.15);
    if (wear > 0.66) {
      ctx.moveTo(w * 0.35, h / 2 - 2);
      ctx.lineTo(w * 0.1, h * 0.1);
      ctx.lineTo(w * 0.2, -h * 0.2);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Session frame
// ---------------------------------------------------------------------------

export interface FrameOptions {
  reducedMotion: boolean;
  showFullArc: boolean;
}

export function drawSession(ctx: CanvasRenderingContext2D, view: View, s: GameSession, opts: FrameOptions): void {
  const t = s.steps;
  drawYard(ctx, view, { patches: s.level.rabbits.map((r) => r.x) });

  for (const b of s.blocks) {
    drawBlock(ctx, b.def, b.body.position.x, b.body.position.y, b.body.angle, 1 - b.health / b.maxHealth);
  }
  for (const r of s.rabbits) {
    drawRabbit(ctx, r.body.position.x, r.body.position.y, r.def.size, { t: t + r.id * 13, flinch: r.flinch });
  }

  if (s.phase === "aiming") {
    const pulling = s.pull.x !== 0 || s.pull.y !== 0;
    const dx = ANCHOR.x + s.pull.x;
    const dy = ANCHOR.y + s.pull.y;
    if (pulling) {
      drawAimPath(ctx, s.pull, opts.showFullArc);
      drawLeash(ctx, { x: dx, y: dy }, true);
      drawDog(ctx, dx, dy, Math.atan2(-s.pull.y, -s.pull.x) * 0.5, "strain", t);
    } else {
      drawLeash(ctx, DOG_SEAT, true);
      drawDog(ctx, DOG_SEAT.x, DOG_SEAT.y, 0, "sit", t);
    }
  } else {
    drawLeash(ctx, null, false);
  }

  if (s.dog) {
    const barking = s.effects.some((fx) => fx.kind === "bark" && fx.age < 14);
    drawDog(ctx, s.dog.position.x, s.dog.position.y, s.dog.angle, barking ? "bark" : "fly", t);
  }

  for (const fx of s.effects) drawEffect(ctx, fx, opts.reducedMotion);
}

function drawLeash(ctx: CanvasRenderingContext2D, dog: Vec | null, taut: boolean): void {
  ctx.strokeStyle = PAL.leash;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(LEASH_HOOK.x, LEASH_HOOK.y + 12);
  if (dog && taut) {
    const midX = (LEASH_HOOK.x + dog.x) / 2;
    const midY = (LEASH_HOOK.y + dog.y) / 2 + 18;
    ctx.quadraticCurveTo(midX, midY, dog.x - 8, dog.y + 4);
  } else {
    // Unclipped: it hangs from the hook.
    ctx.quadraticCurveTo(LEASH_HOOK.x + 30, LEASH_HOOK.y + 70, LEASH_HOOK.x + 10, LEASH_HOOK.y + 60);
  }
  ctx.stroke();
}

function drawAimPath(ctx: CanvasRenderingContext2D, pull: Vec, full: boolean): void {
  const pts = predictPath(pull, full ? 160 : 48, 4);
  pts.forEach((p, i) => {
    const r = Math.max(2.5, 6 - i * 0.18);
    ctx.fillStyle = "#fbf6e6";
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawEffect(ctx: CanvasRenderingContext2D, fx: Effect, reducedMotion: boolean): void {
  switch (fx.kind) {
    case "bark": {
      const k = fx.age / 30;
      ctx.strokeStyle = PAL.ink;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        const r = (k * BARK_RADIUS + i * 26) % BARK_RADIUS;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, -0.9, 0.9);
        ctx.stroke();
      }
      ctx.fillStyle = PAL.ink;
      ctx.font = "800 44px Gluten, cursive";
      ctx.fillText("Woof!", fx.x + 30, fx.y - 40 - (reducedMotion ? 0 : fx.age));
      ctx.globalAlpha = 1;
      break;
    }
    case "flee": {
      // Hop off toward the back fence and through the gap.
      const hop = reducedMotion ? 0 : Math.abs(Math.sin(fx.age / 7)) * 40;
      const x = fx.x + fx.age * 6;
      const y = Math.min(fx.y, GROUND_Y - RABBIT_RADIUS[fx.size]) - hop;
      drawRabbit(ctx, x, y, fx.size, { flinch: 0, alpha: 1 - fx.age / 90 });
      break;
    }
    case "debris":
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = 1 - fx.age / 50;
      ctx.fillRect(fx.x - fx.size / 2, fx.y - fx.size / 2, fx.size, fx.size);
      ctx.globalAlpha = 1;
      break;
    case "points":
      ctx.globalAlpha = 1 - fx.age / 60;
      ctx.fillStyle = PAL.ink;
      ctx.font = "800 30px Gluten, cursive";
      ctx.textAlign = "center";
      ctx.fillText(`+${fx.value}`, fx.x, fx.y - fx.age * 0.8);
      ctx.textAlign = "start";
      ctx.globalAlpha = 1;
      break;
  }
}
