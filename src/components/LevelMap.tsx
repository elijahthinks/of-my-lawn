import { LEVELS } from "../game/levels";
import { isUnlocked, nextLevelId, totalStars, type Progress } from "../state/progress";
import { Bones } from "./Icons";

/** Stepping stones along a mown path, in play order (map units: 1000 x 540). */
const STONES: Array<[number, number]> = [
  [110, 90], [290, 122], [480, 82], [670, 116], [880, 96],
  [862, 272], [668, 244], [478, 282], [290, 250], [118, 276],
  [130, 452], [322, 428], [512, 462], [702, 426], [890, 452],
];

/** Catmull-Rom through the stones, as cubic Béziers. */
function pathThrough(pts: Array<[number, number]>): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const PATH = pathThrough(STONES);

interface Props {
  progress: Progress;
  onPick: (levelId: number) => void;
  onBack: () => void;
}

export function LevelMap({ progress, onPick, onBack }: Props) {
  const current = nextLevelId(progress);
  const bones = totalStars(progress);

  return (
    <main className="screen map">
      <header className="map__bar">
        <button className="btn-text" onClick={onBack}>
          Back
        </button>
        <h1 className="map__title">The backyard</h1>
        <p className="map__count">
          {bones} of {LEVELS.length * 3} bones
        </p>
      </header>

      <div className="map__yard">
        <svg className="map__lawn" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="mow" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
              <rect width="45" height="90" fill="#7ea845" />
              <rect x="45" width="45" height="90" fill="#73993d" />
            </pattern>
          </defs>
          <rect width="1000" height="540" fill="url(#mow)" />
          <path d={PATH} fill="none" stroke="#9a7550" strokeWidth="34" strokeLinecap="round" />
          <path d={PATH} fill="none" stroke="#ad8862" strokeWidth="14" strokeLinecap="round" strokeDasharray="2 22" />
        </svg>

        <ol className="map__stones">
          {LEVELS.map((level, i) => {
            const [x, y] = STONES[i];
            const open = isUnlocked(progress, level.id);
            const stars = progress.stars[level.id] ?? 0;
            const label = open
              ? `Level ${level.id}, ${level.name}${stars ? `, ${stars} of 3 bones` : ", not cleared yet"}`
              : `Level ${level.id}, locked. Clear level ${level.id - 1} first.`;
            return (
              <li key={level.id} className="map__spot" style={{ left: `${x / 10}%`, top: `${(y / 540) * 100}%` }}>
                <button
                  className={`stone${open ? "" : " stone--locked"}${level.id === current && open ? " stone--current" : ""}`}
                  disabled={!open}
                  onClick={() => onPick(level.id)}
                  aria-label={label}
                  title={open ? level.name : "Locked"}
                >
                  {level.id}
                </button>
                {stars > 0 && <Bones count={stars} size={18} />}
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
