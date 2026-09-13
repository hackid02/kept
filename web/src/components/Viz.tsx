"use client";
/**
 * Visual layer. Monochrome, hairline, animated — every element draws once on mount
 * and then breathes. No stock illustrations: each visual is Kept's own object
 * (envelope, check, receipt, bond, validators) drawn in the type of the site.
 * Motion: draw-on with stroke-dashoffset, ease-out, ≤ 900 ms; ambient loops are slow (6–12 s).
 * All honor prefers-reduced-motion via the global rule.
 */
import { useEffect, useId, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

const EASE = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ */
/* Draw: any <path>/<circle>/<line> children of this group draw in on view */
export function Draw({ children, delay = 0, duration = 0.9, className = "" }: { children: React.ReactNode; delay?: number; duration?: number; className?: string }) {
  return (
    <motion.g className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}>
      {Array.isArray(children) ? children.map((c, i) => <motion.g key={i} variants={{ hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1, transition: { duration, ease: EASE } } }}>{c}</motion.g>) : children}
    </motion.g>
  );
}
const stroke = { hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1 } };
const P = (props: React.ComponentProps<typeof motion.path>) => <motion.path variants={stroke} transition={{ duration: 0.8, ease: EASE }} fill="none" strokeLinecap="round" strokeLinejoin="round" {...props} />;
const C = (props: React.ComponentProps<typeof motion.circle>) => <motion.circle variants={stroke} transition={{ duration: 0.6, ease: EASE }} fill="none" {...props} />;
const Fade = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => <motion.g variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, delay, ease: EASE } } }}>{children}</motion.g>;

