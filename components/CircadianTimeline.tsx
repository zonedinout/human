"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee } from "lucide-react";
import {
  CIRCADIAN_PHASES,
  getCurrentPhase,
  minsToNextPhase,
  calcCaffeineDecay,
  caffeineClearanceMins,
  type CircadianPhase,
} from "@/lib/bioEngine";
import { useHealthStore } from "@/lib/store";

function fmt(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

const WIN_START = 5;
const WIN_TOTAL = 24;

function phaseWidthPct(p: CircadianPhase): number {
  return ((p.endH - p.startH) / WIN_TOTAL) * 100;
}

function nowPct(): number {
  const now = new Date();
  const raw = now.getHours() + now.getMinutes() / 60;
  const h = raw < 5 ? raw + 24 : raw;
  return Math.min(99.5, Math.max(0.5, ((h - WIN_START) / WIN_TOTAL) * 100));
}

function PhaseSegment({ phase, isActive }: { phase: CircadianPhase; isActive: boolean }) {
  const width = phaseWidthPct(phase);
  return (
    <motion.div
      className="relative h-full flex items-center justify-center overflow-hidden"
      style={{
        width: `${width}%`,
        background: isActive ? `${phase.color}22` : `${phase.color}07`,
        borderRight: `1px solid rgba(255,255,255,0.04)`,
        flexShrink: 0,
      }}
      animate={{ background: isActive ? `${phase.color}22` : `${phase.color}07` }}
      transition={{ duration: 0.8 }}
    >
      {isActive && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${phase.color}88, transparent)` }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center px-1"
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.08em", color: `${phase.color}bb`, textTransform: "uppercase" }}>
              {phase.name}
            </span>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default function CircadianTimeline() {
  const [phase, setPhase] = useState<CircadianPhase>(getCurrentPhase());
  const [minsLeft, setMinsLeft] = useState(minsToNextPhase());
  const [cursorPct, setCursorPct] = useState(nowPct());

  const caffeineLevel    = useHealthStore(s => s.caffeineLevel);
  const caffeineLoggedAt = useHealthStore(s => s.caffeineLoggedAt);
  const hrv              = useHealthStore(s => s.hrv);

  const [effectiveCaffeine, setEffectiveCaffeine] = useState(
    calcCaffeineDecay(caffeineLevel, caffeineLoggedAt)
  );
  const [clearanceMins, setClearanceMins] = useState<number | null>(
    caffeineClearanceMins(caffeineLevel, caffeineLoggedAt)
  );

  useEffect(() => {
    const tick = () => {
      setPhase(getCurrentPhase());
      setMinsLeft(minsToNextPhase());
      setCursorPct(nowPct());
      setEffectiveCaffeine(calcCaffeineDecay(caffeineLevel, caffeineLoggedAt));
      setClearanceMins(caffeineClearanceMins(caffeineLevel, caffeineLoggedAt));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [caffeineLevel, caffeineLoggedAt]);

  const CAFFEINE_LABELS = ["none", "low", "moderate", "high"];
  const CAFFEINE_COLORS = ["rgba(255,255,255,0.2)", "#4dd0c4", "#d4956b", "#c46b7a"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7 }}
      className="cosmic-card p-4 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: phase.color }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            circadian
          </span>
        </div>
        <div className="flex items-center gap-4">
          {clearanceMins !== null && clearanceMins > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
              <Coffee size={9} color="#d4956b" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "#d4956b", letterSpacing: "0.05em" }}>
                caffeine clears in {fmt(clearanceMins)}
              </span>
            </motion.div>
          )}
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: `${phase.color}77`, letterSpacing: "0.05em" }}>
            next phase {fmt(minsLeft)}
          </span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative mb-1">
        <div className="flex h-9 overflow-hidden" style={{ borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
          {CIRCADIAN_PHASES.map(p => (
            <PhaseSegment key={p.id} phase={p} isActive={p.id === phase.id} />
          ))}
        </div>

        {/* Now cursor */}
        <motion.div
          className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${cursorPct}%`, transform: "translateX(-50%)", zIndex: 10 }}
          animate={{ left: `${cursorPct}%` }}
          transition={{ duration: 1, ease: "linear" }}
        >
          <div className="w-px h-full" style={{ background: "rgba(255,255,255,0.8)", boxShadow: "0 0 5px rgba(255,255,255,0.5)" }} />
          <div className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-white" style={{ boxShadow: "0 0 6px white" }} />
        </motion.div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mb-4 px-px">
        {["05", "09", "13", "17", "21", "01"].map(t => (
          <span key={t} style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.12)", letterSpacing: "0.05em" }}>
            {t}:00
          </span>
        ))}
      </div>

      {/* Phase info + stats */}
      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.15rem",
                color: phase.color, textShadow: `0 0 16px ${phase.color}44`,
                letterSpacing: "0.06em", marginBottom: "0.35rem",
              }}>
                {phase.name}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {phase.desc}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 flex flex-col gap-2.5 text-right">
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.2rem" }}>
              do this now
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.68rem", color: phase.color, letterSpacing: "0.03em" }}>
              {phase.action}
            </div>
          </div>

          {caffeineLevel > 0 && (
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                caffeine
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.68rem", color: CAFFEINE_COLORS[effectiveCaffeine] }}>
                {CAFFEINE_LABELS[effectiveCaffeine]}
                {effectiveCaffeine < caffeineLevel && (
                  <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.2)", marginLeft: "0.3rem" }}>decaying</span>
                )}
              </div>
            </div>
          )}

          {hrv !== null && (
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                HRV
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.68rem", color: hrv > 70 ? "#4dd0c4" : hrv > 50 ? "#d4956b" : "#c46b7a" }}>
                {hrv}ms
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
