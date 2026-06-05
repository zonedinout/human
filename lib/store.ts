"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type UserProfile,
  calcSleepTargetH,
  calcHydrationTargetL,
  calcProjectedRecovery,
  getScoreWeights,
  calcCaffeineDecay,
} from "./bioEngine";

export type { UserProfile };
export type { Sex, ActivityLevel, Goal } from "./bioEngine";

export interface SleepLog {
  bedtime: string;
  wakeTime: string;
  duration: number;
}

export interface TrainingLog {
  type: string;
  date: string;
}

export interface Meal {
  size: string;
  protein: string;
  timestamp: number;
}

export interface DaySnapshot {
  date: string;
  overallScore: number;
  recovery: number;
  sleep: number;
  hydration: number;
  nutrition: number;
  movement: number;
  stress: number;
  hrv?: number;
}

export interface SleepEntry {
  date: string;
  duration: number;
  target: number;
}

export interface Supplements {
  creatine:    boolean;
  magnesium:   boolean;
  vitaminD:    boolean;
  omega3:      boolean;
  ashwagandha: boolean;
  zinc:        boolean;
}

const DEFAULT_SUPPLEMENTS: Supplements = {
  creatine: false, magnesium: false, vitaminD: false,
  omega3: false, ashwagandha: false, zinc: false,
};

interface HealthState {
  // Onboarding
  isOnboarded: boolean;
  profile: UserProfile | null;

  // Core scores (0–100)
  overallScore: number;
  recovery: number;
  hydration: number;
  nutrition: number;
  movement: number;
  sleep: number;
  energy: number;
  focus: number;
  stress: number;

  // Derived
  projectedRecovery: number;
  sleepDebt: number;
  hydrationLitres: number;
  hydrationTargetL: number;

  // Raw inputs
  sleepLog: SleepLog | null;
  sleepHistory: SleepEntry[];
  weight: number | null;
  weightHistory: Array<{ date: string; value: number }>;
  trainingLog: TrainingLog | null;
  trainingHistory: TrainingLog[];
  consecutiveTrainingDays: number;
  meals: Meal[];

  // Stress inputs
  caffeineLevel: number;         // 0=none 1=1cup 2=2-3 3=4+
  caffeineLoggedAt: number | null;  // ms timestamp when last logged
  subjectiveStress: number | null;
  missedMeals: number;

  // Biohacking
  hrv: number | null;
  hrvHistory: Array<{ date: string; value: number }>;
  supplements: Supplements;

  lastUpdated: string;
  history: DaySnapshot[];