/* ------------------------------------------------------------------ */
/** HERO — the loop as one drawing: chat bubble → envelope check → receipt → bond. Animated, 3.5 s cycle after draw-on. */
export function HeroFlow({ className = "", bond, paid, receiptId }: { className?: string; bond?: number; paid?: number; receiptId?: string }) {
  const total = (bond ?? 74185) + (paid ?? 815); const paidFrac = total ? Math.min(0.35, Math.max(0.06, (paid ?? 815) / total)) : 0.1; const greenW = Math.round(440 * (1 - paidFrac)), redW = 440 - greenW;
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [phase, setPhase] = useState(0); // 0 idle, 1 promise, 2 checking, 3 receipt
  useEffect(() => {
    if (!inView) return;
    let i = 0; const t0 = setTimeout(() => setPhase(1), 1200);
    const t = setInterval(() => { i = (i + 1) % 4; setPhase(i); }, 1800);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [inView]);
  const id = useId();
  return (
    <svg ref={ref} viewBox="0 0 520 300" className={className} role="img" aria-label="A promise from an agent is checked against the company's envelope by validators and becomes a receipt backed by a bond">
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" x2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0" /><stop offset=".5" stopColor="currentColor" stopOpacity="1" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <motion.g initial="hidden" animate={inView ? "show" : "hidden"} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="text-ink">
        {/* faint grid — the desk */}
        <Fade>
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={20 + i * 44} y1="16" x2={20 + i * 44} y2="284" stroke="currentColor" strokeOpacity=".05" />)}
          {Array.from({ length: 7 }, (_, i) => <line key={i} x1="16" y1={20 + i * 44} x2="504" y2={20 + i * 44} stroke="currentColor" strokeOpacity=".05" />)}
        </Fade>

        {/* 1 · agent bubble (left) */}
        <P d="M40 84 h150 a10 10 0 0 1 10 10 v44 a10 10 0 0 1 -10 10 h-110 l-18 14 v-14 h-22 a10 10 0 0 1 -10 -10 v-44 a10 10 0 0 1 10 -10 z" stroke="currentColor" strokeOpacity=".7" strokeWidth="1.25" />
        <Fade delay={.5}>
          <text x="56" y="108" className="fill-ink" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="14">$340 refund,</text>
          <text x="56" y="128" className="fill-ink" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="14">5 business days.</text>
          <text x="40" y="70" className="fill-ink-3" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">AGENT REPLY</text>
        </Fade>

        {/* wire 1 → 2, with a travelling pulse when phase ≥ 1 */}
        <P d="M200 116 H244" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.25" />
        {phase >= 1 && <motion.circle key={`p1-${phase}`} r="2.5" cy="116" className="fill-accent" initial={{ cx: 200, opacity: 0 }} animate={{ cx: 244, opacity: [0, 1, 1, 0] }} transition={{ duration: 0.7, ease: "linear" }} />}

        {/* 2 · the envelope check — a ring of validators around the envelope */}
        <C cx="300" cy="116" r="44" stroke="currentColor" strokeOpacity=".22" strokeWidth="1" strokeDasharray="2 5" />
        <P d="M280 100 h40 v32 h-40 z M280 100 l20 16 l20 -16" stroke="currentColor" strokeOpacity=".8" strokeWidth="1.25" />
        <Fade delay={.6}><text x="300" y="50" textAnchor="middle" className="fill-ink-3" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">ENVELOPE · VALIDATORS</text></Fade>
        {/* validators: 5 nodes on the ring, light up in sequence while checking */}
        {[-90, -18, 54, 126, 198].map((deg, i) => {
          const a = (deg * Math.PI) / 180, cx = 300 + 44 * Math.cos(a), cy = 116 + 44 * Math.sin(a);
          const lit = phase === 2;
          return (
            <g key={i}>
              <C cx={cx} cy={cy} r="5" stroke="currentColor" strokeOpacity=".5" strokeWidth="1" className="fill-canvas" />
              <motion.circle cx={cx} cy={cy} r="2.2" className="fill-accent" animate={{ opacity: lit ? [0, 1, 1] : 0.25, scale: lit ? [0.6, 1.2, 1] : 1 }} transition={{ duration: 0.5, delay: lit ? i * 0.16 : 0, ease: EASE }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
            </g>
          );
        })}
        {/* consensus ring pulse */}
        {phase === 2 && <motion.circle key="ring" cx="300" cy="116" r="44" fill="none" className="stroke-accent" strokeWidth="1" initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: 0, scale: 1.35 }} transition={{ duration: 1.4, ease: "easeOut" }} style={{ transformOrigin: "300px 116px" }} />}

        {/* wire 2 → 3 */}
        <P d="M344 116 H388" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.25" />
        {phase >= 3 && <motion.circle key={`p2-${phase}`} r="2.5" cy="116" className="fill-accent" initial={{ cx: 344, opacity: 0 }} animate={{ cx: 388, opacity: [0, 1, 1, 0] }} transition={{ duration: 0.6, ease: "linear" }} />}

        {/* 3 · the receipt — serrated bottom edge, a check mark, lines */}
        <P d="M398 70 h84 v88 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 l-6 5 l-6 -5 l-6 5 z" stroke="currentColor" strokeOpacity=".8" strokeWidth="1.25" />
        <P d="M410 90 h60 M410 104 h44 M410 118 h52" stroke="currentColor" strokeOpacity=".28" strokeWidth="1.25" />
        <motion.g animate={{ opacity: phase === 3 ? 1 : 0.25 }} transition={{ duration: 0.4 }}>
          <rect x="452" y="130" width="22" height="16" rx="4" className="fill-accent" />
          <motion.path d="M457 138 l4 4 l8 -8" fill="none" className="stroke-accent-ink" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" key={`ck-${phase}`} initial={{ pathLength: 0 }} animate={{ pathLength: phase === 3 ? 1 : 0 }} transition={{ duration: 0.4, delay: 0.2, ease: EASE }} />
        </motion.g>
        <Fade delay={.7}><text x="398" y="60" className="fill-ink-3" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">RECEIPT · {receiptId || "KPT-0001"}</text></Fade>

        {/* 4 · the bond — beneath everything, a bar that holds the receipts' value */}
        <P d="M40 232 H480" stroke="currentColor" strokeOpacity=".2" strokeWidth="1" />
        <Fade delay={.9}>
          <text x="40" y="222" className="fill-ink-3" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">BOND · ${(bond ?? 74185).toLocaleString("en-US")} · pays if it isn't kept</text>
          <rect x="40" y="240" width="440" height="6" rx="3" className="fill-ink" fillOpacity=".08" />
          <motion.rect x="40" y="240" height="6" rx="3" className="fill-accent" initial={{ width: 0 }} animate={{ width: inView ? greenW - 2 : 0 }} transition={{ duration: 1.2, delay: 1, ease: EASE }} />
          <motion.rect y="240" height="6" rx="3" className="fill-rose" initial={{ x: 40 + greenW, width: 0 }} animate={{ x: 40 + greenW, width: inView ? redW : 0 }} transition={{ duration: 0.6, delay: 2, ease: EASE }} />
          <text x="480" y="262" textAnchor="end" className="fill-rose" fontFamily="var(--font-mono)" fontSize="9">paid out</text>
          <text x="40" y="262" className="fill-ink-3" fontFamily="var(--font-mono)" fontSize="9">at risk</text>
        </Fade>
        {/* receipt → bond tether */}
        <P d="M440 158 V232" stroke="currentColor" strokeOpacity=".2" strokeWidth="1" strokeDasharray="2 4" />
        <P d="M120 148 V232" stroke="currentColor" strokeOpacity=".2" strokeWidth="1" strokeDasharray="2 4" />
      </motion.g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/** RING — Kept-rate as an arc. Monochrome track, tone-coloured value arc, draws on in view. */
