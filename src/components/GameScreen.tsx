import { useCallback, useRef, useState } from "react";
import { sfx } from "../audio/sfx";
import { STEP_MS } from "../game/constants";
import { getLevel, LEVELS } from "../game/levels";
import { drawSession, screenToWorld } from "../game/render";
import { GameSession, type SessionResult } from "../game/session";
import type { Vec } from "../game/types";
import { Bones, DogHead } from "./Icons";
import { Sign } from "./Sign";
import { prefersReducedMotion, useCanvas } from "./useCanvas";

interface Props {
  levelId: number;
  muted: boolean;
  bestScore: number;
  onResult: (levelId: number, result: SessionResult) => void;
  onNext: (levelId: number) => void;
  onMap: () => void;
  onToggleSound: () => void;
}

interface Hud {
  phase: GameSession["phase"];
  dogsLeft: number;
  rabbitsLeft: number;
  score: number;
  canBark: boolean;
  launched: boolean;
}

function hudOf(s: GameSession): Hud {
  return {
    phase: s.phase,
    dogsLeft: s.dogsLeft,
    rabbitsLeft: s.rabbitsLeft,
    score: s.score,
    canBark: s.canBark,
    launched: s.dogsUsed > 0,
  };
}

const sameHud = (a: Hud, b: Hud) =>
  a.phase === b.phase &&
  a.dogsLeft === b.dogsLeft &&
  a.rabbitsLeft === b.rabbitsLeft &&
  a.score === b.score &&
  a.canBark === b.canBark &&
  a.launched === b.launched;

/** Keyboard aiming: angle in degrees above horizontal, power 0..1. */
const KEY_AIM = { angle: 35, power: 0.8 };

/** Owns the attempt counter; each attempt is a fresh Round with its own physics world. */
export function GameScreen(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return <Round key={`${props.levelId}:${attempt}`} {...props} onRestart={() => setAttempt((a) => a + 1)} />;
}