  // Actions
  completeOnboarding: (profile: UserProfile) => void;
  logSleep: (bedtime: string, wakeTime: string) => void;
  logWeight: (weight: number) => void;
  logTraining: (type: string) => void;
  logMeal: (size: string, protein: string) => void;
  logHydration: (litres: number) => void;
  logCaffeine: (level: number) => void;
  logSubjectiveStress: (level: number) => void;
  logHRV: (hrv: number) => void;
  toggleSupplement: (key: keyof Supplements) => void;
  resetDay: () => void;
  resetOnboarding: () => void;
  snapshotDay: () => void;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

// ─── Stress Engine ───────────────────────────────────────────────────────────
function computeStress(state: Partial<HealthState>): number {
  let score = 100;

  // 1. Rolling sleep debt (7 days) — each hour = -4 pts, max -28
  const sleepHistory = state.sleepHistory ?? [];
  const rollingDebt = sleepHistory
    .slice(-7)
    .reduce((acc, e) => acc + Math.max(0, e.target - e.duration), 0);
  score -= Math.min(28, rollingDebt * 4);

  // 2. Dehydration — cortisol spikes when dehydrated
  const hydration = state.hydration ?? 50;
  if (hydration < 30)      score -= 18;
  else if (hydration < 50) score -= 10;
  else if (hydration < 65) score -= 4;

  // 3. Caffeine — time-decayed (half-life 5.5h)
  const effectiveCaffeine = calcCaffeineDecay(
    state.caffeineLevel ?? 0,
    state.caffeineLoggedAt ?? null
  );
  score -= ([0, 5, 13, 25][effectiveCaffeine] ?? 0);

  // 4. Underfeeding — low nutrition triggers cortisol
  const nutrition = state.nutrition ?? 55;
  if (nutrition < 25)      score -= 15;
  else if (nutrition < 45) score -= 8;
  else if (nutrition < 60) score -= 3;

  // 5. Consecutive training days without rest
  const consec = state.consecutiveTrainingDays ?? 0;
  score -= Math.min(22, consec * 6);

  // 6. Supplements — ashwagandha reduces cortisol, magnesium calms CNS
  const supp = state.supplements ?? DEFAULT_SUPPLEMENTS;
  if (supp.ashwagandha) score += 4;
  if (supp.magnesium)   score += 3;

  // 7. Subjective check-in — blended 50/50
  const subjective = state.subjectiveStress;
  if (subjective !== null && subjective !== undefined) {
    const subjectiveScore = (5 - subjective) * 20; // 1→80, 5→0
    score = score * 0.5 + subjectiveScore * 0.5;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Score Engine ────────────────────────────────────────────────────────────
function computeScores(state: Partial<HealthState>): Partial<HealthState> {
  const profile = state.profile;
  const sleepTarget = profile ? calcSleepTargetH(profile) : 8;
  const weights = profile ? getScoreWeights(profile.goal) : getScoreWeights("health");

  // Sleep score
  let sleepScore: number;
  if (state.sleepLog) {
    const ratio = state.sleepLog.duration / sleepTarget;
    if (ratio >= 1.0 && ratio <= 1.15) sleepScore = 95;
    else if (ratio >= 0.9)             sleepScore = 82;
    else if (ratio >= 0.75)            sleepScore = 65;
    else if (ratio >= 0.6)             sleepScore = 45;
    else                               sleepScore = 25;
  } else {
    sleepScore = state.sleep ?? 65;
  }

  // Rolling sleep debt
  const sleepHistory = state.sleepHistory ?? [];
  const rollingDebt = sleepHistory
    .slice(-7)
    .reduce((acc, e) => acc + Math.max(0, e.target - e.duration), 0);
  if (rollingDebt > 3)   sleepScore = Math.round(sleepScore * 0.80);
  else if (rollingDebt > 1.5) sleepScore = Math.round(sleepScore * 0.90);

  // Supplements bonus (vitamin D3, omega-3 → sleep quality)
  const supp = state.supplements ?? DEFAULT_SUPPLEMENTS;
  if (supp.vitaminD && supp.omega3) sleepScore = Math.min(100, sleepScore + 2);

  // Stress (dynamic)
  const stressScore = computeStress(state);

  // Hydration
  const hydrationTarget = profile ? calcHydrationTargetL(profile) : 2.5;
  const hydrationLitres = state.hydrationLitres ?? 0;
  const hydrationScore = Math.min(100, Math.round((hydrationLitres / hydrationTarget) * 100));

  // Recovery base
  let recoveryScore = Math.round(
    sleepScore * 0.55 + stressScore * 0.30 + hydrationScore * 0.15
  );

  // HRV modifier
  const hrv = state.hrv;
  if (hrv !== null && hrv !== undefined) {
    if (hrv > 70)      recoveryScore = Math.min(100, recoveryScore + 10);
    else if (hrv < 30) recoveryScore = Math.max(0,   recoveryScore - 20);
    else if (hrv < 50) recoveryScore = Math.max(0,   recoveryScore - 10);
  }

  // Supplement adherence bonus
  const suppCount = Object.values(supp).filter(Boolean).length;
  if (suppCount >= 5)      recoveryScore = Math.min(100, recoveryScore + 3);
  else if (suppCount >= 3) recoveryScore = Math.min(100, recoveryScore + 1);

  recoveryScore = Math.min(100, Math.max(5, recoveryScore));

  // Projected recovery
  const projectedRecovery = profile && state.sleepLog
    ? calcProjectedRecovery(recoveryScore, state.sleepLog.duration, profile)
    : Math.min(100, recoveryScore + 8);

  // Nutrition
  let nutritionScore: number;
  if (state.meals && state.meals.length > 0) {
    const recent = state.meals.filter(m => Date.now() - m.timestamp < 24 * 3_600_000);
    if (recent.length > 0) {
      const avgProtein = recent.reduce((acc, m) =>
        acc + (m.protein === "High" ? 1 : m.protein === "Medium" ? 0.6 : 0.3), 0
      ) / recent.length;
      nutritionScore = Math.round(avgProtein * 60 + Math.min(100, (recent.length / 3) * 100) * 0.4);
      // Creatine bonus for performance/composition goals
      if (supp.creatine && profile?.goal !== "longevity") nutritionScore = Math.min(100, nutritionScore + 3);
    } else {
      nutritionScore = state.nutrition ?? 55;
    }
  } else {
    nutritionScore = state.nutrition ?? 55;
  }

  // Movement
  let movementScore: number;
  if (state.trainingLog && state.trainingLog.date === todayStr()) {
    const bonuses: Record<string, number> = {
      "Full Body": 95, Cardio: 92, Legs: 88, Push: 84, Pull: 84, Sport: 90, Rest: 45,
    };
    movementScore = bonuses[state.trainingLog.type] ?? 80;
  } else {
    movementScore = Math.round(Math.max(40, (state.movement ?? 50) * 0.95));
  }

  // Energy
  const energyScore = Math.min(100, Math.max(5, Math.round(
    sleepScore * 0.40 + nutritionScore * 0.30 + recoveryScore * 0.20 + stressScore * 0.10
  )));

  // Focus — caffeine gives a short-term boost
  const effectiveCaffeine = calcCaffeineDecay(
    state.caffeineLevel ?? 0,
    state.caffeineLoggedAt ?? null
  );
  const caffeineBoost = effectiveCaffeine === 1 ? 5 : effectiveCaffeine === 2 ? 3 : 0;
  const focusScore = Math.min(100, Math.max(5, Math.round(
    sleepScore * 0.40 + nutritionScore * 0.25 + stressScore * 0.25 + hydrationScore * 0.10
  ) + caffeineBoost));

  // Overall weighted by goal
  const overall = Math.round(
    sleepScore     * weights.sleep    +
    recoveryScore  * weights.recovery +
    nutritionScore * weights.nutrition +
    movementScore  * weights.movement +
    hydrationScore * weights.hydration +
    energyScore    * weights.energy   +
    focusScore     * weights.focus    +
    stressScore    * weights.stress
  );

  return {
    overallScore:     Math.min(100, Math.max(0, overall)),
    sleep:            Math.round(sleepScore),
    recovery:         recoveryScore,
    hydration:        hydrationScore,
    nutrition:        Math.round(nutritionScore),
    movement:         movementScore,
    energy:           energyScore,
    focus:            focusScore,
    stress:           stressScore,
    sleepDebt:        Math.round(rollingDebt * 10) / 10,
    projectedRecovery,
    hydrationTargetL: hydrationTarget,
  };
}

function calcConsecutiveTrainingDays(history: TrainingLog[]): number {
  if (!history.length) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let count = 0;
  let prev = todayStr();
  for (const log of sorted) {
    if (log.type === "Rest") break;
    const expected = new Date(prev);
    expected.setDate(expected.getDate() - (count === 0 ? 0 : 1));
    const expectedStr = expected.toISOString().split("T")[0];
    if (log.date === expectedStr || (count === 0 && log.date === todayStr())) {
      count++;
      prev = log.date;
    } else {
      break;
    }
  }
  return count;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const BLANK = {
  overallScore: 0, recovery: 0, hydration: 0, nutrition: 0,
  movement: 0, sleep: 0, energy: 0, focus: 0, stress: 60,
  projectedRecovery: 0, sleepDebt: 0, hydrationLitres: 0, hydrationTargetL: 2.5,
} as const;

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      profile: null,

      ...BLANK,

      sleepLog: null,
      sleepHistory: [],
      weight: null,
      weightHistory: [],
      trainingLog: null,
      trainingHistory: [],
      consecutiveTrainingDays: 0,
      meals: [],

      caffeineLevel: 0,
      caffeineLoggedAt: null,
      subjectiveStress: null,
      missedMeals: 0,

      hrv: null,
      hrvHistory: [],
      supplements: { ...DEFAULT_SUPPLEMENTS },

      lastUpdated: todayStr(),
      history: [],

      completeOnboarding: (profile) => {
        const hydrationTargetL = calcHydrationTargetL(profile);
        set((s) => {
          const base = {
            ...s,
            isOnboarded: true,
            profile,
            hydrationTargetL,
            weight: profile.weightKg,
            weightHistory: [{ date: todayStr(), value: profile.weightKg }],
            sleep: 65, recovery: 62, nutrition: 55,
            movement: 50, energy: 60, focus: 63,
            caffeineLevel: 0, caffeineLoggedAt: null,
            subjectiveStress: null, hydrationLitres: 0,
            hrv: null, supplements: { ...DEFAULT_SUPPLEMENTS },
          };
          return { ...base, ...computeScores(base) };
        });
      },

      logSleep: (bedtime, wakeTime) => {
        const duration = calcDuration(bedtime, wakeTime);
        const sleepLog: SleepLog = { bedtime, wakeTime, duration };
        set((s) => {
          const profile = s.profile;
          const target = profile ? calcSleepTargetH(profile) : 8;
          const today = todayStr();
          const entry: SleepEntry = { date: today, duration, target };
          const sleepHistory = [
            ...s.sleepHistory.filter(e => e.date !== today), entry,
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
          const updated = { ...s, sleepLog, sleepHistory };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logWeight: (weight) => {
        set((s) => {
          const today = todayStr();
          const weightHistory = [
            ...s.weightHistory.filter(e => e.date !== today),
            { date: today, value: weight },
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
          return { weight, weightHistory };
        });
      },

      logTraining: (type) => {
        set((s) => {
          const today = todayStr();
          const log: TrainingLog = { type, date: today };
          const trainingHistory = [
            ...s.trainingHistory.filter(e => e.date !== today), log,
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
          const consecutiveTrainingDays = calcConsecutiveTrainingDays(trainingHistory);
          const updated = { ...s, trainingLog: log, trainingHistory, consecutiveTrainingDays };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logMeal: (size, protein) => {
        const meal: Meal = { size, protein, timestamp: Date.now() };
        set((s) => {
          const updated = { ...s, meals: [...s.meals, meal] };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logHydration: (litres) => {
        set((s) => {
          const updated = { ...s, hydrationLitres: Math.min(s.hydrationLitres + litres, 12) };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logCaffeine: (level) => {
        set((s) => {
          const updated = { ...s, caffeineLevel: level, caffeineLoggedAt: level > 0 ? Date.now() : null };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logSubjectiveStress: (level) => {
        set((s) => {
          const updated = { ...s, subjectiveStress: level };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logHRV: (hrv) => {
        set((s) => {
          const today = todayStr();
          const hrvHistory = [
            ...s.hrvHistory.filter(e => e.date !== today),
            { date: today, value: hrv },
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
          const updated = { ...s, hrv, hrvHistory };
          return { ...updated, ...computeScores(updated) };
        });
      },

      toggleSupplement: (key) => {
        set((s) => {
          const supplements = { ...s.supplements, [key]: !s.supplements[key] };
          const updated = { ...s, supplements };
          return { ...updated, ...computeScores(updated) };
        });
      },

      resetDay: () => {
        set((s) => {
          const updated = {
            ...s,
            hydrationLitres: 0,
            caffeineLevel: 0,
            caffeineLoggedAt: null,
            subjectiveStress: null,
            missedMeals: 0,
            meals: [],
            sleepLog: null,
            trainingLog: null,
            supplements: { ...DEFAULT_SUPPLEMENTS },
            hrv: null,
            lastUpdated: todayStr(),
          };
          return { ...updated, ...computeScores(updated) };
        });
      },

      resetOnboarding: () => {
        set({
          isOnboarded: false,
          profile: null,
          ...BLANK,
          sleepLog: null, sleepHistory: [],
          weight: null, weightHistory: [],
          trainingLog: null, trainingHistory: [],
          consecutiveTrainingDays: 0,
          meals: [], history: [],
          caffeineLevel: 0, caffeineLoggedAt: null,
          subjectiveStress: null, missedMeals: 0,
          hydrationLitres: 0, lastUpdated: todayStr(),
          hrv: null, hrvHistory: [],
          supplements: { ...DEFAULT_SUPPLEMENTS },
        });
      },

      snapshotDay: () => {
        set((s) => {
          const today = todayStr();
          const snap: DaySnapshot = {
            date: today,
            overallScore: s.overallScore, recovery: s.recovery,
            sleep: s.sleep, hydration: s.hydration,
            nutrition: s.nutrition, movement: s.movement, stress: s.stress,
            hrv: s.hrv ?? undefined,
          };
          const history = [
            ...s.history.filter(h => h.date !== today), snap,
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
          return { history, lastUpdated: today };
        });
      },
    }),
    { name: "human-os-v2" }
  )
);
