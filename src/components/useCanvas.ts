import { useEffect, useRef } from "react";
import { fitView, type View } from "../game/render";

export type DrawFn = (ctx: CanvasRenderingContext2D, view: View, frame: number) => void;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * Keeps a canvas sized to its container at device pixel ratio and calls `draw`
 * every animation frame with a world-space transform already applied.
 * `tick` runs before each draw and receives elapsed milliseconds.
 * When not animating, changing `redrawKey` redraws the still frame.
 */
export function useCanvas(draw: DrawFn, tick?: (ms: number) => void, animate = true, redrawKey: unknown = 0) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>(fitView(1, 1));
  const drawRef = useRef(draw);
  const tickRef = useRef(tick);
  drawRef.current = draw;
  tickRef.current = tick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      viewRef.current = fitView(rect.width, rect.height);
    };

    const render = () => {
      const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
      const v = viewRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.ox, dpr * v.oy);
      drawRef.current(ctx, v, frame);
    };

    const loop = (now: number) => {
      const ms = Math.min(100, now - last);
      last = now;
      tickRef.current?.(ms);
      frame += 1;
      render();
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      render();
    });
    ro.observe(canvas);
    // Canvas text uses the display face; redraw once it has loaded.
    document.fonts?.ready.then(render);

    if (animate) raf = requestAnimationFrame(loop);
    else render();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animate, redrawKey]);

  return { canvasRef, viewRef };
}
