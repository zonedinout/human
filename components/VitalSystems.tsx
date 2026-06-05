"use client";

import { motion } from "framer-motion";
import {
  Heart, Droplets, Utensils, Activity,
  Moon, Zap, Brain, Wind, type LucideIcon
} from "lucide-react";
import { useHealthStore } from "@/lib/store";

const SYSTEMS = [
  { key: "recovery",   label: "RECOVERY",   icon: Heart },
  { key: "hydration",  label: "HYDRATION",  icon: Droplets },
  { key: "nutrition",  label: "NUTRITION",  icon: Utensils },
  { key: "movement",   label: "MOVEMENT",   icon: Activity },
  { key: "sleep",      label: "SLEEP",      icon: Moon },
  { key: "energy",     label: "ENERGY",     icon: Zap },
  { key: "focus",      label: "FOCUS",      icon: Brain },
  { key: "stress",     label: "STRESS",     icon: Wind },
] as const;

type SystemKey = (typeof SYSTEMS)[number]["key"];

function statusLabel(v: number) {
  if (v >= 80) return { text: "OPTIMAL", color: "#00ff88" };
  if (v >= 60) return { text: "STABLE",  color: "#00d4ff" };
  if (v >= 40) return { text: "LOW",     color: "#ffaa00" };
  return              { text: "CRITICAL",color: "#ff3366" };
}

function barColor(v: number) {
  if (v >= 80) return "#00ff88";
  if (v >= 60) return "#00d4ff";
  if (v >= 40) return "#ffaa00";
  return "#ff3366";
}

function SystemCard({ systemKey, label, Icon, index }: {
  systemKey: SystemKey;
  label: string;
  Icon: LucideIcon;
  index: number;
}) {
  const value = useHealthStore((s) => s[systemKey]);
  const color = barColor(value);
  const status = statusLabel(value);
  const segments = 10;
  const filled = Math.round((value / 100) * segments);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.5 }}
      className="glass-card corner-brackets p-3 hover:border-[rgba(0,212,255,0.25)] transition-all duration-300"
      whileHover={{ scale: 1.02 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={12} color={color} />
          <span
            className="font-mono text-[10px] tracking-[0.2em] font-medium"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        <span
          className="font-mono text-[9px] tracking-widest px-1.5 py-0.5"
          style={{
            color: status.color,
            border: `1px solid ${status.color}44`,
            background: `${status.color}11`,
          }}
        >
          {status.text}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: segments }).map((_, i) => (
          <motion.div
            key={i}
            className="progress-segment"
            initial={{ opacity: 0 }}
            animate={{ opacity: i < filled ? 1 : 0.12 }}
            transition={{ delay: 0.3 + index * 0.05 + i * 0.03, duration: 0.3 }}
            style={{
              background: i < filled ? color : "#1a2a3a",
              boxShadow: i < filled ? `0 0 4px ${color}88` : "none",
            }}
          />
        ))}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xl font-bold leading-none"
          style={{ color, textShadow: `0 0 10px ${color}66` }}
        >
          {value}
        </motion.span>
        <span className="font-mono text-[9px] text-[#445566] tracking-widest">%</span>
      </div>
    </motion.div>
  );
}

interface Props {
  slice?: [number, number];
}

export default function VitalSystems({ slice }: Props) {
  const systems = slice ? SYSTEMS.slice(slice[0], slice[1]) : SYSTEMS;

  return (
    <div className="flex flex-col gap-3">
      {systems.map(({ key, label, icon: Icon }, i) => (
        <SystemCard
          key={key}
          systemKey={key}
          label={label}
          Icon={Icon}
          index={i}
        />
      ))}
    </div>
  );
}
