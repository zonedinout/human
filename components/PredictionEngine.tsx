"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, TrendingUp, Moon, Beef, Zap, type LucideIcon } from "lucide-react";
import { useHealthStore } from "@/lib/store";

interface Scenario {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  calcDelta: (state: ReturnType<typeof useHealthStore.getState>) => number;
}

const SCENARIOS: Scenario[] = [
  {
    id: "sleep",
    icon: Moon,
    label: "SLEEP 8 HOURS",
    description: "Full recovery sleep cycle tonight",
    calcDelta: (s) => {
      const boost = s.sleep < 70 ? 15 : s.sleep < 85 ? 8 : 3;
      return boost;
    },
  },
  {
    id: "protein",
    icon: Beef,
    label: "INCREASE PROTEIN",
    description: "High-protein meals for next 24 hours",
    calcDelta: (s) => {
      const boost = s.nutrition < 60 ? 10 : s.nutrition < 80 ? 5 : 2;
      return boost;
    },
  },
  {
    id: "rest",
    icon: Zap,
    label: "FULL REST DAY",
    description: "Active recovery, zero training stress",
    calcDelta: (s) => {
      const boost = s.recovery < 60 ? 12 : s.recovery < 80 ? 6 : 2;
      return boost;
    },
  },
];

export default function PredictionEngine({
  onProject,
}: {
  onProject: (projected: number | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const state = useHealthStore();

  const handleSelect = (id: string) => {
    if (active === id) {
      setActive(null);
      onProject(null);
      return;
    }
    setActive(id);
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario) {
      const delta = scenario.calcDelta(state);
      onProject(Math.min(100, state.overallScore + delta));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="glass-card corner-brackets p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={12} color="#00d4ff" />
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">
          SIMULATION ENGINE
        </span>
        <div className="ml-auto font-mono text-[8px] tracking-widest text-[#334455]">
          PREDICTIVE MODELING v2
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => {
          const delta = scenario.calcDelta(state);
          const isActive = active === scenario.id;
          const Icon = scenario.icon;
          const color = isActive ? "#00d4ff" : "#8899aa";

          return (
            <motion.button
              key={scenario.id}
              onClick={() => handleSelect(scenario.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative text-left p-4 transition-all duration-300 corner-brackets"
              style={{
                background: isActive ? "rgba(0,212,255,0.08)" : "rgba(8,15,20,0.6)",
                border: `1px solid ${isActive ? "rgba(0,212,255,0.4)" : "rgba(26,42,58,0.8)"}`,
                boxShadow: isActive ? "0 0 20px rgba(0,212,255,0.15)" : "none",
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeScenario"
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, transparent 100%)",
                  }}
                />
              )}

              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-7 h-7 flex items-center justify-center"
                  style={{
                    border: `1px solid ${color}44`,
                    background: `${color}11`,
                  }}
                >
                  <Icon size={12} color={color} />
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1"
                    >
                      <TrendingUp size={10} color="#00ff88" />
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: "#00ff88", textShadow: "0 0 8px #00ff8888" }}
                      >
                        +{delta}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="font-mono text-[10px] font-bold tracking-[0.15em] mb-1"
                style={{ color }}
              >
                {scenario.label}
              </div>
              <div className="font-mono text-[9px] text-[#445566] leading-relaxed mb-3">
                {scenario.description}
              </div>

              {/* Score delta display */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#334455]">
                  {state.overallScore}
                </span>
                <div className="flex-1 h-px bg-[#1a2a3a]" />
                <span
                  className="font-mono text-[9px] font-bold"
                  style={{ color: "#00ff88" }}
                >
                  {Math.min(100, state.overallScore + delta)}
                </span>
              </div>
              <div className="flex justify-center mt-1">
                <span
                  className="font-mono text-[8px] tracking-widest"
                  style={{ color: isActive ? "#00ff88" : "#334455" }}
                >
                  {isActive ? "SIMULATING" : `▲ +${delta} pts`}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
