export function Mark({ size = 20, draw = false }: { size?: number; draw?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="6" stroke="rgb(var(--accent))" strokeWidth="1.5" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="rgb(var(--accent))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={draw ? "check-draw" : undefined} />
    </svg>
  );
}
export default function Logo({ word = true }: { word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={20} />
      {word && <span className="serif text-[21px] leading-none tracking-tight text-ink">Kept</span>}
    </span>
  );
}
