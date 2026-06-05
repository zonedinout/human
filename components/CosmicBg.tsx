"use client";

import { motion } from "framer-motion";

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.508) % 100,
  y: (i * 97.31) % 100,
  r: ((i * 53.17) % 100) < 12 ? 1.5 : 1,
  o: 0.15 + ((i * 31.7) % 100) / 280,
}));

export default function CosmicBg() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: "#070510" }}>
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o }}
        />
      ))}

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 700, height: 700, left: "5%", top: "5%",
          background: "radial-gradient(circle, rgba(155,127,212,0.055) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600, right: "0%", top: "15%",
          background: "radial-gradient(circle, rgba(77,208,196,0.04) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, -20, 0], y: [0, 22, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500, left: "35%", bottom: "10%",
          background: "radial-gradient(circle, rgba(212,149,107,0.035) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
        animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
