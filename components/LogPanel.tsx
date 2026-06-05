"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Moon, Scale, Dumbbell, Utensils, Droplets, Coffee,
  Activity, Pill, type LucideIcon
} from "lucide-react";
import { useHealthStore, type Supplements } from "@/lib/store";
import { calcCaffeineDecay } from "@/lib/bioEngine";

type Tab = "SLEEP" | "HYDRATION" | "TRAINING" | "NUTRITION" | "WELLBEING" | "HRV" | "SUPPS" | "WEIGHT";

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const TRAINING_TYPES = ["Push", "Pull", "Legs", "Full Body", "Cardio", "Sport"];

function calcDuration(bed: string, wake: string): string {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function CyberButton({
  onClick, children, color = "#00d4ff", disabled = false, active = false,
}: {
  onClick: () => void; children: React.ReactNode; color?: string;
  disabled?: boolean; active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className="font-mono text-[10px] tracking-[0.2em] px-3 py-2 transition-all duration-200"
      style={{
        border: `1px solid ${active ? color : color + "44"}`,
        background: active ? `${color}22` : `${color}08`,
        color: active ? color : `${color}88`,
        boxShadow: active ? `0 0 14px ${color}33` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function SleepTab({ onDone }: { onDone: () => void }) {
  const [bed, setBed]   = useState("22:30");
  const [wake, setWake] = useState("06:30");
  const logSleep = useHealthStore(s => s.logSleep);
  const profile  = useHealthStore(s => s.profile);
  const [bedH, bedM]   = bed.split(":");
  const [wakeH, wakeM] = wake.split(":");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "BED TIME",  h: bedH,  m: bedM,  setH: (v: string) => setBed(`${v}:${bedM}`),   setM: (v: string) => setBed(`${bedH}:${v}`)   },
          { label: "WAKE TIME", h: wakeH, m: wakeM, setH: (v: string) => setWake(`${v}:${wakeM}`), setM: (v: string) => setWake(`${wakeH}:${v}`) },
        ].map(({ label, h, m, setH, setM }) => (
          <div key={label}>
            <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">{label}</div>
            <div className="flex gap-2 items-center">
              <select value={h} onChange={e => setH(e.target.value)}
                className="font-mono text-sm bg-[#0a1520] border border-[#1a2a3a] text-[#00d4ff] px-2 py-1.5 outline-none">
                {HOURS.map(hr => <option key={hr} value={hr}>{hr}</option>)}
              </select>
              <span className="font-mono text-[#445566]">:</span>
              <select value={m} onChange={e => setM(e.target.value)}
                className="font-mono text-sm bg-[#0a1520] border border-[#1a2a3a] text-[#00d4ff] px-2 py-1.5 outline-none">
                {MINUTES.map(mn => <option key={mn} value={mn}>{mn}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 py-2 px-3 border border-[#1a2a3a] bg-[#080f14]">
        <Moon size={12} color="#8899aa" />
        <span className="font-mono text-[10px] text-[#445566] tracking-widest">DURATION</span>
        <span className="font-mono text-sm font-bold ml-auto" style={{ color: "#00d4ff" }}>{calcDuration(bed, wake)}</span>
      </div>

      {profile && (
        <div className="font-mono text-[9px] text-[#334455] tracking-widest">
          TARGET: <span style={{ color: "#00d4ff88" }}>
            {profile.age < 26 ? "9h" : profile.age < 36 ? "8.5h" : profile.age < 51 ? "8h" : "7.5h"}
          </span> based on your age
        </div>
      )}
      <CyberButton onClick={() => { logSleep(bed, wake); onDone(); }} color="#00d4ff">LOG SLEEP</CyberButton>
    </div>
  );
}

function HydrationTab() {
  const logHydration    = useHealthStore(s => s.logHydration);
  const hydrationLitres = useHealthStore(s => s.hydrationLitres);
  const target          = useHealthStore(s => s.hydrationTargetL);
  const QUICK = [0.25, 0.5, 0.75, 1.0];
  const pct = Math.min(100, (hydrationLitres / target) * 100);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex justify-between font-mono text-[9px] text-[#445566] tracking-widest mb-2">
          <span>TODAY</span>
          <span style={{ color: hydrationLitres >= target ? "#00ff88" : "#ffaa00" }}>
            {hydrationLitres.toFixed(2)}L / {target}L
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1a2a3a] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: pct >= 100 ? "#00ff88" : "#00d4ff" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-3">QUICK LOG</div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map(l => (
            <motion.button
              key={l}
              onClick={() => logHydration(l)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="py-3 flex flex-col items-center gap-1"
              style={{ border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.05)" }}
            >
              <span className="font-mono text-lg font-bold" style={{ color: "#00d4ff" }}>{l}</span>
              <span className="font-mono text-[8px] text-[#445566]">LITRES</span>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="font-mono text-[9px] text-[#334455] tracking-widest text-center">
        Tap to add to today's total
      </div>
    </div>
  );
}

function TrainingTab({ onDone }: { onDone: () => void }) {
  const [trained, setTrained] = useState<boolean | null>(null);
  const [type, setType]       = useState("Push");
  const logTraining = useHealthStore(s => s.logTraining);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">TODAY'S STATUS</div>
        <div className="flex gap-2">
          <CyberButton onClick={() => setTrained(true)}  color="#00ff88" active={trained === true}>TRAINED</CyberButton>
          <CyberButton onClick={() => setTrained(false)} color="#8899aa" active={trained === false}>REST DAY</CyberButton>
        </div>
      </div>
      {trained && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">SESSION TYPE</div>
          <div className="grid grid-cols-3 gap-2">
            {TRAINING_TYPES.map(t => (
              <CyberButton key={t} onClick={() => setType(t)} color="#00d4ff" active={type === t}>{t.toUpperCase()}</CyberButton>
            ))}
          </div>
        </motion.div>
      )}
      <CyberButton
        onClick={() => { if (trained !== null) { logTraining(trained ? type : "Rest"); onDone(); } }}
        color="#00ff88" disabled={trained === null}
      >LOG TRAINING</CyberButton>
    </div>
  );
}

function NutritionTab({ onDone }: { onDone: () => void }) {
  const [size, setSize]       = useState<string | null>(null);
  const [protein, setProtein] = useState<string | null>(null);
  const logMeal = useHealthStore(s => s.logMeal);
  const profile = useHealthStore(s => s.profile);
  const meals   = useHealthStore(s => s.meals);

  // Eating window from today's meals
  const todayMeals = meals.filter(m => Date.now() - m.timestamp < 24 * 3_600_000);
  const timestamps  = todayMeals.map(m => m.timestamp).sort((a, b) => a - b);
  const eatingWindowH = timestamps.length >= 2
    ? ((timestamps[timestamps.length - 1] - timestamps[0]) / 3_600_000).toFixed(1)
    : null;
  const hoursFasted = timestamps.length > 0
    ? ((Date.now() - timestamps[timestamps.length - 1]) / 3_600_000).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Eating window stats */}
      <div className="flex gap-4 font-mono text-[9px]">
        <span className="text-[#445566]">MEALS TODAY: <span style={{ color: "#00d4ff" }}>{todayMeals.length}</span></span>
        {eatingWindowH && <span className="text-[#445566]">WINDOW: <span style={{ color: "#00d4ff" }}>{eatingWindowH}h</span></span>}
        {hoursFasted && <span className="text-[#445566]">FASTED: <span style={{ color: "#00ff88" }}>{hoursFasted}h</span></span>}
      </div>

      {profile && (
        <div className="font-mono text-[9px] text-[#334455] tracking-widest">
          PROTEIN TARGET: <span style={{ color: "#00d4ff88" }}>
            {Math.round(profile.weightKg * (profile.goal === "performance" ? 2.2 : profile.goal === "composition" ? 2.0 : 1.6))}g / DAY
          </span>
        </div>
      )}

      {/* Last meal time */}
      {timestamps.length > 0 && (
        <div className="font-mono text-[9px] text-[#334455] tracking-widest">
          LAST MEAL: <span style={{ color: "#00d4ff88" }}>{fmt(timestamps[timestamps.length - 1])}</span>
          {timestamps.length > 0 && (
            <span className="ml-2">FIRST: <span style={{ color: "#00d4ff88" }}>{fmt(timestamps[0])}</span></span>
          )}
        </div>
      )}

      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">MEAL SIZE</div>
        <div className="flex gap-2">
          {["Small", "Medium", "Large"].map(s => (
            <CyberButton key={s} onClick={() => setSize(s)} color="#00d4ff" active={size === s}>{s.toUpperCase()}</CyberButton>
          ))}
        </div>
      </div>
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">PROTEIN LEVEL</div>
        <div className="flex gap-2">
          {["Low", "Medium", "High"].map(p => (
            <CyberButton key={p} onClick={() => setProtein(p)} color="#00ff88" active={protein === p}>{p.toUpperCase()}</CyberButton>
          ))}
        </div>
      </div>
      <CyberButton
        onClick={() => { if (size && protein) { logMeal(size, protein); onDone(); } }}
        color="#00d4ff" disabled={!size || !protein}
      >LOG MEAL</CyberButton>
    </div>
  );
}

function WellbeingTab() {
  const logCaffeine          = useHealthStore(s => s.logCaffeine);
  const logSubjectiveStress  = useHealthStore(s => s.logSubjectiveStress);
  const caffeineLevel        = useHealthStore(s => s.caffeineLevel);
  const caffeineLoggedAt     = useHealthStore(s => s.caffeineLoggedAt);
  const subjectiveStress     = useHealthStore(s => s.subjectiveStress);

  const effectiveCaffeine = calcCaffeineDecay(caffeineLevel, caffeineLoggedAt);
  const CAFFEINE_LABELS   = ["NONE", "1 CUP", "2–3", "4+"];
  const EFF_LABELS        = ["NONE", "LOW", "MODERATE", "HIGH"];
  const EFF_COLORS        = ["#445566", "#00ff88", "#ffaa00", "#ff3366"];

  const STRESS_LEVELS = [
    { level: 1, label: "CALM",  color: "#00ff88" },
    { level: 2, label: "MILD",  color: "#88ff00" },
    { level: 3, label: "MOD",   color: "#ffaa00" },
    { level: 4, label: "HIGH",  color: "#ff6600" },
    { level: 5, label: "MAX",   color: "#ff3366" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Caffeine */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-1">CAFFEINE INTAKE TODAY</div>
        <div className="font-mono text-[8px] text-[#334455] tracking-widest mb-3">
          Auto-decays over 5.5h half-life · affects cortisol and stress score
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {CAFFEINE_LABELS.map((label, idx) => (
            <motion.button
              key={idx}
              onClick={() => logCaffeine(idx)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="py-3 flex flex-col items-center gap-1"
              style={{
                border: `1px solid ${caffeineLevel === idx ? "#ffaa00" : "#1a2a3a"}`,
                background: caffeineLevel === idx ? "rgba(255,170,0,0.12)" : "rgba(8,15,20,0.6)",
                boxShadow: caffeineLevel === idx ? "0 0 14px rgba(255,170,0,0.2)" : "none",
              }}
            >
              <span className="font-mono text-xs font-bold" style={{ color: caffeineLevel === idx ? "#ffaa00" : "#445566" }}>
                {label}
              </span>
            </motion.button>
          ))}
        </div>
        {/* Effective level indicator */}
        {caffeineLevel > 0 && (
          <div className="font-mono text-[8px] text-[#334455] tracking-widest">
            EFFECTIVE NOW:{" "}
            <span style={{ color: EFF_COLORS[effectiveCaffeine] }}>
              {EFF_LABELS[effectiveCaffeine]}
            </span>
            {effectiveCaffeine < caffeineLevel && (
              <span className="text-[#223344]"> (metabolising)</span>
            )}
          </div>
        )}
      </div>

      {/* Subjective stress */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-1">HOW STRESSED DO YOU FEEL?</div>
        <div className="font-mono text-[8px] text-[#334455] tracking-widest mb-3">
          Blended 50/50 with biological signals
        </div>
        <div className="flex gap-2">
          {STRESS_LEVELS.map(s => (
            <motion.button
              key={s.level}
              onClick={() => logSubjectiveStress(s.level)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex-1 py-3 flex flex-col items-center gap-1"
              style={{
                border: `1px solid ${subjectiveStress === s.level ? s.color : "#1a2a3a"}`,
                background: subjectiveStress === s.level ? `${s.color}18` : "rgba(8,15,20,0.6)",
                boxShadow: subjectiveStress === s.level ? `0 0 14px ${s.color}33` : "none",
              }}
            >
              <span className="font-mono text-sm font-bold" style={{ color: subjectiveStress === s.level ? s.color : "#334455" }}>
                {s.level}
              </span>
              <span className="font-mono text-[7px]" style={{ color: subjectiveStress === s.level ? s.color : "#2a3a44" }}>
                {s.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HRVTab({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const logHRV     = useHealthStore(s => s.logHRV);
  const hrv        = useHealthStore(s => s.hrv);
  const hrvHistory = useHealthStore(s => s.hrvHistory);

  const avg7 = hrvHistory.length >= 2
    ? Math.round(hrvHistory.slice(-7).reduce((a, e) => a + e.value, 0) / Math.min(hrvHistory.length, 7))
    : null;

  const HRV_ZONES = [
    { min: 0,  max: 30,  label: "POOR",      color: "#ff3366", desc: "Significant recovery debt. Rest required." },
    { min: 30, max: 50,  label: "LOW",       color: "#ff6600", desc: "Below baseline. Reduce intensity today." },
    { min: 50, max: 70,  label: "NORMAL",    color: "#ffaa00", desc: "Average. Monitor and maintain protocols." },
    { min: 70, max: 90,  label: "GOOD",      color: "#00ff88", desc: "Above baseline. Ready to perform." },
    { min: 90, max: 999, label: "EXCELLENT", color: "#00d4ff", desc: "Peak recovery. Full output available." },
  ];

  const n = parseFloat(value);
  const zone = isNaN(n) ? null : HRV_ZONES.find(z => n >= z.min && n < z.max);

  return (
    <div className="flex flex-col gap-5">
      {/* Current / history */}
      <div className="flex gap-4 font-mono text-[10px]">
        {hrv && (
          <span className="text-[#445566]">LAST: <span style={{ color: "#00d4ff" }}>{hrv}ms</span></span>
        )}
        {avg7 && (
          <span className="text-[#445566]">7-DAY AVG: <span style={{ color: "#00d4ff" }}>{avg7}ms</span></span>
        )}
      </div>

      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">HRV READING (ms)</div>
        <input
          type="number" value={value} onChange={e => setValue(e.target.value)}
          placeholder="0" autoFocus min="1" max="200"
          className="w-full font-mono text-4xl bg-transparent border-b-2 border-[#1a2a3a] focus:border-[#00d4ff] text-[#00d4ff] pb-2 outline-none transition-colors"
        />
      </div>

      {/* Zone indicator */}
      <AnimatePresence mode="wait">
        {zone && (
          <motion.div
            key={zone.label}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-3 py-2 border"
            style={{ borderColor: zone.color + "44", background: zone.color + "10" }}
          >
            <div className="font-mono text-xs font-bold mb-0.5" style={{ color: zone.color }}>{zone.label}</div>
            <div className="font-mono text-[9px] text-[#556677]">{zone.desc}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HRV zones reference */}
      <div className="flex gap-1">
        {HRV_ZONES.map(z => (
          <div key={z.label} className="flex-1 text-center">
            <div className="h-1 rounded-full mb-1" style={{ background: z.color }} />
            <div className="font-mono text-[6px] tracking-wide" style={{ color: z.color }}>{z.label}</div>
            <div className="font-mono text-[6px] text-[#334455]">{z.min}+</div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[9px] text-[#334455] tracking-widest leading-relaxed">
        Measure first thing in morning. Use Oura, Garmin, WHOOP, or a chest strap for accuracy.
      </div>

      <CyberButton
        onClick={() => { if (!isNaN(n) && n > 0) { logHRV(n); onDone(); } }}
        color="#00d4ff"
        disabled={!value || isNaN(n) || n <= 0}
      >LOG HRV</CyberButton>
    </div>
  );
}

function SupplementsTab() {
  const supplements    = useHealthStore(s => s.supplements);
  const toggleSupplement = useHealthStore(s => s.toggleSupplement);

  const SUPPS: Array<{
    key: keyof Supplements;
    name: string;
    benefit: string;
    timing: string;
    color: string;
  }> = [
    { key: "creatine",    name: "CREATINE",     benefit: "Power output, cognitive function",  timing: "Any time",        color: "#00d4ff" },
    { key: "magnesium",   name: "MAGNESIUM",    benefit: "Sleep quality, stress, CNS calm",   timing: "30min pre-sleep", color: "#9966ff" },
    { key: "vitaminD",    name: "VITAMIN D3",   benefit: "Testosterone, immunity, mood",       timing: "Morning w/ fat",  color: "#ffaa00" },
    { key: "omega3",      name: "OMEGA-3",      benefit: "Inflammation, brain, heart",         timing: "With meals",      color: "#00ff88" },
    { key: "ashwagandha", name: "ASHWAGANDHA",  benefit: "Cortisol reduction, stress buffer",  timing: "With food",       color: "#ff8c42" },
    { key: "zinc",        name: "ZINC",         benefit: "Testosterone, immunity, recovery",   timing: "Evening",         color: "#ff3366" },
  ];

  const taken = Object.values(supplements).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[9px] text-[#445566] tracking-widest">TODAY'S STACK</div>
        <div className="font-mono text-[9px]" style={{ color: taken === 6 ? "#00ff88" : taken >= 3 ? "#ffaa00" : "#445566" }}>
          {taken}/6 TAKEN
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {SUPPS.map(({ key, name, benefit, timing, color }) => {
          const active = supplements[key];
          return (
            <motion.button
              key={key}
              onClick={() => toggleSupplement(key)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-3 px-3 py-2.5 text-left transition-all"
              style={{
                border: `1px solid ${active ? color + "55" : "#1a2a3a"}`,
                background: active ? `${color}10` : "rgba(8,15,20,0.4)",
                boxShadow: active ? `0 0 12px ${color}18` : "none",
              }}
            >
              {/* Checkbox */}
              <div
                className="w-4 h-4 shrink-0 flex items-center justify-center border"
                style={{
                  borderColor: active ? color : "#2a3a44",
                  background: active ? color + "22" : "transparent",
                }}
              >
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-sm"
                    style={{ background: color }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] font-bold tracking-wider" style={{ color: active ? color : "#445566" }}>
                  {name}
                </div>
                <div className="font-mono text-[8px] text-[#334455] truncate">{benefit}</div>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono text-[7px] text-[#223344] tracking-widest">{timing}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="font-mono text-[8px] text-[#223344] tracking-widest leading-relaxed">
        Check off each supplement as you take it. Ashwagandha and magnesium directly lower your stress score.
      </div>
    </div>
  );
}

function WeightTab({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const logWeight = useHealthStore(s => s.logWeight);
  const current   = useHealthStore(s => s.weight);
  const history   = useHealthStore(s => s.weightHistory);
  const avg7 = history.length >= 2
    ? (history.slice(-7).reduce((a, e) => a + e.value, 0) / Math.min(history.length, 7)).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {current && (
        <div className="flex gap-4 font-mono text-[10px]">
          <span className="text-[#445566]">LAST: <span style={{ color: "#00d4ff" }}>{current}kg</span></span>
          {avg7 && <span className="text-[#445566]">7-DAY AVG: <span style={{ color: "#00d4ff" }}>{avg7}kg</span></span>}
        </div>
      )}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">BODY WEIGHT (KG)</div>
        <input
          type="number" value={value} onChange={e => setValue(e.target.value)}
          placeholder="0.0" autoFocus
          className="w-full font-mono text-4xl bg-transparent border-b-2 border-[#1a2a3a] focus:border-[#00d4ff] text-[#00d4ff] pb-2 outline-none transition-colors"
        />
      </div>
      <CyberButton
        onClick={() => { const n = parseFloat(value); if (!isNaN(n) && n > 0) { logWeight(n); onDone(); } }}
        color="#00d4ff"
        disabled={!value || isNaN(parseFloat(value))}
      >LOG WEIGHT</CyberButton>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "SLEEP",     label: "SLEEP",  Icon: Moon     },
  { id: "HYDRATION", label: "WATER",  Icon: Droplets },
  { id: "TRAINING",  label: "TRAIN",  Icon: Dumbbell },
  { id: "NUTRITION", label: "FOOD",   Icon: Utensils },
  { id: "WELLBEING", label: "STRESS", Icon: Coffee   },
  { id: "HRV",       label: "HRV",    Icon: Activity },
  { id: "SUPPS",     label: "STACK",  Icon: Pill     },
  { id: "WEIGHT",    label: "WEIGHT", Icon: Scale    },
];

export default function LogPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<Tab>("SLEEP");

  return (
    <>
      {/* FAB */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center"
        style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.4)", boxShadow: "0 0 24px rgba(0,212,255,0.25)" }}
        whileHover={{ scale: 1.12, boxShadow: "0 0 36px rgba(0,212,255,0.4)" }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
      >
        <Plus size={22} color="#00d4ff" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
              style={{
                background: "rgba(5,10,14,0.99)",
                border: "1px solid rgba(0,212,255,0.18)",
                borderBottom: "none",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-[#1a2a3a] rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#0a1520]">
                <span className="font-mono text-xs tracking-[0.2em] text-[#445566]">BIOMETRIC LOG</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                >
                  <X size={16} color="#445566" />
                </motion.button>
              </div>

              {/* Tabs — scrollable on small screens */}
              <div className="flex border-b border-[#0a1520] overflow-x-auto">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex-1 min-w-[56px] flex flex-col items-center gap-1 py-2.5 font-mono text-[8px] tracking-widest transition-all"
                    style={{
                      color: tab === id ? "#00d4ff" : "#334455",
                      borderBottom: tab === id ? "2px solid #00d4ff" : "2px solid transparent",
                      background: tab === id ? "rgba(0,212,255,0.04)" : "transparent",
                    }}
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === "SLEEP"     && <SleepTab      onDone={() => setOpen(false)} />}
                    {tab === "HYDRATION" && <HydrationTab />}
                    {tab === "TRAINING"  && <TrainingTab   onDone={() => setOpen(false)} />}
                    {tab === "NUTRITION" && <NutritionTab  onDone={() => setOpen(false)} />}
                    {tab === "WELLBEING" && <WellbeingTab />}
                    {tab === "HRV"       && <HRVTab        onDone={() => setOpen(false)} />}
                    {tab === "SUPPS"     && <SupplementsTab />}
                    {tab === "WEIGHT"    && <WeightTab     onDone={() => setOpen(false)} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
