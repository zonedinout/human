"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  calcEatingWindow, getMealTimings, getProteinSources,
  ALLERGY_COMPENSATIONS, getDietaryStyleWarnings,
} from "@/lib/bioEngine";
import { useHealthStore } from "@/lib/store";

function fmtH(h: number): string {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function nowH(): number {
  const n = new Date();
  return n.getHours() + n.getMinutes() / 60;
}

function useNow() {
  const [now, setNow] = useState(nowH());
  useEffect(() => {
    const id = setInterval(() => setNow(nowH()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function NutritionProtocol() {
  const profile    = useHealthStore(s => s.profile);
  const sleepLog   = useHealthStore(s => s.sleepLog);
  const meals      = useHealthStore(s => s.meals);
  const now        = useNow();
  const [showAllergies, setShowAllergies] = useState(false);

  if (!profile) return null;

  const wakeHour = sleepLog ? (() => {
    const [h, m] = sleepLog.wakeTime.split(":").map(Number);
    return h + m / 60;
  })() : 7;

  const eatWin     = calcEatingWindow(profile, wakeHour);
  const timings    = getMealTimings(profile, wakeHour);
  const sources    = getProteinSources(profile);
  const allergyComps = ALLERGY_COMPENSATIONS.filter(a => profile.allergies.includes(a.allergy));
  const dietWarnings = getDietaryStyleWarnings(profile.dietaryStyle);

  const todayMeals = meals.filter(m => Date.now() - m.timestamp < 24 * 3_600_000);

  const nextTiming = timings.find(t => {
    const [h, m] = t.time.split(":").map(Number);
    return (h + m / 60) > now;
  });

  const windowOpen = now >= eatWin.openH && now < eatWin.closeH;
  const hoursUntilOpen = !windowOpen && now < eatWin.openH ? eatWin.openH - now : 0;
  const hoursUntilClose = windowOpen ? eatWin.closeH - now : 0;

  const lastMealTs = todayMeals.length > 0 ? Math.max(...todayMeals.map(m => m.timestamp)) : null;
  const hoursFasted = lastMealTs ? (Date.now() - lastMealTs) / 3_600_000 : null;

  const DIET_LABEL: Record<string, string> = {
    omnivore: "omnivore", vegetarian: "vegetarian", vegan: "vegan",
    keto: "ketogenic", paleo: "paleo",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.7 }}
      className="cosmic-card p-4 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full" style={{ background: "#4dd0c4" }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            nutrition
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem",
            letterSpacing: "0.08em", color: "rgba(77,208,196,0.6)",
            padding: "2px 8px", border: "1px solid rgba(77,208,196,0.2)", borderRadius: "20px",
            background: "rgba(77,208,196,0.06)",
          }}>
            {DIET_LABEL[profile.dietaryStyle] ?? profile.dietaryStyle}
          </span>
          {profile.allergies.length > 0 && (
            <button
              onClick={() => setShowAllergies(v => !v)}
              className="flex items-center gap-1"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "#c46b7a", letterSpacing: "0.05em" }}
            >
              <AlertTriangle size={9} color="#c46b7a" strokeWidth={1.5} />
              {profile.allergies.length} allergy flag{profile.allergies.length > 1 ? "s" : ""}
              {showAllergies ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Eating window */}
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            eating window
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.2rem",
            letterSpacing: "0.04em", marginBottom: "0.2rem",
            color: windowOpen ? "#4dd0c4" : "rgba(255,255,255,0.35)",
          }}>
            {fmtH(eatWin.openH)} — {fmtH(eatWin.closeH)}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginBottom: "0.6rem" }}>
            {eatWin.windowH}h window
          </div>

          <div className="relative h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="absolute h-full rounded-full" style={{
              left: `${(eatWin.openH / 24) * 100}%`,
              width: `${(eatWin.windowH / 24) * 100}%`,
              background: windowOpen ? "rgba(77,208,196,0.5)" : "rgba(155,127,212,0.3)",
            }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" style={{
              left: `${(now / 24) * 100}%`,
              boxShadow: "0 0 4px white", zIndex: 2,
            }} />
          </div>

          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: windowOpen ? "#4dd0c4" : "#c46b7a" }}>
            {windowOpen
              ? `open · closes in ${hoursUntilClose.toFixed(1)}h`
              : hoursUntilOpen > 0 ? `opens in ${hoursUntilOpen.toFixed(1)}h` : "window closed today"
            }
          </div>
          {hoursFasted !== null && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginTop: "0.3rem" }}>
              fasted: <span style={{ color: hoursFasted > 12 ? "#d4956b" : "#9b7fd4" }}>{hoursFasted.toFixed(1)}h</span>
            </div>
          )}
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.15)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            {eatWin.note}
          </div>
        </div>

        {/* Meal timing */}
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            meal timing
          </div>
          <div className="flex flex-col gap-2">
            {timings.slice(0, 5).map(t => {
              const [h, m] = t.time.split(":").map(Number);
              const tH = h + m / 60;
              const isPast = tH < now;
              const isNext = t === nextTiming;
              return (
                <motion.div
                  key={t.label}
                  className="flex items-start gap-2"
                  animate={{ opacity: isPast ? 0.25 : 1 }}
                >
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: isNext ? t.color : "rgba(255,255,255,0.25)", letterSpacing: "0.03em", minWidth: "2.8rem" }}>
                    {t.time}
                  </span>
                  <div className="flex-1">
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: isNext ? 400 : 300, fontSize: "0.65rem", color: isNext ? t.color : "rgba(255,255,255,0.35)" }}>
                      {t.label}
                      {isNext && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          style={{ marginLeft: "0.4rem", color: t.color }}
                        >●</motion.span>
                      )}
                    </div>
                    {isNext && (
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", marginTop: "0.15rem" }}>
                        {t.priority}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Protein sources */}
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            protein sources{profile.allergies.length > 0 && <span style={{ color: "#c46b7a", marginLeft: "0.3rem" }}>· allergy-safe</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            {sources.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{s.name}</span>
                  {s.note && <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.18)" }}>{s.note}</div>}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.65rem", color: "#4dd0c4" }}>{s.per100g}g</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.2)" }}>/100g</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.18)", marginTop: "0.6rem" }}>
            target: <span style={{ color: "rgba(77,208,196,0.5)" }}>
              {Math.round(profile.weightKg * (profile.goal === "performance" ? 2.2 : profile.goal === "composition" ? 2.0 : 1.6))}g/day
            </span>
          </div>
        </div>
      </div>

      {/* Allergy compensations */}
      <AnimatePresence>
        {showAllergies && allergyComps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "#c46b7a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                ⚠ allergy compensations — nutrient risks & alternatives
              </div>
              <div className="flex flex-col gap-4">
                {allergyComps.map(comp => (
                  <div key={comp.allergy}>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem",
                      letterSpacing: "0.08em", marginBottom: "0.5rem", padding: "2px 8px",
                      border: "1px solid rgba(196,107,122,0.25)", color: "#c46b7a",
                      background: "rgba(196,107,122,0.07)", borderRadius: "20px", display: "inline-block",
                    }}>
                      {comp.label}
                    </div>
                    <div className="flex flex-col gap-2">
                      {comp.riskNutrients.map(r => (
                        <div key={r.name} className="flex items-start gap-3 pl-2">
                          <div className="shrink-0">
                            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.65rem", color: "#d4956b", width: "5rem" }}>{r.name}</div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.4 }}>{r.why}</div>
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", flex: 1 }}>
                            → {r.sources.join(" · ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dietary style warnings */}
      {dietWarnings.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            {profile.dietaryStyle} protocol — critical nutrients
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dietWarnings.slice(0, 4).map(w => (
              <div key={w.nutrient} className="flex items-start gap-2">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.6rem", color: "#9b7fd4", minWidth: "5rem" }}>{w.nutrient}</span>
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>{w.sources[0]}</div>
                  {w.supplement && (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.18)" }}>💊 {w.supplement}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
