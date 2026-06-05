"use client";

import { motion } from "framer-motion";
import { useHealthStore } from "@/lib/store";

const OBJECTIVES: Record<string, { desc: string; impact: number }> = {
  hydration:  { desc: "Dehydration impairs cognition, recovery, and performance.", impact: 8 },
  sleep:      { desc: "Sleep debt detected. Earlier sleep maximises recovery.", impact: 12 },
  recovery:   { desc: "Recovery incomplete. Rest accelerates adaptation.", impact: 10 },
  nutrition:  { desc: "Protein intake is limiting performance gains.", impact: 7 },
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

  const getAction = (): string => {
    if (lowestKey === "hydration") {
      const remaining = Math.max(0, state.hydrationTargetL - state.hydrationLitres);
      return remaining > 0 ? `drink ${remaining.toFixed(1)}L more water` : "hydration target met";
    }
    if (lowestKey === "sleep") {
      const target = state.profile
        ? state.profile.age < 26 ? "21:30" : state.profile.age < 36 ? "22:00" : "22:30"
        : "22:30";
      return `sleep before ${target}`;
    }
    if (lowestKey === "recovery") return "no training today — recover";
    if (lowestKey === "nutrition") {
      const proteinG = state.profile
        ? Math.round(state.profile.weightKg * (state.profile.goal === "performance" ? 2.2 : state.profile.goal === "composition" ? 2.0 : 1.6))
        : 160;
      return `hit ${proteinG}g protein today`;
    }
    if (lowestKey === "movement") return "walk 10 minutes — move your body";
    if (lowestKey === "energy")   return "prioritise sleep quality";
    if (lowestKey === "focus")    return "reduce cognitive load";
    if (lowestKey === "stress")   return "active recovery session";
    return "maintain current protocols";
  };

  const actionColor = value >= 60 ? "#4dd0c4" : value >= 40 ? "#d4956b" : "#c46b7a";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="cosmic-card p-4 w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-1 rounded-full" style={{ background: actionColor }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
          highest ROI action
        </span>
      </div>

      <motion.div
        key={`${lowestKey}-${state.hydrationLitres}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.2rem",
            letterSpacing: "0.04em", color: actionColor, textShadow: `0 0 14px ${actionColor}55`,
            marginBottom: "0.4rem",
          }}
        >
          {getAction()}
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
          {obj.desc}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>
              impact
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.65rem", color: "#4dd0c4" }}>
              +{obj.impact}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lowestKey === "hydration" && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>
                {state.hydrationLitres.toFixed(2)}L / {state.hydrationTargetL}L
              </span>
            )}
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: `${actionColor}88` }}>
              {value}%
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
