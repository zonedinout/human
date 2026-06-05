"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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

  // Wake hour from today's sleep log, fallback to 7am
  const wakeHour = sleepLog ? (() => {
    const [h, m] = sleepLog.wakeTime.split(":").map(Number);
    return h + m / 60;
  })() : 7;

  const window     = calcEatingWindow(profile, wakeHour);
  const timings    = getMealTimings(profile, wakeHour);
  const sources    = getProteinSources(profile);
  const allergyComps = ALLERGY_COMPENSATIONS.filter(a => profile.allergies.includes(a.allergy));
  const dietWarnings = getDietaryStyleWarnings(profile.dietaryStyle);

  // Today's meals
  const todayMeals = meals.filter(m => Date.now() - m.timestamp < 24 * 3_600_000);

  // Next upcoming meal timing
  const nextTiming = timings.find(t => {
    const [h, m] = t.time.split(":").map(Number);
    return (h + m / 60) > now;
  });

  // Is eating window open right now?
  const windowOpen = now >= window.openH && now < window.closeH;
  const hoursUntilOpen = !windowOpen && now < window.openH ? window.openH - now : 0;
  const hoursUntilClose = windowOpen ? window.closeH - now : 0;

  // Hours since last meal
  const lastMealTs = todayMeals.length > 0
    ? Math.max(...todayMeals.map(m => m.timestamp))
    : null;
  const hoursFasted = lastMealTs ? (Date.now() - lastMealTs) / 3_600_000 : null;

  const DIET_LABEL: Record<string, string> = {
    omnivore: "OMNIVORE", vegetarian: "VEGETARIAN", vegan: "VEGAN",
    keto: "KETOGENIC", paleo: "PALEO",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.7 }}
      className="glass-card corner-brackets p-4 w-full"
      style={{ borderColor: "rgba(0,255,136,0.15)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils size={11} color="#00ff88" />
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">NUTRITION PROTOCOL</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[8px] px-2 py-0.5 tracking-widest"
            style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}
          >
            {DIET_LABEL[profile.dietaryStyle] ?? profile.dietaryStyle.toUpperCase()}
          </span>
          {profile.allergies.length > 0 && (
            <button
              onClick={() => setShowAllergies(v => !v)}
              className="flex items-center gap-1 font-mono text-[8px] tracking-widest"
              style={{ color: "#ff6b6b" }}
            >
              <AlertTriangle size={9} color="#ff6b6b" />
              {profile.allergies.length} ALLERGY FLAG{profile.allergies.length > 1 ? "S" : ""}
              {showAllergies ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Eating window */}
        <div className="border border-[#0d1e2a] p-3">
          <div className="font-mono text-[8px] tracking-[0.2em] text-[#334455] mb-2">EATING WINDOW</div>
          <div className="font-mono text-xl font-bold mb-1" style={{ color: windowOpen ? "#00ff88" : "#445566" }}>
            {fmtH(window.openH)} — {fmtH(window.closeH)}
          </div>
          <div className="font-mono text-[9px] text-[#445566] mb-2">{window.windowH}h window</div>

          {/* Window bar */}
          <div className="relative h-1.5 bg-[#0d1e2a] rounded-full overflow-visible mb-2">
            {/* Window fill */}
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${(window.openH / 24) * 100}%`,
                width: `${(window.windowH / 24) * 100}%`,
                background: windowOpen ? "rgba(0,255,136,0.5)" : "rgba(0,212,255,0.3)",
              }}
            />
            {/* Now marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                left: `${(now / 24) * 100}%`,
                background: "white",
                boxShadow: "0 0 4px white",
                zIndex: 2,
              }}
            />
          </div>

          <div className="font-mono text-[8px]" style={{ color: windowOpen ? "#00ff88" : "#ff6b6b" }}>
            {windowOpen
              ? `OPEN · closes in ${hoursUntilClose.toFixed(1)}h`
              : hoursUntilOpen > 0
                ? `Opens in ${hoursUntilOpen.toFixed(1)}h`
                : "Window closed for today"
            }
          </div>
          {hoursFasted !== null && (
            <div className="font-mono text-[8px] text-[#334455] mt-1">
              Fasted: <span style={{ color: hoursFasted > 12 ? "#ffaa00" : "#00d4ff" }}>{hoursFasted.toFixed(1)}h</span>
            </div>
          )}
          <div className="font-mono text-[8px] text-[#223344] mt-2 leading-relaxed">{window.note}</div>
        </div>

        {/* Next meal */}
        <div className="border border-[#0d1e2a] p-3">
          <div className="font-mono text-[8px] tracking-[0.2em] text-[#334455] mb-2">MEAL TIMING</div>
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
                  animate={{ opacity: isPast ? 0.3 : 1 }}
                >
                  <div className="shrink-0 mt-0.5">
                    <div
                      className="font-mono text-[8px] font-bold tracking-widest"
                      style={{ color: isNext ? t.color : isPast ? "#334455" : "#445566" }}
                    >
                      {t.time}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono text-[9px] font-bold tracking-wider"
                      style={{ color: isNext ? t.color : isPast ? "#334455" : "#556677" }}
                    >
                      {t.label}
                      {isNext && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          className="ml-1.5"
                          style={{ color: t.color }}
                        >●</motion.span>
                      )}
                    </div>
                    {isNext && (
                      <div className="font-mono text-[8px] text-[#445566] leading-relaxed mt-0.5">{t.priority}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Protein sources */}
        <div className="border border-[#0d1e2a] p-3">
          <div className="font-mono text-[8px] tracking-[0.2em] text-[#334455] mb-2">
            TOP PROTEIN SOURCES
            {profile.allergies.length > 0 && (
              <span className="ml-1 text-[#ff6b6b]">· allergy-safe</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {sources.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] text-[#667788]">{s.name}</span>
                  {s.note && (
                    <div className="font-mono text-[7px] text-[#334455]">{s.note}</div>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono text-[9px] font-bold" style={{ color: "#00ff88" }}>{s.per100g}g</span>
                  <span className="font-mono text-[7px] text-[#334455]">/100g</span>
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[8px] text-[#223344] mt-2 tracking-widest">
            TARGET: <span style={{ color: "#00ff8866" }}>
              {Math.round(profile.weightKg * (profile.goal === "performance" ? 2.2 : profile.goal === "composition" ? 2.0 : 1.6))}g/day
            </span>
          </div>
        </div>
      </div>

      {/* ── Allergy compensations (expandable) ── */}
      <AnimatePresence>
        {showAllergies && allergyComps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#0d1e2a] pt-4">
              <div className="font-mono text-[9px] text-[#ff6b6b] tracking-[0.2em] mb-3">
                ⚠ ALLERGY COMPENSATIONS — NUTRIENT RISKS & ALTERNATIVES
              </div>
              <div className="flex flex-col gap-4">
                {allergyComps.map(comp => (
                  <div key={comp.allergy}>
                    <div
                      className="font-mono text-[9px] font-bold tracking-widest mb-2 px-2 py-1 inline-block"
                      style={{ border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b", background: "rgba(255,107,107,0.08)" }}
                    >
                      {comp.label}
                    </div>
                    <div className="flex flex-col gap-2">
                      {comp.riskNutrients.map(r => (
                        <div key={r.name} className="flex items-start gap-3 pl-2">
                          <div className="shrink-0">
                            <div className="font-mono text-[9px] font-bold text-[#ffaa00] tracking-wider w-20">{r.name}</div>
                            <div className="font-mono text-[7px] text-[#334455] leading-tight">{r.why}</div>
                          </div>
                          <div className="flex-1 font-mono text-[8px] text-[#556677]">
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

      {/* ── Dietary style warnings ── */}
      {dietWarnings.length > 0 && (
        <div className="border-t border-[#0d1e2a] pt-3 mt-3">
          <div className="font-mono text-[9px] text-[#445566] tracking-[0.2em] mb-2">
            {profile.dietaryStyle.toUpperCase()} PROTOCOL — CRITICAL NUTRIENTS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dietWarnings.slice(0, 4).map(w => (
              <div key={w.nutrient} className="flex items-start gap-2">
                <span className="font-mono text-[8px] font-bold text-[#9966ff] w-20 shrink-0">{w.nutrient}</span>
                <div className="flex-1">
                  <div className="font-mono text-[8px] text-[#445566]">{w.sources[0]}</div>
                  {w.supplement && (
                    <div className="font-mono text-[7px] text-[#334455]">💊 {w.supplement}</div>
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
