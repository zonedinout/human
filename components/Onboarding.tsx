"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthStore } from "@/lib/store";
import type { Sex, ActivityLevel, Goal, DietaryStyle, Allergy, UserProfile } from "@/lib/store";
import { calcBMR, calcTDEE, calcHydrationTargetL, calcSleepTargetH, calcProteinTargetG } from "@/lib/bioEngine";

type Step = "boot" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "allergies" | "diet" | "calibrating";

const STEP_ORDER: Step[] = ["boot", "sex", "age", "height", "weight", "activity", "goal", "allergies", "diet", "calibrating"];
const NUMBERED_STEPS: Step[] = ["sex", "age", "height", "weight", "activity", "goal", "allergies", "diet"];
const TOTAL_STEPS = NUMBERED_STEPS.length;

function StepLabel({ step }: { step: Step }) {
  const idx = NUMBERED_STEPS.indexOf(step);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className="h-px flex-1 transition-all duration-500"
          style={{ background: i <= idx ? "#00d4ff" : "#1a2a3a" }}
        />
      ))}
    </div>
  );
}

function StepNum({ step }: { step: Step }) {
  const idx = NUMBERED_STEPS.indexOf(step) + 1;
  return (
    <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-2">
      STEP {String(idx).padStart(2,"0")} / {String(TOTAL_STEPS).padStart(2,"0")}
    </div>
  );
}

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, #00d4ff33, transparent)" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
  );
}

