"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Moon, Scale, Dumbbell, Utensils, Droplets, Coffee, type LucideIcon } from "lucide-react";
import { useHealthStore } from "@/lib/store";

type Tab = "SLEEP" | "WEIGHT" | "TRAINING" | "NUTRITION" | "HYDRATION" | "WELLBEING";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const TRAINING_TYPES = ["Push", "Pull", "Legs", "Full Body", "Cardio", "Sport"];

function calcDuration(bed: string, wake: string): string {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CyberButton({ onClick, children, color = "#00d4ff", disabled = false, active = false }: {
  onClick: () => void; children: React.ReactNode; color?: string; disabled?: boolean; active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className="font-mono text-[10px] tracking-[0.2em] px-3 py-2 transition-all duration-200"
      style={{
        border: `1px solid ${active ? color : color + "55"}`,
        background: active ? `${color}22` : `${color}08`,
        color: active ? color : `${color}99`,
        boxShadow: active ? `0 0 12px ${color}33` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

function SleepTab({ onDone }: { onDone: () => void }) {
  const [bed, setBed] = useState("22:30");
  const [wake, setWake] = useState("06:30");
  const logSleep = useHealthStore(s => s.logSleep);
  const profile = useHealthStore(s => s.profile);
  const [bedH, bedM] = bed.split(":");
  const [wakeH, wakeM] = wake.split(":");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "BED TIME",  h: bedH,  m: bedM,  setH: (v: string) => setBed(`${v}:${bedM}`),  setM: (v: string) => setBed(`${bedH}:${v}`)  },
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

function WeightTab({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const logWeight = useHealthStore(s => s.logWeight);
  const current = useHealthStore(s => s.weight);
  const history = useHealthStore(s => s.weightHistory);

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

function TrainingTab({ onDone }: { onDone: () => void }) {
  const [trained, setTrained] = useState<boolean | null>(null);
  const [type, setType] = useState("Push");
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
  const [size, setSize] = useState<string | null>(null);
  const [protein, setProtein] = useState<string | null>(null);
  const logMeal = useHealthStore(s => s.logMeal);
  const profile = useHealthStore(s => s.profile);

  return (
    <div className="flex flex-col gap-5">
      {profile && (
        <div className="font-mono text-[9px] text-[#334455] tracking-widest">
          PROTEIN TARGET: <span style={{ color: "#00d4ff88" }}>
            {Math.round(profile.weightKg * (profile.goal === "performance" ? 2.2 : profile.goal === "composition" ? 2.0 : 1.6))}g / DAY
          </span>
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

function HydrationTab({ onDone }: { onDone: () => void }) {
  const logHydration = useHealthStore(s => s.logHydration);
  const hydrationLitres = useHealthStore(s => s.hydrationLitres);
  const target = useHealthStore(s => s.hydrationTargetL);

  const QUICK = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
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
            style={{ background: hydrationLitres >= target ? "#00ff88" : "#00d4ff" }}
            animate={{ width: `${Math.min(100, (hydrationLitres / target) * 100)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Quick log buttons */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-3">QUICK LOG</div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map(l => (
            <motion.button
              key={l}
              onClick={() => logHydration(l)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-3 flex flex-col items-center gap-1 transition-all"
              style={{
                border: "1px solid rgba(0,212,255,0.2)",
                background: "rgba(0,212,255,0.05)",
              }}
            >
              <span className="font-mono text-lg font-bold" style={{ color: "#00d4ff" }}>{l}</span>
              <span className="font-mono text-[8px] text-[#445566]">LITRES</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="font-mono text-[9px] text-[#334455] tracking-widest text-center">
        Tap a quantity to add it to today's total
      </div>
    </div>
  );
}

function WellbeingTab({ onDone }: { onDone: () => void }) {
  const logCaffeine = useHealthStore(s => s.logCaffeine);
  const logSubjectiveStress = useHealthStore(s => s.logSubjectiveStress);
  const caffeineLevel = useHealthStore(s => s.caffeineLevel);
  const subjectiveStress = useHealthStore(s => s.subjectiveStress);

  const CAFFEINE = [
    { level: 0, label: "NONE",   sub: "No caffeine" },
    { level: 1, label: "1 CUP",  sub: "Coffee / tea" },
    { level: 2, label: "2–3",    sub: "Moderate load" },
    { level: 3, label: "4+",     sub: "High load" },
  ];

  const STRESS_LEVELS = [
    { level: 1, label: "CALM",     color: "#00ff88" },
    { level: 2, label: "MILD",     color: "#88ff00" },
    { level: 3, label: "MODERATE", color: "#ffaa00" },
    { level: 4, label: "HIGH",     color: "#ff6600" },
    { level: 5, label: "MAXED",    color: "#ff3366" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Caffeine */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-1">CAFFEINE INTAKE TODAY</div>
        <div className="font-mono text-[8px] text-[#334455] tracking-widest mb-3">
          Affects cortisol, sleep quality, and stress score
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CAFFEINE.map(c => (
            <motion.button
              key={c.level}
              onClick={() => logCaffeine(c.level)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="py-3 flex flex-col items-center gap-1 transition-all"
              style={{
                border: `1px solid ${caffeineLevel === c.level ? "#ffaa00" : "#1a2a3a"}`,
                background: caffeineLevel === c.level ? "rgba(255,170,0,0.12)" : "rgba(8,15,20,0.6)",
                boxShadow: caffeineLevel === c.level ? "0 0 12px rgba(255,170,0,0.2)" : "none",
              }}
            >
              <span className="font-mono text-xs font-bold" style={{ color: caffeineLevel === c.level ? "#ffaa00" : "#667788" }}>
                {c.label}
              </span>
              <span className="font-mono text-[8px] text-[#334455]">{c.sub}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Subjective stress */}
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-1">HOW STRESSED DO YOU FEEL?</div>
        <div className="font-mono text-[8px] text-[#334455] tracking-widest mb-3">
          Blended 50/50 with biological stress signals
        </div>
        <div className="flex gap-2">
          {STRESS_LEVELS.map(s => (
            <motion.button
              key={s.level}
              onClick={() => logSubjectiveStress(s.level)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex-1 py-3 flex flex-col items-center gap-1 transition-all"
              style={{
                border: `1px solid ${subjectiveStress === s.level ? s.color : "#1a2a3a"}`,
                background: subjectiveStress === s.level ? `${s.color}18` : "rgba(8,15,20,0.6)",
                boxShadow: subjectiveStress === s.level ? `0 0 12px ${s.color}33` : "none",
              }}
            >
              <span className="font-mono text-sm font-bold" style={{ color: subjectiveStress === s.level ? s.color : "#334455" }}>
                {s.level}
              </span>
              <span className="font-mono text-[7px]" style={{ color: subjectiveStress === s.level ? s.color : "#334455" }}>
                {s.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="font-mono text-[8px] text-[#223344] tracking-widest text-center leading-relaxed">
        Stress score updates live. Too much coffee = cortisol spike = lower recovery.
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "SLEEP",     label: "SLEEP",  Icon: Moon },
  { id: "HYDRATION", label: "WATER",  Icon: Droplets },
  { id: "TRAINING",  label: "TRAIN",  Icon: Dumbbell },
  { id: "NUTRITION", label: "FOOD",   Icon: Utensils },
  { id: "WELLBEING", label: "STRESS", Icon: Coffee },
  { id: "WEIGHT",    label: "WEIGHT", Icon: Scale },
];

export default function LogPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("SLEEP");

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center"
        style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.4)", boxShadow: "0 0 20px rgba(0,212,255,0.3)" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
      >
        <Plus size={22} color="#00d4ff" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
              style={{ background: "rgba(8,15,20,0.98)", border: "1px solid rgba(0,212,255,0.2)", borderBottom: "none", backdropFilter: "blur(20px)" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-[#1a2a3a] rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#0a1520]">
                <span className="font-mono text-xs tracking-[0.2em] text-[#445566]">DATA INPUT — BIOMETRIC LOG</span>
                <button onClick={() => setOpen(false)}><X size={16} color="#445566" /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#0a1520]">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 font-mono text-[9px] tracking-widest transition-all"
                    style={{
                      color: tab === id ? "#00d4ff" : "#334455",
                      borderBottom: tab === id ? "1px solid #00d4ff" : "1px solid transparent",
                    }}
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === "SLEEP"     && <SleepTab     onDone={() => setOpen(false)} />}
                    {tab === "WEIGHT"    && <WeightTab    onDone={() => setOpen(false)} />}
                    {tab === "TRAINING"  && <TrainingTab  onDone={() => setOpen(false)} />}
                    {tab === "NUTRITION" && <NutritionTab onDone={() => setOpen(false)} />}
                    {tab === "HYDRATION" && <HydrationTab onDone={() => setOpen(false)} />}
                    {tab === "WELLBEING" && <WellbeingTab onDone={() => setOpen(false)} />}
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
