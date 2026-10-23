/** A dog bone: the game's "star". */
export function Bone({ earned, size = 34 }: { earned: boolean; size?: number }) {
  return (
    <svg className={earned ? "bone bone--earned" : "bone"} width={size} height={size * 0.5} viewBox="0 0 60 30" aria-hidden="true">
      <path d="M12 4a7 7 0 0 0-6.4 9.8A7 7 0 0 0 12 26c2.6 0 4.8-1.4 6-3.5h24c1.2 2.1 3.4 3.5 6 3.5a7 7 0 0 0 6.4-12.2A7 7 0 0 0 48 4c-2.6 0-4.8 1.4-6 3.5H18C16.8 5.4 14.6 4 12 4z" />
    </svg>
  );
}

export function Bones({ count, size }: { count: number; size?: number }) {
  return (
    <span className="bones" role="img" aria-label={`${count} of 3 bones`}>
      {[1, 2, 3].map((i) => (
        <Bone key={i} earned={i <= count} size={size} />
      ))}
    </span>
  );
}

/** Biscuit's head in profile, used to count remaining pounces. */
export function DogHead({ spent }: { spent: boolean }) {
  return (
    <svg className={spent ? "doghead doghead--spent" : "doghead"} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="14" cy="16" r="11" fill="#c98a4b" />
      <ellipse cx="20" cy="19" rx="7" ry="5.5" fill="#f7f1e3" />
      <circle cx="25" cy="16" r="2.2" fill="#2e2416" />
      <circle cx="16" cy="12" r="1.8" fill="#2e2416" />
      <ellipse cx="9" cy="16" rx="4" ry="8" fill="#6b3f1f" transform="rotate(15 9 16)" />
    </svg>
  );
}
