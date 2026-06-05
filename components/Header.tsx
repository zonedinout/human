"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentPhase, minsToNextPhase, type CircadianPhase } from "@/lib/bioEngine";

export default function Header() {
  const [time, setTime]  = useState<string>("");
  const [date, setDate]  = useState<string>("");
  const [phase, setPhase] = useState<CircadianPhase | null>(null);
  const [minsLeft, setMinsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase());
      setPhase(getCurrentPhase());
      setMinsLeft(minsToNextPhase());
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between px-6 py-3.5 border-b border-[#0d1e2a]"
      style={{ background: "rgba(5,10,14,0.97)", backdropFilter: "blur(24px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <motion.div
            className="w-8 h-8 border border-[#00d4ff] flex items-center justify-center"
            style={{ boxShadow: "0 0 12px #00d4ff33" }}
            animate={{ boxShadow: ["0 0 8px #00d4ff33", "0 0 18px #00d4ff55", "0 0 8px #00d4ff33"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-3 h-3 bg-[#00d4ff]" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          </motion.div>
        </div>
        <div>
          <span
            className="font-mono text-xl font-bold text-white tracking-[0.2em]"
            style={{ textShadow: "0 0 20px rgba(0,212,255,0.5)" }}
          >
            HUMAN OS
          </span>
          <span
            className="ml-2 font-mono px-1.5 py-0.5 border border-[#00d4ff33] text-[#00d4ff] align-middle"
            style={{ fontSize: "0.58rem", letterSpacing: "0.15em" }}
          >
            v2.0
          </span>
        </div>
      </div>

      {/* Center — circadian phase chip */}
      <div className="hidden md:flex items-center gap-3">
        <div className="w-px h-5 bg-[#0d1e2a]" />
        <AnimatePresence mode="wait">
          {phase && (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                border: `1px solid ${phase.color}44`,
                background: `${phase.color}0a`,
                boxShadow: `0 0 16px ${phase.color}18`,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase.color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="font-mono text-[9px] font-bold tracking-[0.2em]" style={{ color: phase.color }}>
                {phase.name}
              </span>
              <span className="font-mono text-[8px] tracking-widest" style={{ color: phase.color + "66" }}>
                {Math.floor(minsLeft / 60) > 0
                  ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`
                  : `${minsLeft}m`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-px h-5 bg-[#0d1e2a]" />
      </div>

      {/* Right — clock */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-sm font-bold tracking-widest" style={{ color: "#ccd8e0" }}>{time}</div>
          <div className="font-mono text-[10px] text-[#334455] tracking-widest">{date}</div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#00ff88]"
            style={{ boxShadow: "0 0 6px #00ff88" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-mono text-[10px] text-[#00ff88] tracking-widest uppercase">LIVE</span>
        </div>
      </div>
    </motion.header>
  );
}
