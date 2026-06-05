"use client";

import { motion } from "framer-motion";
import { Target, ChevronRight } from "lucide-react";
import { useHealthStore } from "@/lib/store";

const OBJECTIVES: Record<string, { action: string; desc: string; impact: number }> = {
  hydration:  { action: "DRINK 1.5L WATER",        desc: "Hydration below optimal threshold.", impact: 8 },
  sleep:      { action: "SLEEP BEFORE 23:00",       desc: "Sleep debt detected. Early sleep maximises recovery.", impact: 12 },
  recovery:   { action: "RECOVER TODAY",            desc: "Recovery incomplete. Rest accelerates adaptation.", impact: 10 },
  nutrition:  { action: "INCREASE PROTEIN INTAKE",  desc: "Protein intake limiting performance gains.", impact: 7 },
  movement:   { action: "WALK 3,000 MORE STEPS",    desc: "Movement target not reached today.", impact: 5 },
  energy:     { action: "PRIORITISE SLEEP QUALITY", desc: "Low energy. Improve sleep and nutrition.", impact: 9 },
  focus:      { action: "REDUCE COGNITIVE LOAD",    desc: "Focus declining. Schedule a recovery block.", impact: 6 },
  stress:     { action: "ACTIVE RECOVERY SESSION",  desc: "Stress accumulating. Light movement recommended.", impact: 7 },
};

export default function DailyObjective() {
  const state = useHealthStore();

  const keys = ["hydration", "sleep", "recovery", "nutrition", "movement", "energy", "focus", "stress"] as const;
  type ScoreKey = typeof keys[number];
  const lowestKey: ScoreKey = [...keys].sort((a, b) => state[a] - state[b])[0];

  const obj = OBJECTIVES[lowestKey];
  const value = state[lowestKey];

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
        key={lowestKey}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="font-mono text-sm font-bold tracking-[0.15em] mb-1"
          style={{ color: "#00d4ff", textShadow: "0 0 15px #00d4ff66" }}
        >
          {obj.action}
        </div>
        <div className="font-mono text-[10px] text-[#667788] tracking-wider mb-3">
          {obj.desc}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#445566] tracking-widest">IMPACT</span>
            <span
              className="font-mono text-xs font-bold"
              style={{ color: "#00ff88", textShadow: "0 0 8px #00ff8888" }}
            >
              +{obj.impact} pts
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] text-[#445566]">{lowestKey.toUpperCase()}</span>
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
