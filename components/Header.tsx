"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentPhase, minsToNextPhase, type CircadianPhase } from "@/lib/bioEngine";

export default function Header() {
  const [time, setTime]   = useState<string>("");
  const [date, setDate]   = useState<string>("");
  const [phase, setPhase] = useState<CircadianPhase | null>(null);
  const [minsLeft, setMinsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
      setPhase(getCurrentPhase());
      setMinsLeft(minsToNextPhase());
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(7,5,16,0.88)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, rgba(155,127,212,0.35) 0%, rgba(77,208,196,0.15) 100%)",
            border: "1px solid rgba(155,127,212,0.3)",
          }}
          animate={{ boxShadow: ["0 0 10px rgba(155,127,212,0.2)", "0 0 22px rgba(155,127,212,0.4)", "0 0 10px rgba(155,127,212,0.2)"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(155,127,212,0.9)" }} />
        </motion.div>
        <div>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "1.25rem",
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Human
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              color: "rgba(155,127,212,0.6)",
              marginLeft: "0.5rem",
            }}
          >
            OS v2
          </span>
        </div>
      </div>

      {/* Center — circadian phase */}
      <div className="hidden md:flex items-center gap-3">
        <AnimatePresence mode="wait">
          {phase && (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                border: `1px solid ${phase.color}33`,
                background: `${phase.color}0d`,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase.color }}
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.7rem", letterSpacing: "0.05em", color: `${phase.color}cc` }}>
                {phase.name}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: `${phase.color}55` }}>
                {Math.floor(minsLeft / 60) > 0
                  ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`
                  : `${minsLeft}m`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right — clock + live */}
      <div className="flex items-center gap-5">
        <div className="text-right">
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.75)" }}>
            {time}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>
            {date}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4dd0c4", boxShadow: "0 0 6px #4dd0c4" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.header>
  );
}
