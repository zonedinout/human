"use client";

import { motion } from "framer-motion";
import {
  Heart, Droplets, Utensils, Activity,
  Moon, Zap, Brain, Wind, type LucideIcon
} from "lucide-react";
import { useHealthStore } from "@/lib/store";

const SYSTEMS = [
  { key: "recovery",  label: "recovery",  icon: Heart    },
  { key: "hydration", label: "hydration", icon: Droplets },
  { key: "nutrition", label: "nutrition", icon: Utensils },
  { key: "movement",  label: "movement",  icon: Activity },
  { key: "sleep",     label: "sleep",     icon: Moon     },
  { key: "energy",    label: "energy",    icon: Zap      },
  { key: "focus",     label: "focus",     icon: Brain    },
  { key: "stress",    label: "stress",    icon: Wind     },
] as const;

type SystemKey = (typeof SYSTEMS)[number]["key"];

function cosmicColor(v: number) {
  if (v >= 80) return "#4dd0c4";
  if (v >= 60) return "#9b7fd4";
  if (v >= 40) return "#d4956b";
  return "#c46b7a";
}

function statusLabel(v: number) {
  if (v >= 80) return "optimal";
  if (v >= 60) return "good";
  if (v >= 40) return "low";
  return "critical";
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 3)  return <span style={{ fontSize: "0.6rem", color: "#4dd0c4", opacity: 0.7 }}>↑</span>;
  if (trend < -3) return <span style={{ fontSize: "0.6rem", color: "#c46b7a", opacity: 0.7 }}>↓</span>;
  return <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.15)" }}>—</span>;
}

function SystemCard({ systemKey, label, Icon, index }: {
  systemKey: SystemKey;
  label: string;
  Icon: LucideIcon;
  index: number;
}) {
  const value   = useHealthStore(s => s[systemKey]);
  const history = useHealthStore(s => s.history);
  const color   = cosmicColor(value);
  const status  = statusLabel(value);

  const yest = history.find(h => h.date === yesterdayStr());
  const trend = yest && (systemKey in yest)
    ? value - (yest as unknown as Record<string, number>)[systemKey]
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 + index * 0.05, duration: 0.5, ease: "easeOut" }}
      className="cosmic-card p-3"
      whileHover={{ borderColor: `${color}22`, boxShadow: `0 0 24px ${color}10` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Icon size={10} color={color} strokeWidth={1.5} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)" }}>
            {label}
          </span>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem",
          letterSpacing: "0.08em", color: `${color}99`,
          padding: "1px 6px", border: `1px solid ${color}25`, borderRadius: "20px",
          background: `${color}0d`,
        }}>
          {status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-0.5 rounded-full mb-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.2 + index * 0.04, duration: 0.8, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}55` }}
        />
      </div>

      {/* Value + trend */}
      <div className="flex items-baseline justify-between">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "1.1rem", color, letterSpacing: "-0.01em" }}
        >
          {value}
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginLeft: "2px" }}>%</span>
        </motion.span>
        <TrendArrow trend={trend} />
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
    <div className="flex flex-col gap-2.5">
      {systems.map(({ key, label, icon: Icon }, i) => (
        <SystemCard key={key} systemKey={key} label={label} Icon={Icon} index={i} />
      ))}
    </div>
  );
}
