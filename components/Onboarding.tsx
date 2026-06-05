"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useHealthStore } from "@/lib/store";
import type { Sex, ActivityLevel, Goal, DietaryStyle, Allergy, UserProfile } from "@/lib/store";
import { calcBMR, calcTDEE, calcHydrationTargetL, calcSleepTargetH, calcProteinTargetG } from "@/lib/bioEngine";

// ─── Deterministic star field (no hydration mismatch) ─────────────────────
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.508) % 100,
  y: (i * 97.31)   % 100,
  r: i % 4 === 0 ? 1.2 : i % 3 === 0 ? 0.9 : 0.5,
  o: 0.08 + (i % 7) * 0.06,
  d: 2.5 + (i % 5),
}));

// ─── Sound Engine ──────────────────────────────────────────────────────────
function useSound() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [muted, setMuted] = useState(false);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 4);
      master.connect(ctx.destination);
      masterRef.current = master;

      // Reverb via delay+feedback
      const delay    = ctx.createDelay(1.8);
      delay.delayTime.value = 0.45;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.38;
      const wetGain  = ctx.createGain();
      wetGain.gain.value = 0.28;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(master);

      // Harmonic drone — A1, E2, A2 (55, 82.5, 110 Hz)
      [[55, 0.45], [82.5, 0.22], [110, 0.14], [165, 0.09]].forEach(([freq, vol]) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type  = "sine";
        osc.frequency.value = freq;
        // Slight detuning per oscillator for warmth
        osc.detune.value = (freq % 7) - 3;
        g.gain.value = vol;
        osc.connect(g);
        g.connect(delay);
        g.connect(master);
        osc.start();
      });
    } catch (_) { /* AudioContext blocked */ }
  }, []);

  const chime = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || muted) return;
    // 528 Hz — gentle step-advance tone
    [528, 792, 1056].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type  = "sine";
      osc.frequency.value = freq;
      const t0  = ctx.currentTime + i * 0.05;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.1 : 0.05, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 2.5);
    });
  }, [muted]);

  const complete = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Rising chord — awakening
    [396, 528, 660, 792, 1056].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type  = "sine";
      osc.frequency.value = freq;
      const t0  = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 5);
    });
  }, []);

  const toggleMute = useCallback(() => {
    const master = masterRef.current;
    const ctx    = ctxRef.current;
    if (!master || !ctx) return;
    setMuted(prev => {
      const next = !prev;
      master.gain.linearRampToValueAtTime(next ? 0 : 0.055, ctx.currentTime + 0.8);
      return next;
    });
  }, []);

  const fadeOut = useCallback(() => {
    const master = masterRef.current;
    const ctx    = ctxRef.current;
    if (master && ctx) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
  }, []);

  return { init, chime, complete, toggleMute, muted, fadeOut };
}

// ─── Cosmic Background ─────────────────────────────────────────────────────
function CosmicBg({ phase }: { phase: number }) {
  const vA = Math.round((0.22 + phase * 0.06) * 255).toString(16).padStart(2, "0");
  const tA = Math.round((0.10 + phase * 0.06) * 255).toString(16).padStart(2, "0");
  const wA = Math.round(phase * 0.14 * 255).toString(16).padStart(2, "0");

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#070510" }} />

      {/* Nebula violet */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "100vw", height: "100vw",
          top: "-35%", left: "-30%",
          background: `radial-gradient(circle, #7840c8${vA} 0%, transparent 65%)`,
          filter: "blur(70px)",
        }}
        animate={{ x: [0, 35, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nebula teal */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "80vw", height: "80vw",
          bottom: "-20%", right: "-20%",
          background: `radial-gradient(circle, #00b8c8${tA} 0%, transparent 65%)`,
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nebula warm */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55vw", height: "55vw",
          top: "35%", right: "0%",
          background: `radial-gradient(circle, #c85820${wA} 0%, transparent 65%)`,
          filter: "blur(50px)",
        }}
        animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: s.r, height: s.r, top: `${s.y}%`, left: `${s.x}%`, opacity: s.o }}
          animate={{ opacity: [s.o, s.o * 0.2, s.o] }}
          transition={{ duration: s.d, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.4 }}
        />
      ))}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(4,3,10,0.7) 100%)" }}
      />
    </div>
  );
}

