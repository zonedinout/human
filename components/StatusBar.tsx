"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthStore } from "@/lib/store";

const MESSAGES = [
  "SYSTEM OPTIMAL — ALL SUBSYSTEMS NOMINAL",
  "PROCESSING BIOMETRIC DATA...",
  "NEURAL SYNC COMPLETE",
  "RUNNING PREDICTIVE ANALYSIS...",
  "HEALTH VECTORS CALIBRATED",
  "MONITORING ACTIVE — 847 DATAPOINTS/MIN",
  "RECOVERY PROTOCOLS ENGAGED",
];

export default function StatusBar() {
  const overallScore = useHealthStore((s) => s.overallScore);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const statusColor =
    overallScore >= 80 ? "#00ff88" : overallScore >= 50 ? "#ffaa00" : "#ff3366";
  const statusText =
    overallScore >= 80 ? "SYSTEM OPTIMAL" : overallScore >= 50 ? "MONITORING" : "ALERT";

  return (
    <div
      className="flex items-center justify-between px-6 py-1.5 border-b border-[#0a1520]"
      style={{ background: "rgba(8,15,20,0.9)", fontSize: "10px" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span
          className="font-mono tracking-widest"
          style={{ color: statusColor, textShadow: `0 0 8px ${statusColor}88` }}
        >
          ● {statusText}
        </span>
        <span className="font-mono text-[#1a2a3a]">│</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={msgIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[#445566] tracking-widest"
          >
            {MESSAGES[msgIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 font-mono text-[#334455] tracking-widest">
        <span>CPU: <span className="text-[#00d4ff]">12%</span></span>
        <span>MEM: <span className="text-[#00d4ff]">2.1GB</span></span>
        <span>NET: <span className="text-[#00ff88]">SECURE</span></span>
        <span>BUILD <span className="text-[#00d4ff]">2025.06.04</span></span>
      </div>
    </div>
  );
}
