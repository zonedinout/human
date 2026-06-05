"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Coffee, Zap } from "lucide-react";
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

// Window: 5am → 5am next day (24h)
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
        background: isActive ? `${phase.color}28` : `${phase.color}09`,
        borderRight: `1px solid ${phase.color}18`,
        borderTop: isActive ? `2px solid ${phase.color}` : "2px solid transparent",
        flexShrink: 0,
      }}
      animate={{
        background: isActive ? `${phase.color}28` : `${phase.color}09`,
      }}
      transition={{ duration: 0.6 }}
    >
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center px-1"
        >
          <span
            className="font-mono text-[6px] tracking-widest truncate text-center"
            style={{ color: phase.color }}
          >
            {phase.name}
          </span>
        </motion.div>
      )}
      {/* Glow for active */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${phase.color}18 0%, transparent 100%)` }}
        />
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

  const CAFFEINE_LABELS = ["NONE", "LOW", "MODERATE", "HIGH"];
  const CAFFEINE_COLORS = ["#445566", "#00ff88", "#ffaa00", "#ff3366"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7 }}
      className="glass-card corner-brackets p-4 w-full"
      style={{ borderColor: `${phase.color}33`, boxShadow: `0 0 40px ${phase.color}08` }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={11} color={phase.color} />
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">CIRCADIAN TIMELINE</span>
        </div>
        <div className="flex items-center gap-4">
          {clearanceMins !== null && clearanceMins > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5"
            >
              <Coffee size={9} color="#ffaa00" />
              <span className="font-mono text-[8px] text-[#ffaa00] tracking-widest">
                CAFFEINE CLEARS {fmt(clearanceMins)}
              </span>
            </motion.div>
          )}
          <div className="flex items-center gap-1.5">
            <Zap size={9} color={phase.color} />
            <span className="font-mono text-[8px] tracking-widest" style={{ color: `${phase.color}aa` }}>
              NEXT PHASE {fmt(minsLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Timeline bar ── */}
      <div className="relative mb-1">
        <div className="flex h-10 rounded-[2px] overflow-hidden border border-[#0d1e2a]">
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
          <div
            className="w-px h-full"
            style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 0 6px white, 0 0 12px rgba(255,255,255,0.5)" }}
          />
          <div
            className="absolute -top-1 w-2 h-2 rounded-full bg-white"
            style={{ boxShadow: "0 0 8px white, 0 0 16px rgba(255,255,255,0.5)" }}
          />
        </motion.div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mb-4 px-px">
        {["05", "09", "13", "17", "21", "01"].map(t => (
          <span key={t} className="font-mono text-[7px] text-[#1e3040] tracking-widest">{t}:00</span>
        ))}
      </div>

      {/* ── Phase info + stats ── */}
      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              <div
                className="font-mono text-sm font-bold tracking-[0.15em] mb-1"
                style={{ color: phase.color, textShadow: `0 0 20px ${phase.color}55` }}
              >
                {phase.name}
              </div>
              <div className="font-mono text-[10px] text-[#55677a] leading-relaxed tracking-wide">
                {phase.desc}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right stats */}
        <div className="shrink-0 flex flex-col gap-2 text-right">
          <div>
            <div className="font-mono text-[8px] text-[#334455] tracking-[0.2em] mb-0.5">NOW · DO THIS</div>
            <div
              className="font-mono text-[10px] font-bold tracking-wider"
              style={{ color: phase.color }}
            >
              {phase.action}
            </div>
          </div>

          {/* Caffeine effective level */}
          {caffeineLevel > 0 && (
            <div>
              <div className="font-mono text-[8px] text-[#334455] tracking-[0.2em] mb-0.5">CAFFEINE LOAD</div>
              <div
                className="font-mono text-[10px] font-bold tracking-wider"
                style={{ color: CAFFEINE_COLORS[effectiveCaffeine] }}
              >
                {CAFFEINE_LABELS[effectiveCaffeine]}
                {effectiveCaffeine < caffeineLevel && (
                  <span className="text-[8px] text-[#334455] ml-1">(decaying)</span>
                )}
              </div>
            </div>
          )}

          {/* HRV if logged */}
          {hrv !== null && (
            <div>
              <div className="font-mono text-[8px] text-[#334455] tracking-[0.2em] mb-0.5">HRV</div>
              <div
                className="font-mono text-[10px] font-bold tracking-wider"
                style={{ color: hrv > 70 ? "#00ff88" : hrv > 50 ? "#ffaa00" : "#ff3366" }}
              >
                {hrv}ms
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