// ─── Breathing Orb ─────────────────────────────────────────────────────────
function BreathingOrb({ progress, awakening = false }: { progress: number; awakening?: boolean }) {
  const size = 80 + progress * 48;
  const r = progress < 0.35 ? "#9b7fd4"
          : progress < 0.65 ? "#4dd0c4"
          : "#d4956b";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 80, height: size + 80 }}>
      {/* Outermost pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: size + 72, height: size + 72, border: `1px solid ${r}1a` }}
        animate={awakening
          ? { scale: [1, 2.5], opacity: [0.6, 0] }
          : { scale: [1, 1.18, 1], opacity: [0.15, 0.04, 0.15] }
        }
        transition={awakening
          ? { duration: 2, ease: "easeOut" }
          : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      />
      {/* Mid ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: size + 44, height: size + 44, border: `1px solid ${r}33` }}
        animate={awakening
          ? { scale: [1, 2], opacity: [0.8, 0] }
          : { scale: [1, 1.1, 1], opacity: [0.3, 0.08, 0.3] }
        }
        transition={awakening
          ? { duration: 2, delay: 0.2, ease: "easeOut" }
          : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
        }
      />
      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: size + 20, height: size + 20, border: `1px solid ${r}55` }}
        animate={awakening
          ? { scale: [1, 1.5], opacity: [1, 0] }
          : { scale: [1, 1.06, 1], opacity: [0.5, 0.15, 0.5] }
        }
        transition={awakening
          ? { duration: 1.8, delay: 0.4, ease: "easeOut" }
          : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
        }
      />
      {/* Core */}
      <motion.div
        className="rounded-full"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 38% 32%, ${r}cc 0%, ${r}66 45%, ${r}1a 100%)`,
          boxShadow: `0 0 ${30 + progress * 40}px ${r}55, 0 0 ${60 + progress * 60}px ${r}22`,
        }}
        animate={awakening
          ? { scale: [1, 1.6, 0.95], opacity: [1, 1, 1] }
          : { scale: [1, 1.05, 1] }
        }
        transition={awakening
          ? { duration: 1.5, ease: "easeOut" }
          : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </div>
  );
}

// ─── Progress dots ─────────────────────────────────────────────────────────
const STEPS_LABELED = ["sex","age","height","weight","activity","goal","allergies","diet"] as const;

function ProgressDots({ current }: { current: string }) {
  const idx = STEPS_LABELED.indexOf(current as typeof STEPS_LABELED[number]);
  if (idx === -1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS_LABELED.map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ background: i < idx ? "rgba(255,255,255,0.5)" : i === idx ? "white" : "rgba(255,255,255,0.12)" }}
          animate={{ width: i === idx ? 20 : 6, height: 6 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Soft option tile ──────────────────────────────────────────────────────
function SoftTile({
  label, sub, selected, onClick, accent = "#9b7fd4",
}: {
  label: string; sub?: string; selected: boolean; onClick: () => void; accent?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="w-full p-5 text-left transition-all duration-300 relative"
      style={{
        background: selected ? `${accent}14` : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? accent + "55" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "6px",
        boxShadow: selected ? `0 0 30px ${accent}18, inset 0 0 20px ${accent}08` : "none",
      }}
    >
      <div
        className="text-base font-light tracking-wide mb-0.5"
        style={{
          color: selected ? "#e8e4e0" : "#8a8595",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.95rem",
        }}
      >
        {label}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: selected ? "#6a6480" : "#3a3550", fontFamily: "Inter, sans-serif" }}>
          {sub}
        </div>
      )}
      {selected && (
        <motion.div
          layoutId="sel"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      )}
    </motion.button>
  );
}

// ─── Soft toggle tile ──────────────────────────────────────────────────────
function SoftToggle({
  label, sub, selected, onClick,
}: {
  label: string; sub?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full px-4 py-3.5 text-left transition-all duration-200 flex items-center gap-3"
      style={{
        background: selected ? "rgba(155,127,212,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? "rgba(155,127,212,0.4)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "6px",
      }}
    >
      <div
        className="w-4 h-4 rounded-sm shrink-0 flex items-center justify-center border"
        style={{
          borderColor: selected ? "#9b7fd4" : "rgba(255,255,255,0.15)",
          background: selected ? "rgba(155,127,212,0.2)" : "transparent",
        }}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-sm"
            style={{ background: "#9b7fd4" }}
          />
        )}
      </div>
      <div>
        <div className="text-sm font-light" style={{ color: selected ? "#d4cfe8" : "#5a5570", fontFamily: "Inter, sans-serif" }}>
          {label}
        </div>
        {sub && <div className="text-xs" style={{ color: "#2e2b3a", fontFamily: "Inter, sans-serif" }}>{sub}</div>}
      </div>
    </motion.button>
  );
}

// ─── Continue button ───────────────────────────────────────────────────────
function ContinueButton({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled: boolean; label?: string }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full py-3.5 transition-all duration-300"
      style={{
        background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.18)"}`,
        borderRadius: "6px",
        color: disabled ? "#2e2b3a" : "#d4cfe8",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.8rem",
        letterSpacing: "0.18em",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 0 20px rgba(255,255,255,0.04)",
      }}
    >
      {label}
    </motion.button>
  );
}

