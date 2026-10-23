import { useEffect, useRef, type ReactNode } from "react";

/**
 * A painted wooden sign staked into the lawn. Used for every in-game dialog
 * (pause, results) so they read as part of the yard rather than a web modal.
 */
export function Sign({ title, children, onEscape }: { title: string; children: ReactNode; onEscape?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEscape]);

  return (
    <div className="sign-layer">
      <div className="sign" role="dialog" aria-modal="true" aria-labelledby="sign-title" ref={ref}>
        <h2 id="sign-title" className="sign__title">
          {title}
        </h2>
        {children}
      </div>
      <div className="sign-posts" aria-hidden="true" />
    </div>
  );
}
