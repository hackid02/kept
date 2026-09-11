export default function Logo({ size = 28, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="11" fill="#34d399" />
        <path d="M11 20.5l6 6 12-13" stroke="#062015" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {word && <span className="text-lg font-extrabold tracking-tight">Kept</span>}
    </span>
  );
}
