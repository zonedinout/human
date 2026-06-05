"use client";

import { motion } from "framer-motion";

interface Props {
  score: number;
  projected?: number;
}

function cosmicColor(score: number) {
  if (score >= 80) return "#4dd0c4";
  if (score >= 60) return "#9b7fd4";
  if (score >= 40) return "#d4956b";
  return "#c46b7a";
}

function scoreLabel(score: number) {
  if (score >= 90) return "peak";
  if (score >= 80) return "optimal";
  if (score >= 65) return "stable";
  if (score >= 45) return "compromised";
  return "critical";
}

export default function DigitalTwin({ score, projected }: Props) {
  const color = cosmicColor(score);
  const pulseSpeed = score >= 80 ? 2 : score >= 50 ? 2.8 : 4.5;
  const brightness = 0.5 + score / 200;

  const particles = [0, 1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Core SVG */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 60px ${color}33, 0 0 120px ${color}18, 0 0 200px ${color}0a`, opacity: brightness }}
        />

        <svg width={260} height={260} viewBox="0 0 260 260" style={{ position: "absolute" }}>
          {/* Background rings */}
          <circle cx="130" cy="130" r="120" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.1" />
          <circle cx="130" cy="130" r="100" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.07" />

          {/* Outer rotating ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            style={{ originX: "130px", originY: "130px" }}
          >
            <circle cx="130" cy="130" r="112" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="3 9" />
            <circle cx="130" cy="18" r="3" fill={color} opacity="0.6" />
            <circle cx="242" cy="130" r="2.5" fill={color} opacity="0.4" />
          </motion.g>

          {/* Middle counter-rotating ring */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            style={{ originX: "130px", originY: "130px" }}
          >
            <circle cx="130" cy="130" r="90" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.18" strokeDasharray="10 6" />
            <circle cx="130" cy="40" r="4" fill={color} opacity="0.7" />
            <circle cx="220" cy="130" r="2.5" fill={color} opacity="0.4" />
            <circle cx="130" cy="220" r="3.5" fill={color} opacity="0.55" />
          </motion.g>

          {/* Inner rotating ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ originX: "130px", originY: "130px" }}
          >
            <circle cx="130" cy="130" r="70" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 5" />
            <circle cx="130" cy="60" r="2.5" fill={color} opacity="0.9" />
          </motion.g>

          {/* Core fill */}
          <circle cx="130" cy="130" r="52"
            fill={`${color}08`}
            stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
          <circle cx="130" cy="130" r="38"
            fill={`${color}0d`}
            stroke={color} strokeWidth="0.5" strokeOpacity="0.6" />
        </svg>

        {/* Pulsing core orb */}
        <motion.div
          animate={{ scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: 72, height: 72,
            background: `radial-gradient(circle, ${color}28 0%, ${color}0d 60%, transparent 100%)`,
            boxShadow: `0 0 28px ${color}55, inset 0 0 18px ${color}18`,
            border: `1px solid ${color}66`,
          }}
        >
          <motion.div
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
            className="text-center"
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.6rem",
                color, textShadow: `0 0 18px ${color}`, letterSpacing: "-0.02em",
              }}
            >
              {score}
            </div>
          </motion.div>
        </motion.div>

        {/* Orbiting particles */}
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 7 + i * 2.5, repeat: Infinity, ease: "linear", delay: -i * 1.8 }}
            style={{
              width: 148 + i * 10, height: 148 + i * 10,
              top: "50%", left: "50%",
              marginTop: -(74 + i * 5), marginLeft: -(74 + i * 5),
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: i % 2 === 0 ? 3 : 2.5, height: i % 2 === 0 ? 3 : 2.5,
                background: color, top: 0, left: "50%",
                transform: "translateX(-50%)",
                boxShadow: `0 0 5px ${color}`,
                opacity: 0.3 + (i % 3) * 0.15,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center">
        <motion.div
          key={scoreLabel(score)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "0.35rem" }}
        >
          system status
        </motion.div>
        <motion.div
          key={score}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.4rem",
            color, textShadow: `0 0 14px ${color}66`, letterSpacing: "0.12em",
          }}
        >
          {scoreLabel(score)}
        </motion.div>
        {projected !== undefined && projected !== score && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", marginTop: "0.3rem", letterSpacing: "0.05em", color: projected > score ? "#4dd0c4" : "#c46b7a" }}
          >
            projected {projected > score ? "▲" : "▼"} {projected}
          </motion.div>
        )}
      </div>
    </div>
  );
}
