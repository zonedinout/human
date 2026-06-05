"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthStore } from "@/lib/store";

const MESSAGES = [
  "All systems calibrated.",
  "Processing biometric data...",
  "Recovery protocols active.",
  "Monitoring circadian rhythms.",
  "Predictive analysis running.",
  "Health vectors in sync.",
];

export default function StatusBar() {
  const overallScore = useHealthStore((s) => s.overallScore);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const scoreColor =
    overallScore >= 80 ? "#4dd0c4" : overallScore >= 60 ? "#9b7fd4" : overallScore >= 40 ? "#d4956b" : "#c46b7a";

  return (
    <div
      className="flex items-center justify-between px-6 py-1.5"
      style={{
        background: "rgba(7,5,16,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-1 rounded-full"
          style={{ background: scoreColor, boxShadow: `0 0 4px ${scoreColor}` }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={msgIndex}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.5 }}
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.05em", color: "rgba(255,255,255,0.2)" }}
          >
            {MESSAGES[msgIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em" }}>
          score
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.65rem", color: scoreColor, letterSpacing: "0.05em" }}>
          {overallScore}
        </span>
      </div>
    </div>
  );
}
