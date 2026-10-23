import { useState } from "react";
import { storyScenes } from "./scenes";
import { prefersReducedMotion, useCanvas } from "./useCanvas";

const PAGES = [
  "Grandpa Walt has mowed this lawn every Saturday for forty years. Last summer it won Best Lawn on Maple Street.",
  "Then, one night, the rabbits found it.",
  "By morning there were bald patches everywhere. Biscuit was not having it.",
  "Pull Biscuit back on the leash and let go to pounce. Tap the screen while she's flying to bark. Clear every rabbit to save the yard.",
];

export function StoryScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const { canvasRef } = useCanvas(
    (ctx, view, frame) => storyScenes[page](ctx, view, frame),
    undefined,
    !prefersReducedMotion(),
    page,
  );

  return (
    <main className="screen">
      <canvas ref={canvasRef} className="stage" aria-hidden="true" />
      <div className="caption" aria-live="polite">
        <p className="caption__text">{PAGES[page]}</p>
        <div className="caption__nav">
          {last ? (
            <button className="btn-text btn-text--light" onClick={() => setPage(page - 1)}>
              Back
            </button>
          ) : (
            <button className="btn-text btn-text--light" onClick={onDone}>
              Skip story
            </button>
          )}
          <button className="btn btn--go" onClick={() => (last ? onDone() : setPage(page + 1))}>
            {last ? "Go to the yard" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}
