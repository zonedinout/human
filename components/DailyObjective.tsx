"use client";

import { motion } from "framer-motion";
import { Target, ChevronRight } from "lucide-react";
import { useHealthStore } from "@/lib/store";

const OBJECTIVES: Record<string, { desc: string; impact: number }> = {
  hydration:  { desc: "Dehydration impairs cognition, recovery, and performance.", impact: 8 },
  sleep:      { desc: "Sleep debt detected. Early sleep maximises recovery.", impact: 12 },
  recovery:   { desc: "Recovery incomplete. Rest accelerates adaptation.", impact: 10 },
  nutrition:  { desc: "Protein intake limiting performance gains.", impact: 7 },
  movement:   { desc: "Movement target not reached today.", impact: 5 },
  energy:     { desc: "Low energy. Prioritise sleep quality and nutrition.", impact: 9 },
  focus:      { desc: "Focus declining. Schedule a recovery block.", impact: 6 },
  stress:     { desc: "Stress accumulating. Active recovery recommended.", impact: 7 },
};

export default function DailyObjective() {
  const state = useHealthStore();

  const keys = ["hydration", "sleep", "recovery", "nutrition", "movement", "energy", "focus", "stress"] as const;
  type ScoreKey = typeof keys[number];
  const lowestKey: ScoreKey = [...keys].sort((a, b) => state[a] - state[b])[0];

  const obj = OBJECTIVES[lowestKey];
  const value = state[lowestKey];

  // Build personalised action label
  const getAction = (): string => {
    if (lowestKey === "hydration") {
      const remaining = Math.max(0, state.hydrationTargetL - state.hydrationLitres);
      return remaining > 0
        ? `DRINK ${remaining.toFixed(1)}L MORE WATER`
        : "HYDRATION TARGET MET";
    }
    if (lowestKey === "sleep") {
      const target = state.profile
        ? state.profile.age < 26 ? "21:30" : state.profile.age < 36 ? "22:00" : "22:30"
        : "22:30";
      return `SLEEP BEFORE ${target}`;
    }
    if (lowestKey === "recovery") return "RECOVER TODAY — NO TRAINING";
    if (lowestKey === "nutrition") {
      const proteinG = state.profile
        ? Math.round(state.profile.weightKg * (state.profile.goal === "performance" ? 2.2 : state.profile.goal === "composition" ? 2.0 : 1.6))
        : 160;
      return `HIT ${proteinG}G PROTEIN TODAY`;
    }
    if (lowestKey === "movement") return "WALK 10 MINUTES — MOVE YOUR BODY";
    if (lowestKey === "energy")   return "PRIORITISE SLEEP QUALITY";
    if (lowestKey === "focus")    return "REDUCE COGNITIVE LOAD";
    if (lowestKey === "stress")   return "ACTIVE RECOVERY SESSION";
    return "MAINTAIN CURRENT PROTOCOLS";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="glass-card-elevated corner-brackets p-4 w-full"
      style={{ borderColor: "rgba(0,212,255,0.2)", boxShadow: "0 0 30px rgba(0,212,255,0.05)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={12} color="#00d4ff" />
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">
          HIGHEST ROI ACTION
        </span>
      </div>

      <motion.div
        key={`${lowestKey}-${state.hydrationLitres}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="font-mono text-sm font-bold tracking-[0.15em] mb-1"
          style={{ color: "#00d4ff", textShadow: "0 0 15px #00d4ff66" }}
        >
          {getAction()}
        </div>
        <div className="font-mono text-[10px] text-[#667788] tracking-wider mb-3">
          {obj.desc}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#445566] tracking-widest">IMPACT</span>
            <span className="font-mono text-xs font-bold" style={{ color: "#00ff88", textShadow: "0 0 8px #00ff8888" }}>
              +{obj.impact} pts
            </span>
          </div>
          <div className="flex items-center gap-1">
            {lowestKey === "hydration" && (
              <span className="font-mono text-[9px] text-[#445566]">
                {state.hydrationLitres.toFixed(2)}L / {state.hydrationTargetL}L
              </span>
            )}
            <span className="font-mono text-[9px] text-[#445566] ml-1">{lowestKey.toUpperCase()}</span>
            <span className="font-mono text-[9px]" style={{ color: value < 40 ? "#ff3366" : "#ffaa00" }}>
              {value}%
            </span>
            <ChevronRight size={10} color="#445566" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
