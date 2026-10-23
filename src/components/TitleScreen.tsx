import { prefersReducedMotion, useCanvas } from "./useCanvas";
import { titleScene } from "./scenes";

interface Props {
  hasProgress: boolean;
  muted: boolean;
  onPlay: () => void;
  onStory: () => void;
  onToggleSound: () => void;
}

export function TitleScreen({ hasProgress, muted, onPlay, onStory, onToggleSound }: Props) {
  const { canvasRef } = useCanvas(titleScene, undefined, !prefersReducedMotion());
  return (
    <main className="screen">
      <canvas ref={canvasRef} className="stage" aria-hidden="true" />
      <div className="title">
        <h1 className="title__name">Off My Lawn!</h1>
        <p className="title__line">Rabbits are eating Grandpa's prize lawn. Biscuit the beagle is on it.</p>
        <div className="title__actions">
          <button className="btn btn--go" onClick={onPlay}>
            {hasProgress ? "Keep playing" : "Play"}
          </button>
          <button className="btn-text" onClick={onStory}>
            Watch the story
          </button>
        </div>
      </div>
      <button className="btn-text corner" onClick={onToggleSound} aria-pressed={!muted}>
        Sound {muted ? "off" : "on"}
      </button>
    </main>
  );
}
