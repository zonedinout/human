"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Beef, Zap, TrendingUp, type LucideIcon } from "lucide-react";
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
    label: "Sleep 8 hours",
    description: "Full recovery sleep cycle tonight",
    calcDelta: (s) => s.sleep < 70 ? 15 : s.sleep < 85 ? 8 : 3,
  },
  {
    id: "protein",
    icon: Beef,
    label: "Increase protein",
    description: "High-protein meals for the next 24 hours",
    calcDelta: (s) => s.nutrition < 60 ? 10 : s.nutrition < 80 ? 5 : 2,
  },
  {
    id: "rest",
    icon: Zap,
    label: "Full rest day",
    description: "Active recovery, zero training stress",
    calcDelta: (s) => s.recovery < 60 ? 12 : s.recovery < 80 ? 6 : 2,
  },
];

export default function PredictionEngine({ onProject }: { onProject: (projected: number | null) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const state = useHealthStore();

  const handleSelect = (id: string) => {
    if (active === id) { setActive(null); onProject(null); return; }
    setActive(id);
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (scenario) onProject(Math.min(100, state.overallScore + scenario.calcDelta(state)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="cosmic-card p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-1 rounded-full" style={{ background: "#9b7fd4" }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          simulation
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.12)", marginLeft: "auto", letterSpacing: "0.05em" }}>
          what if?
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => {
          const delta = scenario.calcDelta(state);
          const isActive = active === scenario.id;
          const Icon = scenario.icon;
          const accentColor = isActive ? "#9b7fd4" : "rgba(255,255,255,0.2)";

          return (
            <motion.button
              key={scenario.id}
              onClick={() => handleSelect(scenario.id)}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="relative text-left p-4 rounded-xl"
              style={{
                background: isActive ? "rgba(155,127,212,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? "rgba(155,127,212,0.3)" : "rgba(255,255,255,0.05)"}`,
                boxShadow: isActive ? "0 0 24px rgba(155,127,212,0.12)" : "none",
                transition: "all 0.25s ease",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeScenario"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg, rgba(155,127,212,0.06) 0%, transparent 100%)" }}
                />
              )}

              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{
                    border: `1px solid ${accentColor}44`,
                    background: isActive ? "rgba(155,127,212,0.12)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Icon size={12} color={accentColor} strokeWidth={1.5} />
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1"
                    >
                      <TrendingUp size={10} color="#4dd0c4" />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.85rem", color: "#4dd0c4" }}>
                        +{delta}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1rem",
                letterSpacing: "0.04em", color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                marginBottom: "0.3rem",
              }}>
                {scenario.label}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.4, marginBottom: "0.75rem" }}>
                {scenario.description}
              </div>

              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>
                  {state.overallScore}
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.6rem", color: "#4dd0c4" }}>
                  {Math.min(100, state.overallScore + delta)}
                </span>
              </div>
              <div className="text-center mt-1.5">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.08em", color: isActive ? "#9b7fd4" : "rgba(255,255,255,0.12)" }}>
                  {isActive ? "simulating..." : `▲ +${delta} pts`}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
