"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthStore } from "@/lib/store";
import type { Sex, ActivityLevel, Goal, UserProfile } from "@/lib/store";
import { calcBMR, calcTDEE, calcHydrationTargetL, calcSleepTargetH } from "@/lib/bioEngine";

type Step = "boot" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "calibrating" | "done";

const STEP_ORDER: Step[] = ["boot", "sex", "age", "height", "weight", "activity", "goal", "calibrating"];

function StepLabel({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-px flex-1 transition-all duration-500"
          style={{ background: i < current ? "#00d4ff" : "#1a2a3a" }}
        />
      ))}
    </div>
  );
}

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, #00d4ff44, transparent)" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
  );
}

interface BigTileProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}

function BigTile({ label, sublabel, selected, onClick, color = "#00d4ff" }: BigTileProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative p-8 text-left transition-all duration-300 corner-brackets w-full"
      style={{
        background: selected ? `${color}12` : "rgba(8,15,20,0.8)",
        border: `1px solid ${selected ? color : "#1a2a3a"}`,
        boxShadow: selected ? `0 0 30px ${color}22` : "none",
      }}
    >
      <div
        className="font-mono text-lg font-bold tracking-[0.2em] mb-1"
        style={{ color: selected ? color : "#aabbcc" }}
      >
        {label}
      </div>
      {sublabel && (
        <div className="font-mono text-[10px] text-[#445566] tracking-widest">{sublabel}</div>
      )}
      {selected && (
        <motion.div
          layoutId="tileSelected"
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
    </motion.button>
  );
}

function NumberInput({
  value, onChange, unit, placeholder, min, max
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-end gap-4">
      <div className="flex-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          autoFocus
          className="w-full bg-transparent border-b-2 border-[#1a2a3a] focus:border-[#00d4ff] text-white font-mono text-6xl font-bold outline-none pb-2 transition-colors"
          style={{ caretColor: "#00d4ff" }}
        />
      </div>
      <div className="font-mono text-lg text-[#445566] tracking-widest pb-3">{unit}</div>
    </div>
  );
}

function UnitToggle({ unit, setUnit, options }: { unit: string; setUnit: (u: string) => void; options: string[] }) {
  return (
    <div className="flex gap-1 mt-4">
      {options.map(o => (
        <button
          key={o}
          onClick={() => setUnit(o)}
          className="font-mono text-[10px] tracking-widest px-3 py-1 transition-all"
          style={{
            color: unit === o ? "#00d4ff" : "#334455",
            border: `1px solid ${unit === o ? "#00d4ff44" : "#1a2a3a"}`,
            background: unit === o ? "#00d4ff11" : "transparent",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const completeOnboarding = useHealthStore(s => s.completeOnboarding);

  const [step, setStep] = useState<Step>("boot");
  const [sex, setSex]               = useState<Sex | null>(null);
  const [age, setAge]               = useState("");
  const [heightVal, setHeightVal]   = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weightVal, setWeightVal]   = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [activity, setActivity]     = useState<ActivityLevel | null>(null);
  const [goal, setGoal]             = useState<Goal | null>(null);
  const [calibProgress, setCalibProgress] = useState(0);
  const [calibLines, setCalibLines] = useState<string[]>([]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const heightCm = heightUnit === "cm"
    ? parseFloat(heightVal)
    : parseFloat(heightVal) * 30.48;

  const weightKg = weightUnit === "kg"
    ? parseFloat(weightVal)
    : parseFloat(weightVal) * 0.453592;

  const canAdvance = () => {
    if (step === "sex")      return sex !== null;
    if (step === "age")      return !!age && +age >= 13 && +age <= 100;
    if (step === "height")   return !!heightVal && heightCm > 100 && heightCm < 250;
    if (step === "weight")   return !!weightVal && weightKg > 30 && weightKg < 300;
    if (step === "activity") return activity !== null;
    if (step === "goal")     return goal !== null;
    return true;
  };

  const advance = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  };

  // Calibration sequence
  useEffect(() => {
    if (step !== "calibrating") return;
    const profile: UserProfile = {
      sex: sex!,
      age: +age,
      heightCm,
      weightKg,
      activityLevel: activity!,
      goal: goal!,
    };
    const bmr  = calcBMR(profile);
    const tdee = calcTDEE(profile);
    const hydL = calcHydrationTargetL(profile);
    const slpH = calcSleepTargetH(profile);

    const lines = [
      "SCANNING BIOLOGICAL PARAMETERS...",
      `BMR CALCULATED: ${Math.round(bmr)} KCAL/DAY`,
      `TDEE ESTIMATED: ${tdee} KCAL/DAY`,
      `HYDRATION TARGET: ${hydL}L / DAY`,
      `OPTIMAL SLEEP: ${slpH}H / NIGHT`,
      "METABOLIC PROFILE BUILT.",
      "RECOVERY ALGORITHMS CALIBRATED.",
      "SCORING ENGINE PERSONALISED.",
      "DIGITAL TWIN INITIALISED.",
      "SYSTEM READY.",
    ];

    let i = 0;
    const interval = setInterval(() => {
      setCalibProgress(Math.round(((i + 1) / lines.length) * 100));
      setCalibLines(prev => [...prev, lines[i]]);
      i++;
      if (i >= lines.length) {
        clearInterval(interval);
        setTimeout(() => {
          completeOnboarding(profile);
        }, 800);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [step]);

  const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; sub: string }[] = [
    { id: "sedentary", label: "SEDENTARY",  sub: "Desk job, little movement" },
    { id: "light",     label: "LIGHT",      sub: "1–3 days exercise / week" },
    { id: "moderate",  label: "MODERATE",   sub: "3–5 days exercise / week" },
    { id: "active",    label: "ACTIVE",     sub: "6–7 days exercise / week" },
    { id: "athlete",   label: "ATHLETE",    sub: "Twice daily, elite training" },
  ];

  const GOAL_OPTIONS: { id: Goal; label: string; sub: string }[] = [
    { id: "performance",  label: "PERFORMANCE",      sub: "Maximise output and strength" },
    { id: "composition",  label: "BODY COMPOSITION", sub: "Fat loss, muscle gain" },
    { id: "longevity",    label: "LONGEVITY",        sub: "Health span, disease prevention" },
    { id: "health",       label: "GENERAL HEALTH",   sub: "Balance and wellbeing" },
  ];

  return (
    <div className="min-h-screen bg-[#050a0e] grid-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <ScanLine />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">HUMAN OS v2.0</div>
      <div className="absolute top-6 right-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">BIOMETRIC INIT</div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">SECURE CHANNEL</div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">
        <span className="blink">●</span> ACTIVE
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* BOOT */}
          {step === "boot" && (
            <motion.div
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mx-auto mb-10 w-24 h-24 flex items-center justify-center"
                style={{
                  border: "1px solid rgba(0,212,255,0.4)",
                  boxShadow: "0 0 60px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.05)",
                }}
              >
                <div
                  className="w-8 h-8"
                  style={{
                    background: "#00d4ff",
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    filter: "drop-shadow(0 0 8px #00d4ff)",
                  }}
                />
              </motion.div>

              <div
                className="font-mono text-4xl font-bold tracking-[0.3em] mb-3"
                style={{ color: "#00d4ff", textShadow: "0 0 30px #00d4ff44" }}
              >
                HUMAN OS
              </div>
              <div className="font-mono text-xs text-[#445566] tracking-[0.4em] mb-12">
                BIOLOGICAL PERFORMANCE INTERFACE v2.0
              </div>
              <div className="font-mono text-sm text-[#667788] tracking-wider mb-12 leading-relaxed max-w-sm mx-auto">
                To build your digital twin, we need to calibrate the system to your biology.
                <br /><br />
                This takes 60 seconds.
              </div>
              <motion.button
                onClick={advance}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-cyber px-12 py-4 text-sm tracking-[0.3em]"
                style={{ boxShadow: "0 0 20px #00d4ff22" }}
              >
                INITIALISE PROFILE
              </motion.button>
            </motion.div>
          )}

          {/* SEX */}
          {step === "sex" && (
            <motion.div key="sex" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={1} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 01 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">BIOLOGICAL SEX</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-8">
                Used to calculate metabolic rate and hormonal baselines.
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <BigTile label="MALE"   onClick={() => setSex("male")}   selected={sex === "male"} />
                <BigTile label="FEMALE" onClick={() => setSex("female")} selected={sex === "female"} />
              </div>
              <motion.button
                onClick={advance}
                disabled={!canAdvance()}
                whileHover={{ scale: canAdvance() ? 1.02 : 1 }}
                className="btn-cyber w-full py-3 tracking-[0.2em]"
                style={{ opacity: canAdvance() ? 1 : 0.3 }}
              >
                CONFIRM →
              </motion.button>
            </motion.div>
          )}

          {/* AGE */}
          {step === "age" && (
            <motion.div key="age" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={2} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 02 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">AGE</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">
                Determines sleep targets, recovery windows, and metabolic rate.
              </div>
              <NumberInput value={age} onChange={setAge} unit="years" placeholder="28" min={13} max={100} />
              <div className="mt-10">
                <motion.button
                  onClick={advance}
                  disabled={!canAdvance()}
                  className="btn-cyber w-full py-3 tracking-[0.2em]"
                  style={{ opacity: canAdvance() ? 1 : 0.3 }}
                >
                  CONFIRM →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* HEIGHT */}
          {step === "height" && (
            <motion.div key="height" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={3} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 03 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">HEIGHT</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">
                Used to calculate BMR and body composition estimates.
              </div>
              <NumberInput
                value={heightVal}
                onChange={setHeightVal}
                unit={heightUnit}
                placeholder={heightUnit === "cm" ? "178" : "5.10"}
              />
              <UnitToggle unit={heightUnit} setUnit={setHeightUnit} options={["cm", "ft"]} />
              <div className="mt-10">
                <motion.button
                  onClick={advance}
                  disabled={!canAdvance()}
                  className="btn-cyber w-full py-3 tracking-[0.2em]"
                  style={{ opacity: canAdvance() ? 1 : 0.3 }}
                >
                  CONFIRM →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* WEIGHT */}
          {step === "weight" && (
            <motion.div key="weight" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={4} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 04 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">BODY WEIGHT</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">
                Calibrates hydration targets, protein requirements, and caloric estimates.
              </div>
              <NumberInput
                value={weightVal}
                onChange={setWeightVal}
                unit={weightUnit}
                placeholder={weightUnit === "kg" ? "78" : "172"}
              />
              <UnitToggle unit={weightUnit} setUnit={setWeightUnit} options={["kg", "lbs"]} />
              <div className="mt-10">
                <motion.button
                  onClick={advance}
                  disabled={!canAdvance()}
                  className="btn-cyber w-full py-3 tracking-[0.2em]"
                  style={{ opacity: canAdvance() ? 1 : 0.3 }}
                >
                  CONFIRM →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ACTIVITY */}
          {step === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={5} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 05 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">ACTIVITY LEVEL</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-6">
                Sets your total daily energy expenditure multiplier.
              </div>
              <div className="flex flex-col gap-2 mb-8">
                {ACTIVITY_OPTIONS.map(o => (
                  <BigTile
                    key={o.id}
                    label={o.label}
                    sublabel={o.sub}
                    selected={activity === o.id}
                    onClick={() => setActivity(o.id)}
                  />
                ))}
              </div>
              <motion.button
                onClick={advance}
                disabled={!canAdvance()}
                className="btn-cyber w-full py-3 tracking-[0.2em]"
                style={{ opacity: canAdvance() ? 1 : 0.3 }}
              >
                CONFIRM →
              </motion.button>
            </motion.div>
          )}

          {/* GOAL */}
          {step === "goal" && (
            <motion.div key="goal" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel current={6} total={6} />
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">STEP 06 / 06</div>
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">PRIMARY GOAL</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-6">
                Adjusts score weighting to prioritise what matters most to you.
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {GOAL_OPTIONS.map(o => (
                  <BigTile
                    key={o.id}
                    label={o.label}
                    sublabel={o.sub}
                    selected={goal === o.id}
                    onClick={() => setGoal(o.id)}
                    color="#00ff88"
                  />
                ))}
              </div>
              <motion.button
                onClick={advance}
                disabled={!canAdvance()}
                className="btn-cyber w-full py-3 tracking-[0.2em]"
                style={{ opacity: canAdvance() ? 1 : 0.3 }}
              >
                BUILD MY TWIN →
              </motion.button>
            </motion.div>
          )}

          {/* CALIBRATING */}
          {step === "calibrating" && (
            <motion.div key="calib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-8 text-center">
                BUILDING YOUR DIGITAL TWIN
              </div>

              {/* Progress bar */}
              <div className="w-full h-px bg-[#1a2a3a] mb-2">
                <motion.div
                  className="h-full"
                  style={{ background: "#00d4ff", boxShadow: "0 0 8px #00d4ff" }}
                  animate={{ width: `${calibProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mb-10">
                <span className="font-mono text-[9px] text-[#334455]">CALIBRATING</span>
                <span className="font-mono text-[9px]" style={{ color: "#00d4ff" }}>{calibProgress}%</span>
              </div>

              {/* Log lines */}
              <div className="flex flex-col gap-2 min-h-[200px]">
                <AnimatePresence>
                  {calibLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-mono text-[11px] flex items-center gap-2"
                      style={{ color: i === calibLines.length - 1 ? "#00d4ff" : "#445566" }}
                    >
                      <span style={{ color: "#00d4ff44" }}>›</span>
                      {line}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
