import { useEffect, useState } from "react";
import { setMuted } from "./audio/sfx";
import { GameScreen } from "./components/GameScreen";
import { LevelMap } from "./components/LevelMap";
import { StoryScreen } from "./components/StoryScreen";
import { TitleScreen } from "./components/TitleScreen";
import type { SessionResult } from "./game/session";
import { isUnlocked, loadProgress, recordResult, saveProgress, totalStars, type Progress } from "./state/progress";

type Screen = { name: "title" } | { name: "story" } | { name: "map" } | { name: "play"; levelId: number };

export function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>({ name: "title" });

  useEffect(() => {
    saveProgress(progress);
    setMuted(progress.muted);
  }, [progress]);

  const toggleSound = () => setProgress((p) => ({ ...p, muted: !p.muted }));

  const finishStory = () => {
    setProgress((p) => ({ ...p, storySeen: true }));
    setScreen({ name: "map" });
  };

  const onResult = (levelId: number, r: SessionResult) => setProgress((p) => recordResult(p, levelId, r));

  switch (screen.name) {
    case "title":
      return (
        <TitleScreen
          hasProgress={totalStars(progress) > 0}
          muted={progress.muted}
          onPlay={() => setScreen(progress.storySeen ? { name: "map" } : { name: "story" })}
          onStory={() => setScreen({ name: "story" })}
          onToggleSound={toggleSound}
        />
      );
    case "story":
      return <StoryScreen onDone={finishStory} />;
    case "map":
      return (
        <LevelMap
          progress={progress}
          onPick={(levelId) => setScreen({ name: "play", levelId })}
          onBack={() => setScreen({ name: "title" })}
        />
      );
    case "play":
      return (
        <GameScreen
          levelId={screen.levelId}
          muted={progress.muted}
          bestScore={progress.best[screen.levelId] ?? 0}
          onResult={onResult}
          onNext={(id) => setScreen(isUnlocked(progress, id) ? { name: "play", levelId: id } : { name: "map" })}
          onMap={() => setScreen({ name: "map" })}
          onToggleSound={toggleSound}
        />
      );
  }
}