function BigTile({
  label, sublabel, selected, onClick, color = "#00d4ff",
}: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void; color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative p-6 text-left transition-all duration-300 corner-brackets w-full"
      style={{
        background: selected ? `${color}12` : "rgba(8,15,20,0.8)",
        border: `1px solid ${selected ? color : "#1a2a3a"}`,
        boxShadow: selected ? `0 0 28px ${color}22` : "none",
      }}
    >
      <div className="font-mono text-lg font-bold tracking-[0.2em] mb-1" style={{ color: selected ? color : "#aabbcc" }}>
        {label}
      </div>
      {sublabel && <div className="font-mono text-[10px] text-[#445566] tracking-widest">{sublabel}</div>}
      {selected && (
        <motion.div
          layoutId={`tile-${color}`}
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
    </motion.button>
  );
}

function ToggleTile({
  label, sublabel, selected, onClick, color = "#00d4ff",
}: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void; color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative p-4 text-left transition-all duration-200 w-full"
      style={{
        background: selected ? `${color}14` : "rgba(8,15,20,0.6)",
        border: `1px solid ${selected ? color : "#1a2a3a"}`,
        boxShadow: selected ? `0 0 16px ${color}22` : "none",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 shrink-0 flex items-center justify-center border"
          style={{ borderColor: selected ? color : "#2a3a44", background: selected ? color + "22" : "transparent" }}
        >
          {selected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2" style={{ background: color }} />
          )}
        </div>
        <div>
          <div className="font-mono text-sm font-bold tracking-[0.15em]" style={{ color: selected ? color : "#8899aa" }}>
            {label}
          </div>
          {sublabel && <div className="font-mono text-[9px] text-[#445566] tracking-widest">{sublabel}</div>}
        </div>
      </div>
    </motion.button>
  );
}

function NumberInput({
  value, onChange, unit, placeholder, min, max,
}: {
  value: string; onChange: (v: string) => void; unit: string; placeholder: string; min?: number; max?: number;
}) {
  return (
    <div className="flex items-end gap-4">
      <div className="flex-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min} max={max} autoFocus
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

  const [step, setStep]             = useState<Step>("boot");
  const [sex, setSex]               = useState<Sex | null>(null);
  const [age, setAge]               = useState("");
  const [heightVal, setHeightVal]   = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weightVal, setWeightVal]   = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [activity, setActivity]     = useState<ActivityLevel | null>(null);
  const [goal, setGoal]             = useState<Goal | null>(null);
  const [allergies, setAllergies]   = useState<Allergy[]>([]);
  const [noAllergies, setNoAllergies] = useState(false);
  const [dietStyle, setDietStyle]   = useState<DietaryStyle | null>(null);
  const [calibProgress, setCalibProgress] = useState(0);
  const [calibLines, setCalibLines] = useState<string[]>([]);

  const heightCm = heightUnit === "cm" ? parseFloat(heightVal) : parseFloat(heightVal) * 30.48;
  const weightKg = weightUnit === "kg" ? parseFloat(weightVal) : parseFloat(weightVal) * 0.453592;

  const toggleAllergy = (a: Allergy) => {
    setNoAllergies(false);
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const canAdvance = () => {
    if (step === "sex")      return sex !== null;
    if (step === "age")      return !!age && +age >= 13 && +age <= 100;
    if (step === "height")   return !!heightVal && heightCm > 100 && heightCm < 250;
    if (step === "weight")   return !!weightVal && weightKg > 30 && weightKg < 300;
    if (step === "activity") return activity !== null;
    if (step === "goal")     return goal !== null;
    if (step === "allergies")return noAllergies || allergies.length > 0;
    if (step === "diet")     return dietStyle !== null;
    return true;
  };

  const advance = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  // Calibration
  useEffect(() => {
    if (step !== "calibrating") return;
    const profile: UserProfile = {
      sex: sex!, age: +age, heightCm, weightKg,
      activityLevel: activity!, goal: goal!,
      dietaryStyle: dietStyle!, allergies,
    };
    const bmr    = calcBMR(profile);
    const tdee   = calcTDEE(profile);
    const hydL   = calcHydrationTargetL(profile);
    const slpH   = calcSleepTargetH(profile);
    const protG  = calcProteinTargetG(profile);
    const dietLbl = dietStyle!.toUpperCase();
    const allergyLbl = allergies.length > 0 ? allergies.map(a => a.toUpperCase()).join(", ") : "NONE";

    const lines = [
      "SCANNING BIOLOGICAL PARAMETERS...",
      `BMR CALCULATED: ${Math.round(bmr)} KCAL/DAY`,
      `TDEE ESTIMATED: ${tdee} KCAL/DAY`,
      `HYDRATION TARGET: ${hydL}L / DAY`,
      `OPTIMAL SLEEP: ${slpH}H / NIGHT`,
      `PROTEIN TARGET: ${protG}G / DAY`,
      `DIETARY PROFILE: ${dietLbl}`,
      `ALLERGY FLAGS: ${allergyLbl}`,
      "NUTRITION PROTOCOL PERSONALISED.",
      "MEAL TIMING CALIBRATED.",
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
        setTimeout(() => completeOnboarding(profile), 800);
      }
    }, 300);

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

  const ALLERGY_OPTIONS: { id: Allergy; label: string; sub: string }[] = [
    { id: "dairy",    label: "DAIRY",    sub: "Milk, cheese, whey, casein" },
    { id: "gluten",   label: "GLUTEN",   sub: "Wheat, barley, rye, oats" },
    { id: "eggs",     label: "EGGS",     sub: "All egg products" },
    { id: "nuts",     label: "NUTS",     sub: "Tree nuts (almonds, cashews, etc.)" },
    { id: "soy",      label: "SOY",      sub: "Soy, tofu, tempeh, edamame" },
    { id: "shellfish",label: "SHELLFISH",sub: "Shrimp, crab, lobster, oysters" },
  ];

  const DIET_OPTIONS: { id: DietaryStyle; label: string; sub: string; color: string }[] = [
    { id: "omnivore",    label: "OMNIVORE",   sub: "Eat everything",              color: "#00d4ff" },
    { id: "vegetarian",  label: "VEGETARIAN", sub: "No meat, includes dairy/eggs", color: "#00ff88" },
    { id: "vegan",       label: "VEGAN",      sub: "No animal products",           color: "#00ff88" },
    { id: "keto",        label: "KETO",       sub: "High fat, <50g carbs/day",     color: "#ffaa00" },
    { id: "paleo",       label: "PALEO",      sub: "Meat, fish, veg, fruit, nuts", color: "#ff8c42" },
  ];

  return (
    <div className="min-h-screen bg-[#050a0e] grid-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <ScanLine />
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">HUMAN OS v2.0</div>
      <div className="absolute top-6 right-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">BIOMETRIC INIT</div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]">SECURE CHANNEL</div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-[#334455] tracking-[0.3em]"><span className="blink">●</span> ACTIVE</div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* BOOT */}
          {step === "boot" && (
            <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mx-auto mb-10 w-24 h-24 flex items-center justify-center"
                style={{ border: "1px solid rgba(0,212,255,0.4)", boxShadow: "0 0 60px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.05)" }}
              >
                <div className="w-8 h-8" style={{ background: "#00d4ff", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", filter: "drop-shadow(0 0 8px #00d4ff)" }} />
              </motion.div>
              <div className="font-mono text-4xl font-bold tracking-[0.3em] mb-3" style={{ color: "#00d4ff", textShadow: "0 0 30px #00d4ff44" }}>HUMAN OS</div>
              <div className="font-mono text-xs text-[#445566] tracking-[0.4em] mb-12">BIOLOGICAL PERFORMANCE INTERFACE v2.0</div>
              <div className="font-mono text-sm text-[#667788] tracking-wider mb-12 leading-relaxed max-w-sm mx-auto">
                To build your digital twin, we need to calibrate the system to your biology.
                <br /><br />
                Includes metabolism, nutrition, allergies, and sleep. Takes 90 seconds.
              </div>
              <motion.button onClick={advance} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-cyber px-12 py-4 text-sm tracking-[0.3em]">
                INITIALISE PROFILE
              </motion.button>
            </motion.div>
          )}

          {/* SEX */}
          {step === "sex" && (
            <motion.div key="sex" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">BIOLOGICAL SEX</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-8">Used to calculate metabolic rate and hormonal baselines.</div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <BigTile label="MALE"   onClick={() => setSex("male")}   selected={sex === "male"} />
                <BigTile label="FEMALE" onClick={() => setSex("female")} selected={sex === "female"} />
              </div>
              <motion.button onClick={advance} disabled={!canAdvance()} whileHover={{ scale: canAdvance() ? 1.02 : 1 }} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
            </motion.div>
          )}

          {/* AGE */}
          {step === "age" && (
            <motion.div key="age" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">AGE</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">Determines sleep targets, recovery windows, and metabolic rate.</div>
              <NumberInput value={age} onChange={setAge} unit="years" placeholder="28" min={13} max={100} />
              <div className="mt-10">
                <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
              </div>
            </motion.div>
          )}

          {/* HEIGHT */}
          {step === "height" && (
            <motion.div key="height" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">HEIGHT</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">Used to calculate BMR and body composition estimates.</div>
              <NumberInput value={heightVal} onChange={setHeightVal} unit={heightUnit} placeholder={heightUnit === "cm" ? "178" : "5.10"} />
              <UnitToggle unit={heightUnit} setUnit={setHeightUnit} options={["cm", "ft"]} />
              <div className="mt-10">
                <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
              </div>
            </motion.div>
          )}

          {/* WEIGHT */}
          {step === "weight" && (
            <motion.div key="weight" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">BODY WEIGHT</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-10">Calibrates hydration targets, protein requirements, and caloric estimates.</div>
              <NumberInput value={weightVal} onChange={setWeightVal} unit={weightUnit} placeholder={weightUnit === "kg" ? "78" : "172"} />
              <UnitToggle unit={weightUnit} setUnit={setWeightUnit} options={["kg", "lbs"]} />
              <div className="mt-10">
                <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
              </div>
            </motion.div>
          )}

          {/* ACTIVITY */}
          {step === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">ACTIVITY LEVEL</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-6">Sets your total daily energy expenditure multiplier.</div>
              <div className="flex flex-col gap-2 mb-8">
                {ACTIVITY_OPTIONS.map(o => (
                  <BigTile key={o.id} label={o.label} sublabel={o.sub} selected={activity === o.id} onClick={() => setActivity(o.id)} />
                ))}
              </div>
              <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
            </motion.div>
          )}

          {/* GOAL */}
          {step === "goal" && (
            <motion.div key="goal" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-2">PRIMARY GOAL</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-6">Adjusts score weighting and nutrition protocols.</div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {GOAL_OPTIONS.map(o => (
                  <BigTile key={o.id} label={o.label} sublabel={o.sub} selected={goal === o.id} onClick={() => setGoal(o.id)} color="#00ff88" />
                ))}
              </div>
              <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
            </motion.div>
          )}

          {/* ALLERGIES */}
          {step === "allergies" && (
            <motion.div key="allergies" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-1">FOOD ALLERGIES</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-2">
                Select all that apply. The system will personalise protein sources and flag nutrient risks.
              </div>
              <div className="font-mono text-[9px] text-[#334455] tracking-widest mb-6">
                You can select multiple. All recommendations will respect your restrictions.
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {ALLERGY_OPTIONS.map(o => (
                  <ToggleTile
                    key={o.id}
                    label={o.label}
                    sublabel={o.sub}
                    selected={allergies.includes(o.id)}
                    onClick={() => toggleAllergy(o.id)}
                    color="#ff6b6b"
                  />
                ))}
              </div>

              {/* No allergies button */}
              <motion.button
                onClick={() => { setAllergies([]); setNoAllergies(true); }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full p-4 mb-6 font-mono text-sm tracking-widest transition-all"
                style={{
                  border: `1px solid ${noAllergies ? "#00ff88" : "#1a2a3a"}`,
                  background: noAllergies ? "rgba(0,255,136,0.1)" : "rgba(8,15,20,0.6)",
                  color: noAllergies ? "#00ff88" : "#445566",
                }}
              >
                NO ALLERGIES OR INTOLERANCES
              </motion.button>

              <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>CONFIRM →</motion.button>
            </motion.div>
          )}

          {/* DIETARY STYLE */}
          {step === "diet" && (
            <motion.div key="diet" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <StepLabel step={step} />
              <StepNum step={step} />
              <div className="font-mono text-2xl font-bold text-white tracking-wider mb-1">DIETARY STYLE</div>
              <div className="font-mono text-[10px] text-[#445566] tracking-widest mb-6">
                Personalises meal timing, protein sources, and supplement recommendations.
              </div>
              <div className="flex flex-col gap-2 mb-8">
                {DIET_OPTIONS.map(o => (
                  <BigTile
                    key={o.id}
                    label={o.label}
                    sublabel={o.sub}
                    selected={dietStyle === o.id}
                    onClick={() => setDietStyle(o.id)}
                    color={o.color}
                  />
                ))}
              </div>
              <motion.button onClick={advance} disabled={!canAdvance()} className="btn-cyber w-full py-3 tracking-[0.2em]" style={{ opacity: canAdvance() ? 1 : 0.3 }}>BUILD MY TWIN →</motion.button>
            </motion.div>
          )}

          {/* CALIBRATING */}
          {step === "calibrating" && (
            <motion.div key="calib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <div className="font-mono text-[9px] text-[#445566] tracking-[0.3em] mb-8 text-center">BUILDING YOUR DIGITAL TWIN</div>
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
              <div className="flex flex-col gap-2 min-h-[240px]">
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
