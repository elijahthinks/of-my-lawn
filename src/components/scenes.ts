import { ANCHOR, DOG_SEAT, GROUND_Y, LEASH_HOOK, RABBIT_RADIUS } from "../game/constants";
import { drawDog, drawRabbit, drawYard, PAL } from "../game/render";
import { predictPath } from "../game/session";
import type { DrawFn } from "./useCanvas";

const MUNCHERS = [880, 1030, 1240, 1400];

function munchers(ctx: CanvasRenderingContext2D, frame: number, xs = MUNCHERS) {
  xs.forEach((x, i) => drawRabbit(ctx, x, GROUND_Y - RABBIT_RADIUS.kit, i === 2 ? "kit" : "kit", { t: frame + i * 40 }));
}

/** Title screen: a quiet afternoon, rabbits mid-lunch, Biscuit watching. */
export const titleScene: DrawFn = (ctx, view, frame) => {
  drawYard(ctx, view, { patches: MUNCHERS });
  munchers(ctx, frame);
  drawRabbit(ctx, 1130, GROUND_Y - RABBIT_RADIUS.buck, "buck", { t: frame + 90 });
  drawDog(ctx, DOG_SEAT.x, DOG_SEAT.y, 0, "sit", frame);
};

function drawMower(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = "#3d6b4f";
  ctx.fillRect(x - 60, GROUND_Y - 50, 120, 36);
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.arc(x - 40, GROUND_Y - 12, 14, 0, Math.PI * 2);
  ctx.arc(x + 40, GROUND_Y - 12, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 50, GROUND_Y - 48);
  ctx.lineTo(x - 130, GROUND_Y - 170);
  ctx.lineTo(x - 160, GROUND_Y - 170);
  ctx.stroke();
}

function drawRibbon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#2f5d8a";
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 22, y + 70);
  ctx.lineTo(x - 8, y + 58);
  ctx.lineTo(x, y + 72);
  ctx.lineTo(x + 2, y);
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + 10, y + 72);
  ctx.lineTo(x + 18, y + 58);
  ctx.lineTo(x + 28, y + 68);
  ctx.lineTo(x + 18, y);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.tennis;
  ctx.beginPath();
  ctx.arc(x + 2, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

export const storyScenes: DrawFn[] = [
  // Grandpa's lawn, freshly mown, prize ribbon on the fence.
  (ctx, view) => {
    drawYard(ctx, view);
    drawRibbon(ctx, 1000, 510);
    drawMower(ctx, 700);
    drawDog(ctx, DOG_SEAT.x, DOG_SEAT.y, 0, "sit", 0);
  },
  // Night: the rabbits arrive.
  (ctx, view, frame) => {
    drawYard(ctx, view, { patches: MUNCHERS, night: true });
    ctx.save();
    ctx.globalAlpha = 0.85;
    munchers(ctx, frame);
    ctx.restore();
  },
  // Morning: Biscuit sees the damage.
  (ctx, view, frame) => {
    drawYard(ctx, view, { patches: MUNCHERS });
    munchers(ctx, frame);
    drawDog(ctx, DOG_SEAT.x, DOG_SEAT.y, 0, "strain", frame);
    ctx.fillStyle = PAL.ink;
    ctx.font = "800 90px Gluten, cursive";
    ctx.fillText("!", DOG_SEAT.x - 10, DOG_SEAT.y - 50);
  },
  // How to play: the leash pulled back, the arc ahead.
  (ctx, view, frame) => {
    drawYard(ctx, view, { patches: [1100] });
    drawRabbit(ctx, 1100, GROUND_Y - RABBIT_RADIUS.kit, "kit", { t: frame });
    const swing = Math.sin(frame / 50) * 8;
    const pull = { x: -105, y: 60 + swing };
    for (const p of predictPath(pull, 150, 4)) {
      ctx.fillStyle = "#fbf6e6";
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = PAL.leash;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(LEASH_HOOK.x, LEASH_HOOK.y + 12);
    ctx.quadraticCurveTo(120, 600, ANCHOR.x + pull.x - 8, ANCHOR.y + pull.y + 4);
    ctx.stroke();
    drawDog(ctx, ANCHOR.x + pull.x, ANCHOR.y + pull.y, -0.4, "strain", frame);
  },
];