// ─── Number input ─────────────────────────────────────────────────────────
function SoftNumberInput({ value, onChange, unit, placeholder }: {
  value: string; onChange: (v: string) => void; unit: string; placeholder: string;
}) {
  return (
    <div className="flex items-end gap-3">
      <input
        type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus
        className="flex-1 bg-transparent outline-none pb-2 text-6xl font-light"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          color: "#e8e4e0", fontFamily: "Inter, sans-serif",
          caretColor: "#9b7fd4",
        }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "#9b7fd4aa"; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "rgba(255,255,255,0.12)"; }}
      />
      <div className="pb-3 text-sm" style={{ color: "#3a3550", fontFamily: "Inter, sans-serif", letterSpacing: "0.1em" }}>
        {unit}
      </div>
    </div>
  );
}

function UnitPill({ unit, setUnit, options }: { unit: string; setUnit: (u: string) => void; options: string[] }) {
  return (
    <div className="flex gap-1 mt-3">
      {options.map(o => (
        <button
          key={o}
          onClick={() => setUnit(o)}
          className="px-3 py-1 text-xs transition-all"
          style={{
            borderRadius: "4px",
            color: unit === o ? "#9b7fd4" : "#3a3550",
            background: unit === o ? "rgba(155,127,212,0.12)" : "transparent",
            border: `1px solid ${unit === o ? "rgba(155,127,212,0.3)" : "transparent"}`,
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.08em",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Question heading ──────────────────────────────────────────────────────
function Q({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-1.5 font-light leading-snug"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", color: "#d4cfe8", letterSpacing: "-0.01em" }}
    >
      {children}
    </h2>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 text-sm font-light" style={{ color: "#3a3550", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

// ─── Step order ────────────────────────────────────────────────────────────
type Step = "boot" | "sex" | "age" | "height" | "weight" | "activity" | "goal" | "allergies" | "diet" | "calibrating";
const STEP_ORDER: Step[] = ["boot","sex","age","height","weight","activity","goal","allergies","diet","calibrating"];

// ─── Main component ────────────────────────────────────────────────────────
export default function Onboarding() {
  const completeOnboarding = useHealthStore(s => s.completeOnboarding);
  const sound = useSound();

  const [step, setStep]         = useState<Step>("boot");
  const [sex, setSex]           = useState<Sex | null>(null);
  const [age, setAge]           = useState("");
  const [heightVal, setHV]      = useState("");
  const [heightUnit, setHUnit]  = useState("cm");
  const [weightVal, setWV]      = useState("");
  const [weightUnit, setWUnit]  = useState("kg");
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [goal, setGoal]         = useState<Goal | null>(null);
  const [allergies, setAlly]    = useState<Allergy[]>([]);
  const [noAlly, setNoAlly]     = useState(false);
  const [diet, setDiet]         = useState<DietaryStyle | null>(null);
  const [calibPct, setCalibPct] = useState(0);
  const [calibLines, setCalibLines] = useState<string[]>([]);
  const [awakening, setAwakening] = useState(false);

  const heightCm = heightUnit === "cm" ? parseFloat(heightVal) : parseFloat(heightVal) * 30.48;
  const weightKg = weightUnit === "kg" ? parseFloat(weightVal) : parseFloat(weightVal) * 0.453592;

  const toggleAlly = (a: Allergy) => {
    setNoAlly(false);
    setAlly(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const progress = STEP_ORDER.indexOf(step) / (STEP_ORDER.length - 1);

  const canAdvance = () => {
    if (step === "sex")       return sex !== null;
    if (step === "age")       return !!age && +age >= 13 && +age <= 100;
    if (step === "height")    return !!heightVal && heightCm > 100 && heightCm < 250;
    if (step === "weight")    return !!weightVal && weightKg > 30 && weightKg < 300;
    if (step === "activity")  return activity !== null;
    if (step === "goal")      return goal !== null;
    if (step === "allergies") return noAlly || allergies.length > 0;
    if (step === "diet")      return diet !== null;
    return true;
  };

  const advance = () => {
    if (!canAdvance()) return;
    sound.chime();
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const handleBoot = () => {
    sound.init();
    sound.chime();
    setStep("sex");
  };

  // Calibration sequence
  useEffect(() => {
    if (step !== "calibrating") return;
    const profile: UserProfile = {
      sex: sex!, age: +age, heightCm, weightKg,
      activityLevel: activity!, goal: goal!,
      dietaryStyle: diet!, allergies,
    };

    const bmr   = calcBMR(profile);
    const tdee  = calcTDEE(profile);
    const hydL  = calcHydrationTargetL(profile);
    const slpH  = calcSleepTargetH(profile);
    const protG = calcProteinTargetG(profile);

    const lines = [
      "Reading your biology...",
      `Metabolic rate — ${Math.round(bmr)} kcal at rest`,
      `Daily energy target — ${tdee} kcal`,
      `Hydration protocol — ${hydL}L per day`,
      `Sleep architecture — ${slpH}h optimal window`,
      `Protein synthesis target — ${protG}g daily`,
      `Dietary profile — ${diet}`,
      allergies.length > 0 ? `Allergy flags — ${allergies.join(", ")}` : "No allergy flags",
      "Calibrating your recovery engine...",
      "Building circadian blueprint...",
      "Your digital twin is awakening.",
    ];

    let i = 0;
    const interval = setInterval(() => {
      setCalibPct(Math.round(((i + 1) / lines.length) * 100));
      setCalibLines(prev => [...prev, lines[i]]);
      i++;
      if (i >= lines.length) {
        clearInterval(interval);
        setAwakening(true);
        sound.complete();
        setTimeout(() => {
          sound.fadeOut();
          completeOnboarding(profile);
        }, 2200);
      }
    }, 320);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const ACTIVITY_OPTS: { id: ActivityLevel; label: string; sub: string }[] = [
    { id: "sedentary", label: "Sedentary",  sub: "Mostly sitting, little intentional movement" },
    { id: "light",     label: "Light",      sub: "1–3 workouts per week" },
    { id: "moderate",  label: "Moderate",   sub: "3–5 workouts per week" },
    { id: "active",    label: "Active",     sub: "6–7 days per week, high intensity" },
    { id: "athlete",   label: "Athlete",    sub: "Twice daily or elite-level training" },
  ];

  const GOAL_OPTS: { id: Goal; label: string; sub: string; accent: string }[] = [
    { id: "performance",  label: "Peak performance",    sub: "Maximise strength, speed and output",   accent: "#4dd0c4" },
    { id: "composition",  label: "Body composition",    sub: "Lean out, build muscle, recomp",        accent: "#d4956b" },
    { id: "longevity",    label: "Longevity",           sub: "Health span, disease prevention",       accent: "#9b7fd4" },
    { id: "health",       label: "General health",      sub: "Energy, balance and wellbeing",         accent: "#6ba8d4" },
  ];

  const ALLERGY_OPTS: { id: Allergy; sub: string }[] = [
    { id: "dairy",    sub: "Milk, cheese, whey, casein" },
    { id: "gluten",   sub: "Wheat, barley, rye, oats" },
    { id: "eggs",     sub: "All egg products" },
    { id: "nuts",     sub: "Tree nuts — almonds, cashews, walnuts" },
    { id: "soy",      sub: "Soy, tofu, tempeh, edamame" },
    { id: "shellfish",sub: "Shrimp, crab, lobster, oysters" },
  ];

  const DIET_OPTS: { id: DietaryStyle; label: string; sub: string; accent: string }[] = [
    { id: "omnivore",   label: "Omnivore",    sub: "Everything — meat, fish, dairy, plants",   accent: "#d4cfe8" },
    { id: "vegetarian", label: "Vegetarian",  sub: "No meat, includes dairy and eggs",         accent: "#6bc47a" },
    { id: "vegan",      label: "Vegan",       sub: "No animal products whatsoever",            accent: "#6bc47a" },
    { id: "keto",       label: "Ketogenic",   sub: "High fat, very low carb — under 50g/day", accent: "#d4956b" },
    { id: "paleo",      label: "Paleo",       sub: "Meat, fish, veg, fruit — no grains/dairy", accent: "#c47a6b" },
  ];

  const slideVariants = {
    initial: { opacity: 0, x: 40, filter: "blur(4px)" },
    animate: { opacity: 1, x: 0,  filter: "blur(0px)" },
    exit:    { opacity: 0, x: -30, filter: "blur(3px)" },
  };
  const transition = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ background: "#070510" }}>
      <CosmicBg phase={progress} />

      {/* Sound toggle */}
      <motion.button
        onClick={sound.toggleMute}
        className="fixed top-6 right-6 z-50 p-2"
        style={{ color: "#2e2b3a" }}
        whileHover={{ color: "#6a6480" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: step !== "boot" ? 1 : 0 }}
      >
        {sound.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </motion.button>

      {/* Orb (all steps except boot) */}
      <AnimatePresence>
        {step !== "boot" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
            style={{ zIndex: 1 }}
          >
            <BreathingOrb progress={progress} awakening={awakening} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md relative" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── BOOT ────────────────────────────────────────────────────── */}
          {step === "boot" && (
            <motion.div
              key="boot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              {/* Large central orb for boot */}
              <div className="flex justify-center mb-12">
                <BreathingOrb progress={0} />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs mb-3 tracking-[0.4em] uppercase"
                style={{ color: "#3a3550", fontFamily: "Inter, sans-serif" }}
              >
                Human OS
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2.6rem", color: "#d4cfe8", fontWeight: 300, lineHeight: 1.2 }}
                className="mb-4"
              >
                A new version of<br />you begins here.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-sm font-light mb-12 mx-auto max-w-xs leading-relaxed"
                style={{ color: "#3a3550", fontFamily: "Inter, sans-serif" }}
              >
                Your biology, calibrated. Your potential, unlocked.
                <br />Takes 90 seconds.
              </motion.p>

              <motion.button
                onClick={handleBoot}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-3.5 text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "6px",
                  color: "#d4cfe8",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.2em",
                  boxShadow: "0 0 30px rgba(155,127,212,0.08)",
                }}
              >
                Begin
              </motion.button>
            </motion.div>
          )}

          {/* ── SEX ─────────────────────────────────────────────────────── */}
          {step === "sex" && (
            <motion.div key="sex" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>What is your biological sex?</Q>
              <Hint>Used to accurately calculate your metabolic rate, hormonal baselines, and recovery patterns.</Hint>
              <div className="flex flex-col gap-2.5 mb-8">
                <SoftTile label="Male"   sub="Testosterone-dominant physiology"  selected={sex === "male"}   onClick={() => setSex("male")} />
                <SoftTile label="Female" sub="Estrogen-dominant physiology"       selected={sex === "female"} onClick={() => setSex("female")} />
              </div>
              <ContinueButton onClick={advance} disabled={!canAdvance()} />
            </motion.div>
          )}

          {/* ── AGE ─────────────────────────────────────────────────────── */}
          {step === "age" && (
            <motion.div key="age" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>How many years have you been here?</Q>
              <Hint>Your age calibrates sleep targets, recovery windows, and how your metabolism shifts over time.</Hint>
              <div className="mb-10">
                <SoftNumberInput value={age} onChange={setAge} unit="years" placeholder="28" />
              </div>
              <ContinueButton onClick={advance} disabled={!canAdvance()} />
            </motion.div>
          )}

          {/* ── HEIGHT ──────────────────────────────────────────────────── */}
          {step === "height" && (
            <motion.div key="height" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>How tall are you?</Q>
              <Hint>Used to calculate your basal metabolic rate and body composition estimates.</Hint>
              <div className="mb-2">
                <SoftNumberInput value={heightVal} onChange={setHV} unit={heightUnit} placeholder={heightUnit === "cm" ? "178" : "5.10"} />
                <UnitPill unit={heightUnit} setUnit={setHUnit} options={["cm", "ft"]} />
              </div>
              <div className="mt-8">
                <ContinueButton onClick={advance} disabled={!canAdvance()} />
              </div>
            </motion.div>
          )}

          {/* ── WEIGHT ──────────────────────────────────────────────────── */}
          {step === "weight" && (
            <motion.div key="weight" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>What do you weigh right now?</Q>
              <Hint>Calibrates your hydration target, protein requirements, and daily caloric needs.</Hint>
              <div className="mb-2">
                <SoftNumberInput value={weightVal} onChange={setWV} unit={weightUnit} placeholder={weightUnit === "kg" ? "78" : "172"} />
                <UnitPill unit={weightUnit} setUnit={setWUnit} options={["kg", "lbs"]} />
              </div>
              <div className="mt-8">
                <ContinueButton onClick={advance} disabled={!canAdvance()} />
              </div>
            </motion.div>
          )}

          {/* ── ACTIVITY ────────────────────────────────────────────────── */}
          {step === "activity" && (
            <motion.div key="activity" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>How active is your life?</Q>
              <Hint>Sets your total daily energy multiplier — the foundation of your caloric targets.</Hint>
              <div className="flex flex-col gap-2 mb-8">
                {ACTIVITY_OPTS.map(o => (
                  <SoftTile key={o.id} label={o.label} sub={o.sub} selected={activity === o.id} onClick={() => setActivity(o.id)} />
                ))}
              </div>
              <ContinueButton onClick={advance} disabled={!canAdvance()} />
            </motion.div>
          )}

          {/* ── GOAL ────────────────────────────────────────────────────── */}
          {step === "goal" && (
            <motion.div key="goal" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>What are you optimising for?</Q>
              <Hint>This shapes your scoring weights — what the system prioritises when coaching you.</Hint>
              <div className="flex flex-col gap-2.5 mb-8">
                {GOAL_OPTS.map(o => (
                  <SoftTile key={o.id} label={o.label} sub={o.sub} selected={goal === o.id} onClick={() => setGoal(o.id)} accent={o.accent} />
                ))}
              </div>
              <ContinueButton onClick={advance} disabled={!canAdvance()} />
            </motion.div>
          )}

          {/* ── ALLERGIES ───────────────────────────────────────────────── */}
          {step === "allergies" && (
            <motion.div key="allergies" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>Any foods your body reacts to?</Q>
              <Hint>Select all that apply. Every protein source, meal timing, and supplement recommendation will respect these.</Hint>
              <div className="flex flex-col gap-2 mb-3">
                {ALLERGY_OPTS.map(o => (
                  <SoftToggle
                    key={o.id}
                    label={o.id.charAt(0).toUpperCase() + o.id.slice(1)}
                    sub={o.sub}
                    selected={allergies.includes(o.id)}
                    onClick={() => toggleAlly(o.id)}
                  />
                ))}
              </div>
              <motion.button
                onClick={() => { setAlly([]); setNoAlly(true); }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 mb-6 text-sm transition-all"
                style={{
                  borderRadius: "6px",
                  border: `1px solid ${noAlly ? "rgba(107,196,122,0.35)" : "rgba(255,255,255,0.06)"}`,
                  background: noAlly ? "rgba(107,196,122,0.1)" : "rgba(255,255,255,0.03)",
                  color: noAlly ? "#6bc47a" : "#2e2b3a",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.12em",
                }}
              >
                No allergies or intolerances
              </motion.button>
              <ContinueButton onClick={advance} disabled={!canAdvance()} />
            </motion.div>
          )}

          {/* ── DIET ────────────────────────────────────────────────────── */}
          {step === "diet" && (
            <motion.div key="diet" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
              <ProgressDots current={step} />
              <Q>How do you eat?</Q>
              <Hint>Personalises your protein sources, meal timing, and which supplements are critical for you.</Hint>
              <div className="flex flex-col gap-2.5 mb-8">
                {DIET_OPTS.map(o => (
                  <SoftTile key={o.id} label={o.label} sub={o.sub} selected={diet === o.id} onClick={() => setDiet(o.id)} accent={o.accent} />
                ))}
              </div>
              <ContinueButton onClick={advance} disabled={!canAdvance()} label="Build my twin" />
            </motion.div>
          )}

          {/* ── CALIBRATING ─────────────────────────────────────────────── */}
          {step === "calibrating" && (
            <motion.div key="calib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="text-xs mb-10 tracking-[0.3em]" style={{ color: "#3a3550", fontFamily: "Inter, sans-serif" }}>
                CALIBRATING
              </p>

              {/* Progress bar */}
              <div className="w-full h-px mb-10 relative" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ background: "linear-gradient(90deg, #9b7fd4, #4dd0c4)", boxShadow: "0 0 12px #9b7fd4" }}
                  animate={{ width: `${calibPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Log lines */}
              <div className="flex flex-col gap-3 text-left min-h-[200px]">
                <AnimatePresence>
                  {calibLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-sm font-light"
                      style={{
                        color: i === calibLines.length - 1 ? "#d4cfe8" : "#2e2b3a",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
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
