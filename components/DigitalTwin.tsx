"use client";

import { useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";

interface Props {
  score: number;
  projected?: number;
}

function scoreColor(score: number) {
  if (score >= 80) return "#00d4ff";
  if (score >= 50) return "#ffaa00";
  return "#ff3366";
}

function scoreGlow(score: number) {
  const c = scoreColor(score);
  return `0 0 60px ${c}44, 0 0 120px ${c}22, 0 0 200px ${c}11`;
}

function scoreLabel(score: number) {
  if (score >= 90) return "PEAK";
  if (score >= 80) return "OPTIMAL";
  if (score >= 65) return "STABLE";
  if (score >= 45) return "COMPROMISED";
  return "CRITICAL";
}

export default function DigitalTwin({ score, projected }: Props) {
  const color = scoreColor(score);
  const pulseSpeed = score >= 80 ? 1.8 : score >= 50 ? 2.5 : 4;
  const brightness = 0.5 + score / 200;

  const particles = [0, 1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Core SVG */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: scoreGlow(score), opacity: brightness }}
        />

        <svg width={280} height={280} viewBox="0 0 280 280" style={{ position: "absolute" }}>
          {/* Background rings */}
          <circle cx="140" cy="140" r="130" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
          <circle cx="140" cy="140" r="110" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.1" />

          {/* Outer rotating ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ originX: "140px", originY: "140px" }}
          >
            <circle cx="140" cy="140" r="120" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.3"
              strokeDasharray="4 8" />
            <circle cx="140" cy="20" r="4" fill={color} opacity="0.8" />
            <circle cx="260" cy="140" r="3" fill={color} opacity="0.6" />
          </motion.g>

          {/* Middle counter-rotating ring */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ originX: "140px", originY: "140px" }}
          >
            <circle cx="140" cy="140" r="98" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.25"
              strokeDasharray="12 6" />
            <circle cx="140" cy="42" r="5" fill={color} opacity="0.9" />
            <circle cx="238" cy="140" r="3" fill={color} opacity="0.5" />
            <circle cx="140" cy="238" r="4" fill={color} opacity="0.7" />
          </motion.g>

          {/* Inner rotating ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            style={{ originX: "140px", originY: "140px" }}
          >
            <circle cx="140" cy="140" r="76" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.4"
              strokeDasharray="2 4" />
            <circle cx="140" cy="64" r="3" fill={color} opacity="1" />
          </motion.g>

          {/* Core background */}
          <circle cx="140" cy="140" r="58"
            fill={`rgba(${score >= 80 ? "0,212,255" : score >= 50 ? "255,170,0" : "255,51,102"},0.05)`}
            stroke={color} strokeWidth="1" strokeOpacity="0.5" />

          {/* Core inner */}
          <circle cx="140" cy="140" r="44"
            fill={`rgba(${score >= 80 ? "0,212,255" : score >= 50 ? "255,170,0" : "255,51,102"},0.08)`}
            stroke={color} strokeWidth="0.5" strokeOpacity="0.8" />

          {/* Hex lines */}
          <line x1="140" y1="82" x2="140" y2="96" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
          <line x1="140" y1="184" x2="140" y2="198" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
          <line x1="82" y1="140" x2="96" y2="140" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
          <line x1="184" y1="140" x2="198" y2="140" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
        </svg>

        {/* Pulsing core orb */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${color}33 0%, ${color}11 60%, transparent 100%)`,
            boxShadow: `0 0 30px ${color}66, inset 0 0 20px ${color}22`,
            border: `1px solid ${color}88`,
          }}
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
            className="text-center"
          >
            <div
              className="font-mono font-bold text-3xl leading-none"
              style={{ color, textShadow: `0 0 20px ${color}` }}
            >
              {score}
            </div>
          </motion.div>
        </motion.div>

        {/* Orbiting energy particles */}
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: -i * 1.5,
            }}
            style={{
              width: 160 + i * 10,
              height: 160 + i * 10,
              top: "50%",
              left: "50%",
              marginTop: -(80 + i * 5),
              marginLeft: -(80 + i * 5),
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: i % 2 === 0 ? 4 : 3,
                height: i % 2 === 0 ? 4 : 3,
                background: color,
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: `0 0 6px ${color}`,
                opacity: 0.4 + (i % 3) * 0.2,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Status label */}
      <div className="text-center">
        <motion.div
          key={scoreLabel(score)}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-xs tracking-[0.3em] mb-1"
          style={{ color: `${color}99` }}
        >
          SYSTEM STATUS
        </motion.div>
        <motion.div
          key={score}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono text-lg font-bold tracking-[0.2em]"
          style={{ color, textShadow: `0 0 15px ${color}88` }}
        >
          {scoreLabel(score)}
        </motion.div>
        {projected !== undefined && projected !== score && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-xs mt-1 tracking-widest"
            style={{ color: projected > score ? "#00ff88" : "#ff3366" }}
          >
            PROJECTED: {projected > score ? "▲" : "▼"} {projected}
          </motion.div>
        )}
      </div>
    </div>
  );
}
