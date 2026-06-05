"use client";

import { motion } from "framer-motion";
import {
  Heart, Droplets, Utensils, Activity,
  Moon, Zap, Brain, Wind, type LucideIcon
} from "lucide-react";
import { useHealthStore } from "@/lib/store";

const SYSTEMS = [
  { key: "recovery",  label: "RECOVERY",  icon: Heart    },
  { key: "hydration", label: "HYDRATION", icon: Droplets },
  { key: "nutrition", label: "NUTRITION", icon: Utensils },
  { key: "movement",  label: "MOVEMENT",  icon: Activity },
  { key: "sleep",     label: "SLEEP",     icon: Moon     },
  { key: "energy",    label: "ENERGY",    icon: Zap      },
  { key: "focus",     label: "FOCUS",     icon: Brain    },
  { key: "stress",    label: "STRESS",    icon: Wind     },
] as const;

type SystemKey = (typeof SYSTEMS)[number]["key"];

function statusLabel(v: number) {
  if (v >= 80) return { text: "OPTIMAL",  color: "#00ff88" };
  if (v >= 60) return { text: "STABLE",   color: "#00d4ff" };
  if (v >= 40) return { text: "LOW",      color: "#ffaa00" };
  return              { text: "CRITICAL", color: "#ff3366" };
}

function barColor(v: number) {
  if (v >= 80) return "#00ff88";
  if (v >= 60) return "#00d4ff";
  if (v >= 40) return "#ffaa00";
  return "#ff3366";
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 3)  return <span className="font-mono text-[9px]" style={{ color: "#00ff88" }}>↑</span>;
  if (trend < -3) return <span className="font-mono text-[9px]" style={{ color: "#ff3366" }}>↓</span>;
  return <span className="font-mono text-[9px]" style={{ color: "#334455" }}>→</span>;
}

function SystemCard({ systemKey, label, Icon, index }: {
  systemKey: SystemKey;
  label: string;
  Icon: LucideIcon;
  index: number;
}) {
  const value   = useHealthStore(s => s[systemKey]);
  const history = useHealthStore(s => s.history);
  const color   = barColor(value);
  const status  = statusLabel(value);
  const isCritical = value < 40;
  const segments = 10;
  const filled   = Math.round((value / 100) * segments);

  // Trend vs yesterday
  const yest = history.find(h => h.date === yesterdayStr());
  const trend = yest && (systemKey in yest)
    ? value - (yest as unknown as Record<string, number>)[systemKey]
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.5 }}
      className={`glass-card corner-brackets p-3 transition-all duration-300 ${isCritical ? "critical-pulse" : ""}`}
      style={{
        boxShadow: isCritical
          ? "0 0 20px rgba(255,51,102,0.12)"
          : "none",
      }}
      whileHover={{
        scale: 1.02,
        borderColor: color + "40",
        boxShadow: `0 0 20px ${color}18`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={11} color={color} />
          <span className="font-mono text-[10px] tracking-[0.2em] font-medium" style={{ color }}>
            {label}
          </span>
        </div>
        <span
          className="font-mono text-[8px] tracking-widest px-1.5 py-0.5"
          style={{
            color: status.color,
            border: `1px solid ${status.color}33`,
            background: `${status.color}10`,
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
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: i < filled ? 1 : 0.1, scaleY: 1 }}
            transition={{ delay: 0.25 + index * 0.04 + i * 0.025, duration: 0.3 }}
            style={{
              background: i < filled ? color : "#1a2a3a",
              boxShadow: i < filled ? `0 0 5px ${color}77` : "none",
            }}
          />
        ))}
      </div>

      {/* Value + trend */}
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-xl font-bold leading-none"
          style={{ color, textShadow: `0 0 12px ${color}66` }}
        >
          {value}
        </motion.span>
        <span className="font-mono text-[9px] text-[#445566] tracking-widest">%</span>
        <div className="ml-auto">
          <TrendArrow trend={trend} />
        </div>
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
        <SystemCard key={key} systemKey={key} label={label} Icon={Icon} index={i} />
      ))}
    </div>
  );
}
