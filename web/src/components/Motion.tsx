"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Enter: rise 8px + blur-in. Exit softer. Used for receipts and verdict rows only. */
export function Rise({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 8, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 4, filter: "blur(4px)" }} transition={{ duration: 0.24, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Text that swaps with a blur crossfade when `value` changes (status words, step lines). */
export function Swap({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`relative inline-grid ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="col-start-1 row-start-1" initial={{ opacity: 0, filter: "blur(4px)", y: 2 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(4px)", y: -2 }} transition={{ duration: 0.2, ease: EASE }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A shimmering status line that steps through messages while something is pending. */
export function Thinking({ steps, active, intervalMs = 2200 }: { steps: string[]; active: boolean; intervalMs?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) { setI(0); return; }
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), intervalMs);
    return () => clearInterval(t);
  }, [active, steps.length, intervalMs]);
  if (!active) return null;
  return <span className="shimmer text-[13px]"><Swap value={steps[i]} /></span>;
}

export { AnimatePresence, motion };
