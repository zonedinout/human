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
  // Base: 0.033L per kg, +0.5L for active/athlete
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
  // Hours needed between hard sessions
  if (p.age < 25) return 36;
  if (p.age < 35) return 42;
  if (p.age < 45) return 48;
  if (p.age < 55) return 56;
  return 64;
}

export function calcProteinTargetG(p: UserProfile): number {
  // g per kg bodyweight based on goal
  const multipliers: Record<Goal, number> = {
    performance:  2.2,
    composition:  2.0,
    longevity:    1.6,
    health:       1.4,
  };
  return Math.round(p.weightKg * multipliers[p.goal]);
}

// Goal-based score weights — what matters most for this person
export function getScoreWeights(goal: Goal): Record<string, number> {
  switch (goal) {
    case "performance":
      return { sleep: 0.22, recovery: 0.20, nutrition: 0.16, movement: 0.16, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.03 };
    case "composition":
      return { sleep: 0.18, recovery: 0.15, nutrition: 0.22, movement: 0.18, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.04 };
    case "longevity":
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.12, energy: 0.08, focus: 0.07, stress: 0.08 };
    case "health":
    default:
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.10, energy: 0.10, focus: 0.08, stress: 0.07 };
  }
}

export function calcMealCalories(size: string, profile: UserProfile): number {
  const tdee = calcTDEE(profile);
  const mealCount = 3;
  const perMeal = tdee / mealCount;
  if (size === "Small")  return Math.round(perMeal * 0.6);
  if (size === "Large")  return Math.round(perMeal * 1.4);
  return Math.round(perMeal); // Medium
}

export function calcProjectedRecovery(
  currentRecovery: number,
  sleepHours: number,
  profile: UserProfile
): number {
  const target = calcSleepTargetH(profile);
  const sleepRatio = Math.min(sleepHours / target, 1.1);
  const ageDecayFactor = profile.age > 40 ? 0.9 : 1.0;
  const projected = currentRecovery * 0.6 + sleepRatio * 40 * ageDecayFactor;
  return Math.min(100, Math.max(10, Math.round(projected)));
}
