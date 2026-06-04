"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, TrendingUp, TrendingDown } from "lucide-react";
import { useHealthStore } from "@/lib/store";

interface Scenario {
  id: string;
  label: string;
  desc: string;
  apply: (score: number) => number;
}

const SCENARIOS: Scenario[] = [
  {
    id: "sleep8",
    label: "SLEEP 8 HOURS",
    desc: "Full sleep cycle. HRV normalises. Recovery peaks.",
    apply: (s) => Math.min(100, s + 12),
  },
  {
    id: "protein",
    label: "INCREASE PROTEIN",
    desc: "Muscle protein synthesis accelerates. Energy improves.",
    apply: (s) => Math.min(100, s + 7),
  },
  {
    id: "rest",
    label: "FULL REST DAY",
    desc: "CNS recovery. Inflammation reduces. Adaptation occurs.",
    apply: (s) => Math.min(100, s + 10),
  },
  {
    id: "walk",
    label: "WALK 10,000 STEPS",
    desc: "NEAT increases. Blood glucose stabilises.",
    apply: (s) => Math.min(100, s + 5),
  },
  {
    id: "dehydrated",
    label: "SKIP WATER TODAY",
    desc: "Cognitive decline. Heart rate elevation. Fatigue.",
    apply: (s) => Math.max(0, s - 15),
  },
  {
    id: "noSleep",
    label: "SLEEP 4 HOURS",
    desc: "Cortisol spikes. Recovery collapses. Performance tanks.",
    apply: (s) => Math.max(0, s - 22),
  },
];

export default function PredictionEngine() {
  const overallScore = useHealthStore((s) => s.overallScore);
  const [hovered, setHovered] = useState<string | null>(null);

  const getProjected = (scenario: Scenario) => scenario.apply(overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="glass-card corner-brackets p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu size={12} color="#00d4ff" />
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">
          PREDICTION ENGINE — SIMULATE DECISIONS
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SCENARIOS.map((s, i) => {
          const projected = getProjected(s);
          const delta = projected - overallScore;
          const isPositive = delta > 0;
          const isHovered = hovered === s.id;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              whileHover={{ scale: 1.04, y: -2 }}
              onHoverStart={() => setHovered(s.id)}
              onHoverEnd={() => setHovered(null)}
              className="corner-brackets p-3 cursor-default transition-all duration-300"
              style={{
                background: isHovered
                  ? `rgba(${isPositive ? "0,212,255" : "255,51,102"},0.08)`
                  : "rgba(8,15,20,0.6)",
                border: `1px solid ${isHovered
                  ? (isPositive ? "rgba(0,212,255,0.3)" : "rgba(255,51,102,0.3)")
                  : "rgba(0,212,255,0.1)"}`,
              }}
            >
              <div
                className="font-mono text-[9px] font-bold tracking-widest mb-2"
                style={{ color: isPositive ? "#00d4ff" : "#ff3366" }}
              >
                {s.label}
              </div>
              <div className="font-mono text-[9px] text-[#445566] leading-relaxed mb-3">
                {s.desc}
              </div>
              <div className="flex items-center gap-1">
                {isPositive
                  ? <TrendingUp size={10} color="#00ff88" />
                  : <TrendingDown size={10} color="#ff3366" />
                }
                <span
                  className="font-mono text-sm font-bold"
                  style={{
                    color: isPositive ? "#00ff88" : "#ff3366",
                    textShadow: `0 0 8px ${isPositive ? "#00ff88" : "#ff3366"}88`,
                  }}
                >
                  {isPositive ? "+" : ""}{delta}
                </span>
                <span className="font-mono text-[9px] text-[#334455]">pts</span>
              </div>
              <motion.div
                animate={{ width: isHovered ? "100%" : "0%" }}
                className="mt-2 h-px"
                style={{ background: isPositive ? "#00d4ff" : "#ff3366" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