export function RateRing({ bp, size = 88, stroke: sw = 5, label }: { bp: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  const frac = bp < 0 ? 0 : bp / 10000;
  const tone = bp < 0 ? "stroke-ink-3" : bp >= 9500 ? "stroke-accent" : bp >= 8000 ? "stroke-amber" : "stroke-rose";
  const trackTone = bp < 0 ? "stroke-ink" : bp >= 9500 ? "stroke-ink" : bp >= 8000 ? "stroke-amber" : "stroke-rose"; // the missing share is the story
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Kept-rate ${bp < 0 ? "no data" : (bp / 100).toFixed(1) + "%"}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} className={trackTone} strokeOpacity={bp >= 0 && bp < 9500 ? 0.22 : 0.08} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" className={tone} strokeDasharray={c}
          initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - frac) }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <div className={`mono ${size >= 100 ? "text-[24px]" : size >= 64 ? "text-[17px]"  : "text-[13px]"} text-ink`}>{bp < 0 ? "—" : `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 1)}%`}</div>
          {label && <div className="label mt-1 !text-[9px]">{label}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** BARS — one pill per receipt, coloured by outcome. Newest right. Draws up in view. */
export function OutcomeBars({ statuses, height = 44, max = 24 }: { statuses: string[]; height?: number; max?: number }) {
  const s = statuses.slice(-max);
  const tone: Record<string, string> = { ACTIVE: "bg-amber", BLOCKED: "bg-rose", FULFILLED: "bg-accent", UPHELD: "bg-ink", DISMISSED: "bg-ink-3" };
  const h: Record<string, number> = { ACTIVE: 0.55, BLOCKED: 0.35, FULFILLED: 1, UPHELD: 0.8, DISMISSED: 0.45 };
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} role="img" aria-label={`${s.length} recent receipts by outcome`}>
      {s.map((st, i) => (
        <motion.span key={i} className={`w-[6px] rounded-full ${tone[st] || "bg-ink-3"}`} style={{ opacity: st === "UPHELD" ? 0.9 : 0.85 }}
          initial={{ height: 4, opacity: 0 }} whileInView={{ height: Math.max(6, height * (h[st] ?? 0.4)), opacity: st === "UPHELD" ? 0.9 : 0.85 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.03, ease: EASE }} title={st} />
      ))}
      {!s.length && <span className="text-[12px] text-ink-3">No receipts yet</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** SPARK — bond over time as a soft line with area, from a series of numbers. */
export function Spark({ values, width = 220, height = 48, tone = "stroke-ink" }: { values: number[]; width?: number; height?: number; tone?: string }) {
  const id = useId();
  if (values.length < 2) values = [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 4 - ((v - min) / span) * (height - 10)] as const);
  const d = pts.map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`)).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" role="img" aria-label="Bond over time">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <motion.path d={`${d} L${last[0]},${height} L2,${height} Z`} fill={`url(#${id})`} className="text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }} />
      <motion.path d={d} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={tone} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} />
      <motion.circle cx={last[0]} cy={last[1]} r="3" className="fill-ink" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1, duration: 0.3 }} style={{ transformOrigin: `${last[0]}px ${last[1]}px` }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/** VALIDATORS — the empty-rail visual: five nodes, one reading at a time, ambient. */
export function ValidatorsIdle({ className = "" }: { className?: string }) {
  const nodes = [-90, -18, 54, 126, 198];
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <g className="text-ink">
        <circle cx="100" cy="60" r="40" fill="none" stroke="currentColor" strokeOpacity=".16" strokeDasharray="2 5" />
        <motion.circle cx="100" cy="60" r="40" fill="none" className="stroke-accent" strokeWidth="1" animate={{ opacity: [0, 0.5, 0], scale: [1, 1.25, 1.25] }} transition={{ duration: 6, repeat: Infinity, ease: "easeOut" }} style={{ transformOrigin: "100px 60px" }} />
        <path d="M84 48 h32 v24 h-32 z M84 48 l16 12 l16 -12" fill="none" stroke="currentColor" strokeOpacity=".6" strokeWidth="1.2" strokeLinejoin="round" />
        {nodes.map((deg, i) => {
          const a = (deg * Math.PI) / 180, cx = 100 + 40 * Math.cos(a), cy = 60 + 40 * Math.sin(a);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5" className="fill-canvas" stroke="currentColor" strokeOpacity=".4" />
              <motion.circle cx={cx} cy={cy} r="2.2" className="fill-accent" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 6, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/** Count-up number for stat cards. */
export function Count({ to, prefix = "", className = "" }: { to: number; prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now(), dur = 900;
    let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); setV(Math.round(to * e)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref} className={`mono tabular-nums ${className}`}>{prefix}{v.toLocaleString("en-US")}</span>;
}

/* ------------------------------------------------------------------ */
/** Step diagrams for /how — one small drawing per step. */
export function StepGlyph({ n, className = "h-16 w-16" }: { n: number; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const draw = (paths: string[], extra?: React.ReactNode) => (
    <svg viewBox="0 0 64 64" className={`${className} text-ink`} aria-hidden>
      <motion.g initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
        {paths.map((d, i) => <motion.path key={i} d={d} {...common} variants={stroke} transition={{ duration: 0.7, ease: EASE }} />)}
        {extra}
      </motion.g>
    </svg>
  );
  switch (n) {
    case 1: // envelope + bond
      return draw(["M10 18 h44 v30 h-44 z", "M10 18 l22 18 l22 -18", "M22 54 h20"], <motion.rect x="22" y="52" width="14" height="4" rx="2" className="fill-accent" variants={{ hidden: { width: 0 }, show: { width: 14 } }} transition={{ duration: 0.6, delay: 0.6, ease: EASE }} />);
    case 2: // check: ring of validators
      return draw(["M32 12 a20 20 0 1 1 -0.01 0", "M24 32 l6 6 l12 -12"], <>{[-90, -18, 54, 126, 198].map((deg, i) => { const a = (deg * Math.PI) / 180; return <motion.circle key={i} cx={32 + 20 * Math.cos(a)} cy={32 + 20 * Math.sin(a)} r="2.5" className="fill-accent" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} transition={{ delay: 0.5 + i * 0.1 }} />; })}</>);
    case 3: // receipt
      return draw(["M16 8 h32 v46 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 z", "M22 20 h20", "M22 28 h14", "M22 36 h18"]);
    case 4: // claim: scales
      return draw(["M32 10 v42", "M14 22 h36", "M14 22 l-6 14 h12 z", "M50 22 l-6 14 h12 z", "M22 52 h20"]);
    case 5: // payout: arrow from bond to person
      return draw(["M8 44 h24", "M8 40 v8", "M40 44 h16", "M50 38 l6 6 l-6 6", "M46 20 a5 5 0 1 1 -0.01 0"], <motion.rect x="8" y="42" height="4" rx="2" className="fill-accent" variants={{ hidden: { width: 0 }, show: { width: 24 } }} transition={{ duration: 0.8, delay: 0.5, ease: EASE }} />);
    default: return null;
  }
}
