export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "performance" | "composition" | "longevity" | "health";

export interface UserProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  name?: string;
}

export interface CircadianPhase {
  id:      string;
  name:    string;
  desc:    string;
  action:  string;
  color:   string;
  startH:  number;
  endH:    number; // >24 means next-day (e.g. 29 = 5am next day)
}

// 24-hour cycle anchored at 5am
export const CIRCADIAN_PHASES: CircadianPhase[] = [
  { id: "dawn",     name: "DAWN PRIME",     desc: "Cortisol rising naturally. Avoid caffeine — let your body peak on its own.", action: "SUNLIGHT · HYDRATE · MOVE",      color: "#ff8c42", startH: 5,    endH: 7.5  },
  { id: "focus",    name: "PEAK FOCUS",     desc: "Cortisol at peak. Optimal for deep work, learning, and decisions.",          action: "DEEP WORK · ZERO DISTRACTIONS", color: "#00d4ff", startH: 7.5,  endH: 12   },
  { id: "midday",   name: "MIDDAY FUEL",    desc: "Fuel the machine. Eat your biggest high-protein meal now.",                  action: "PROTEIN MEAL · RECHARGE",       color: "#00ff88", startH: 12,   endH: 14   },
  { id: "dip",      name: "AFTERNOON DIP",  desc: "Energy trough. Core temperature drops briefly — 20-min nap is ideal.",       action: "REST · LOW INTENSITY WORK",     color: "#667788", startH: 14,   endH: 15.5 },
  { id: "training", name: "TRAINING PRIME", desc: "Peak core temp and reaction time. Maximum strength and speed available.",    action: "TRAIN NOW · PUSH LIMITS",       color: "#ff3366", startH: 15.5, endH: 18   },
  { id: "evening",  name: "EVENING WIND",   desc: "Recovery mode begins. Last meal, dim lights, no more caffeine.",             action: "WIND DOWN · LAST MEAL",         color: "#9966ff", startH: 18,   endH: 21   },
  { id: "sleep",    name: "SLEEP WINDOW",   desc: "Melatonin rising. Every minute of quality sleep compounds recovery.",        action: "SLEEP NOW · DO NOT SCROLL",     color: "#4455aa", startH: 21,   endH: 29   },
];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  athlete:   1.9,
};

// Mifflin-St Jeor
export function calcBMR(p: UserProfile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

export function calcTDEE(p: UserProfile): number {
  return Math.round(calcBMR(p) * ACTIVITY_MULTIPLIERS[p.activityLevel]);
}

export function calcHydrationTargetL(p: UserProfile): number {
  const base = p.weightKg * 0.033;
  const activityBonus = ["active", "athlete"].includes(p.activityLevel) ? 0.5 : 0;
  return Math.round((base + activityBonus) * 10) / 10;
}

export function calcSleepTargetH(p: UserProfile): number {
  if (p.age < 26) return 9;
  if (p.age < 36) return 8.5;
  if (p.age < 51) return 8;
  if (p.age < 65) return 7.5;
  return 7;
}

export function calcRecoveryWindowH(p: UserProfile): number {
  if (p.age < 25) return 36;
  if (p.age < 35) return 42;
  if (p.age < 45) return 48;
  if (p.age < 55) return 56;
  return 64;
}

export function calcProteinTargetG(p: UserProfile): number {
  const multipliers: Record<Goal, number> = {
    performance: 2.2, composition: 2.0, longevity: 1.6, health: 1.4,
  };
  return Math.round(p.weightKg * multipliers[p.goal]);
}

export function getScoreWeights(goal: Goal): Record<string, number> {
  switch (goal) {
    case "performance":
      return { sleep: 0.22, recovery: 0.20, nutrition: 0.16, movement: 0.16, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.03 };
    case "composition":
      return { sleep: 0.18, recovery: 0.15, nutrition: 0.22, movement: 0.18, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.04 };
    case "longevity":
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.12, energy: 0.08, focus: 0.07, stress: 0.08 };
    default:
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.10, energy: 0.10, focus: 0.08, stress: 0.07 };
  }
}

export function calcMealCalories(size: string, profile: UserProfile): number {
  const tdee = calcTDEE(profile);
  const perMeal = tdee / 3;
  if (size === "Small")  return Math.round(perMeal * 0.6);
  if (size === "Large")  return Math.round(perMeal * 1.4);
  return Math.round(perMeal);
}

export function calcProjectedRecovery(currentRecovery: number, sleepHours: number, profile: UserProfile): number {
  const target = calcSleepTargetH(profile);
  const sleepRatio = Math.min(sleepHours / target, 1.1);
  const ageDecayFactor = profile.age > 40 ? 0.9 : 1.0;
  const projected = currentRecovery * 0.6 + sleepRatio * 40 * ageDecayFactor;
  return Math.min(100, Math.max(10, Math.round(projected)));
}

// ─── Circadian ──────────────────────────────────────────────────────────────

export function getCurrentPhase(): CircadianPhase {
  const now = new Date();
  const rawH = now.getHours() + now.getMinutes() / 60;
  // Extend pre-5am into the sleep phase (0–5 → 24–29)
  const h = rawH < 5 ? rawH + 24 : rawH;
  return (
    CIRCADIAN_PHASES.find(p => h >= p.startH && h < p.endH) ??
    CIRCADIAN_PHASES[CIRCADIAN_PHASES.length - 1]
  );
}

export function minsToNextPhase(): number {
  const now = new Date();
  const rawH = now.getHours() + now.getMinutes() / 60;
  const phase = getCurrentPhase();
  let endH = phase.endH > 24 ? phase.endH - 24 : phase.endH;
  let diffH = endH - rawH;
  if (diffH <= 0) diffH += 24;
  return Math.round(diffH * 60);
}

// ─── Caffeine decay ─────────────────────────────────────────────────────────
// Half-life of caffeine ≈ 5.5h

export function calcCaffeineDecay(level: number, loggedAtMs: number | null): number {
  if (!loggedAtMs || level === 0) return level;
  const elapsedH = (Date.now() - loggedAtMs) / 3_600_000;
  const effective = level * Math.pow(0.5, elapsedH / 5.5);
  if (effective < 0.25) return 0;
  if (effective < 0.85) return 1;
  if (effective < 1.75) return 2;
  return 3;
}

export function caffeineClearanceMins(level: number, loggedAtMs: number | null): number | null {
  if (!loggedAtMs || level === 0) return null;
  const elapsedH = (Date.now() - loggedAtMs) / 3_600_000;
  // Solve: level * 0.5^(t/5.5) = 0.25 → t = 5.5 * log2(level/0.25)
  const totalH = level <= 0.25 ? 0 : 5.5 * Math.log(level / 0.25) / Math.LN2;
  const remainH = totalH - elapsedH;
  if (remainH <= 0) return 0;
  return Math.round(remainH * 60);
}