function Round({ levelId, muted, bestScore, onResult, onNext, onMap, onToggleSound, onRestart }: Props & { onRestart: () => void }) {
  const level = getLevel(levelId)!;
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [bestBefore] = useState(bestScore);
  const reducedMotion = useRef(prefersReducedMotion());

  const [session] = useState(
    () =>
      new GameSession(level, {
        launch: sfx.launch,
        bark: sfx.bark,
        thud: sfx.thud,
        rabbitScared: sfx.scared,
        blockBroken: sfx.crack,
        finished: (r) => {
          if (r.won) sfx.win();
          else sfx.lose();
          setResult(r);
          onResult(level.id, r);
        },
      }),
  );
  const sessionRef = useRef(session);
  // Handy for poking at a level from the browser console during development.
  if (import.meta.env.DEV) (window as unknown as { oml: GameSession }).oml = session;
  const [hud, setHud] = useState<Hud>(() => hudOf(session));
  const accumulator = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const tick = useCallback((ms: number) => {
    const s = sessionRef.current;
    if (pausedRef.current) return;
    accumulator.current += ms;
    let n = 0;
    while (accumulator.current >= STEP_MS && n < 4) {
      s.step();
      accumulator.current -= STEP_MS;
      n++;
    }
    if (n === 4) accumulator.current = 0;
    const next = hudOf(s);
    setHud((prev) => (sameHud(prev, next) ? prev : next));
  }, []);

  const { canvasRef, viewRef } = useCanvas(
    (ctx, view) =>
      drawSession(ctx, view, sessionRef.current, {
        reducedMotion: reducedMotion.current,
        showFullArc: level.id <= 3,
      }),
    tick,
  );

  // --- Pointer input: drag anywhere to pull the leash, tap mid-flight to bark.
  const drag = useRef<{ id: number; start: Vec } | null>(null);

  const toWorld = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return screenToWorld(viewRef.current, e.clientX - rect.left, e.clientY - rect.top);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    sfx.unlock();
    if (paused || result) return;
    const s = sessionRef.current;
    if (s.phase === "flying") {
      s.bark();
      return;
    }
    if (s.phase === "aiming" && !drag.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { id: e.pointerId, start: toWorld(e) };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const p = toWorld(e);
    sessionRef.current.aim({ x: p.x - drag.current.start.x, y: p.y - drag.current.start.y });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    drag.current = null;
    sessionRef.current.release();
  };

  // --- Keyboard input, for players who can't drag.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (paused || result) return;
    const s = sessionRef.current;
    const aimFromKeys = () => {
      const a = (KEY_AIM.angle * Math.PI) / 180;
      s.aim({ x: -Math.cos(a) * 130 * KEY_AIM.power, y: Math.sin(a) * 130 * KEY_AIM.power });
    };
    switch (e.key) {
      case "ArrowUp":
        KEY_AIM.angle = Math.min(80, KEY_AIM.angle + 2);
        aimFromKeys();
        break;
      case "ArrowDown":
        KEY_AIM.angle = Math.max(-20, KEY_AIM.angle - 2);
        aimFromKeys();
        break;
      case "ArrowRight":
        KEY_AIM.power = Math.min(1, KEY_AIM.power + 0.04);
        aimFromKeys();
        break;
      case "ArrowLeft":
        KEY_AIM.power = Math.max(0.2, KEY_AIM.power - 0.04);
        aimFromKeys();
        break;
      case " ":
      case "Enter":
        sfx.unlock();
        if (s.phase === "flying") s.bark();
        else if (s.phase === "aiming") {
          if (s.pull.x === 0 && s.pull.y === 0) aimFromKeys();
          else s.release();
        }
        break;
      case "Escape":
      case "p":
        setPaused(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const restart = onRestart;

  const hasNext = level.id < LEVELS.length;
  const hint = !hud.launched && hud.phase === "aiming" ? level.hint : undefined;
  const barkPrompt = hud.canBark && level.id <= 4;

  return (
    <main className="screen game">
      <canvas
        ref={canvasRef}
        className="stage stage--play"
        tabIndex={0}
        aria-label={`${level.name}. Drag to pull Biscuit back, release to pounce, tap while flying to bark. Keyboard: arrows aim, space to pounce or bark.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />

      <div className="hud">
        <button className="hud__pause" onClick={() => setPaused(true)} aria-label="Pause">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect x="4" y="3" width="5" height="16" rx="1.5" />
            <rect x="13" y="3" width="5" height="16" rx="1.5" />
          </svg>
        </button>
        <p className="hud__level">
          <span className="hud__num">{level.id}</span> {level.name}
        </p>
        <div className="hud__right">
          <span className="hud__dogs" role="img" aria-label={`${hud.dogsLeft} pounces left`}>
            {Array.from({ length: level.dogs }, (_, i) => (
              <DogHead key={i} spent={i >= hud.dogsLeft + (hud.phase === "flying" ? 1 : 0)} />
            ))}
          </span>
          <span className="hud__score" aria-label={`Score ${hud.score}`}>
            {hud.score.toLocaleString()}
          </span>
        </div>
      </div>

      {(hint || barkPrompt) && (
        <p className="hint" aria-live="polite">
          {barkPrompt ? "Tap now to bark!" : hint}
        </p>
      )}

      {paused && !result && (
        <Sign title="Paused" onEscape={() => setPaused(false)}>
          <div className="sign__actions">
            <button className="btn btn--go" onClick={() => setPaused(false)}>
              Resume
            </button>
            <button className="btn-text btn-text--light" onClick={restart}>
              Restart level
            </button>
            <button className="btn-text btn-text--light" onClick={onMap}>
              Yard map
            </button>
            <button className="btn-text btn-text--light" onClick={onToggleSound} aria-pressed={!muted}>
              Sound {muted ? "off" : "on"}
            </button>
          </div>
        </Sign>
      )}

      {result && (
        <Sign title={result.won ? "Yard cleared!" : "Still munching"}>
          {result.won ? (
            <>
              <Bones count={result.stars} size={52} />
              <p className="sign__score">
                Score {result.score.toLocaleString()}
                <span className="sign__best">
                  {result.score > bestBefore ? "New best" : `Best ${bestBefore.toLocaleString()}`}
                </span>
              </p>
              {result.stars < 3 && (
                <p className="sign__note">
                  Clear it in {level.par} {level.par === 1 ? "pounce" : "pounces"} for all three bones.
                </p>
              )}
            </>
          ) : (
            <p className="sign__note">
              {hud.rabbitsLeft === 1 ? "One rabbit is" : `${hud.rabbitsLeft} rabbits are`} still on the lawn. Look for
              the weak spot: hay and pots break easily.
            </p>
          )}
          <div className="sign__actions">
            {result.won && hasNext ? (
              <button className="btn btn--go" onClick={() => onNext(level.id + 1)}>
                Next level
              </button>
            ) : (
              <button className="btn btn--go" onClick={restart}>
                Try again
              </button>
            )}
            {result.won && hasNext && (
              <button className="btn-text btn-text--light" onClick={restart}>
                Replay
              </button>
            )}
            <button className="btn-text btn-text--light" onClick={onMap}>
              Yard map
            </button>
          </div>
          {result.won && !hasNext && <p className="sign__note">That's every rabbit. Grandpa's lawn is safe.</p>}
        </Sign>
      )}
    </main>
  );
}
