"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type UserProfile,
  calcSleepTargetH,
  calcHydrationTargetL,
  calcProjectedRecovery,
  getScoreWeights,
} from "./bioEngine";

export type { UserProfile };
export type { Sex, ActivityLevel, Goal } from "./bioEngine";

interface SleepLog {
  bedtime: string;
  wakeTime: string;
  duration: number;
}

interface TrainingLog {
  type: string;
  intensity: string;
}

interface Meal {
  size: string;
  protein: string;
  timestamp: number;
}

interface DaySnapshot {
  date: string; // YYYY-MM-DD
  overallScore: number;
  recovery: number;
  sleep: number;
  hydration: number;
  nutrition: number;
  movement: number;
}

interface HealthState {
  // Onboarding
  isOnboarded: boolean;
  profile: UserProfile | null;

  // Core scores
  overallScore: number;
  recovery: number;
  hydration: number;
  nutrition: number;
  movement: number;
  sleep: number;
  energy: number;
  focus: number;
  stress: number;

  // Projections
  projectedRecovery: number;
  sleepDebt: number;
  hydrationLitres: number;
  hydrationTargetL: number;

  // Logging data
  sleepLog: SleepLog | null;
  weight: number | null;
  weightHistory: Array<{ date: string; value: number }>;
  trainingLog: TrainingLog | null;
  meals: Meal[];
  lastUpdated: string;

  // History
  history: DaySnapshot[];

  // Actions
  completeOnboarding: (profile: UserProfile) => void;
  logSleep: (bedtime: string, wakeTime: string) => void;
  logWeight: (weight: number) => void;
  logTraining: (type: string) => void;
  logMeal: (size: string, protein: string) => void;
  logHydration: (litres: number) => void;
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

function computeScores(state: Partial<HealthState>): Partial<HealthState> {
  const profile = state.profile;
  const sleepTarget = profile ? calcSleepTargetH(profile) : 8;
  const weights = profile ? getScoreWeights(profile.goal) : getScoreWeights("health");

  // Sleep score
  let sleepScore: number;
  if (state.sleepLog) {
    const dur = state.sleepLog.duration;
    const ratio = dur / sleepTarget;
    if (ratio >= 1.0 && ratio <= 1.1)      sleepScore = 95;
    else if (ratio >= 0.9)                  sleepScore = 82;
    else if (ratio >= 0.75)                 sleepScore = 65;
    else if (ratio >= 0.6)                  sleepScore = 45;
    else                                     sleepScore = 25;
  } else {
    sleepScore = state.sleep ?? 65;
  }

  // Sleep debt
  const sleepDebt = state.sleepLog
    ? Math.max(0, sleepTarget - state.sleepLog.duration)
    : (state.sleepDebt ?? 0);

  // Recovery (sleep + stress + training history)
  const stressBase = state.stress ?? 60;
  let recoveryScore = Math.round(sleepScore * 0.65 + (100 - stressBase) * 0.35);
  if (sleepDebt > 1.5) recoveryScore = Math.round(recoveryScore * 0.85);
  recoveryScore = Math.min(100, Math.max(10, recoveryScore));

  // Projected recovery
  const projectedRecovery = profile && state.sleepLog
    ? calcProjectedRecovery(recoveryScore, state.sleepLog.duration, profile)
    : Math.min(100, recoveryScore + 8);

  // Nutrition from meals
  let nutritionScore: number;
  if (state.meals && state.meals.length > 0) {
    const recent = state.meals.filter(m => Date.now() - m.timestamp < 24 * 60 * 60 * 1000);
    if (recent.length > 0) {
      const avgProtein = recent.reduce((acc, m) => {
        return acc + (m.protein === "High" ? 1 : m.protein === "Medium" ? 0.6 : 0.3);
      }, 0) / recent.length;
      const mealCountScore = Math.min(100, (recent.length / 3) * 100);
      nutritionScore = Math.round(avgProtein * 60 + mealCountScore * 0.4);
    } else {
      nutritionScore = state.nutrition ?? 50;
    }
  } else {
    nutritionScore = state.nutrition ?? 72;
  }

  // Hydration from litres logged
  const hydrationTarget = profile ? calcHydrationTargetL(profile) : 2.5;
  const hydrationLitres = state.hydrationLitres ?? 0;
  const hydrationScore = Math.min(100, Math.round((hydrationLitres / hydrationTarget) * 100));

  // Movement
  let movementScore: number;
  if (state.trainingLog) {
    const bonuses: Record<string, number> = {
      "Full Body": 95, Cardio: 90, Legs: 88, Push: 84, Pull: 84, Sport: 92, Rest: 55,
    };
    movementScore = bonuses[state.trainingLog.type] ?? 80;
  } else {
    movementScore = state.movement ?? 81;
  }

  // Energy: composite
  const energyScore = Math.min(100, Math.max(10, Math.round(
    sleepScore * 0.4 + nutritionScore * 0.3 + recoveryScore * 0.3
  )));

  // Focus
  const focusScore = Math.min(100, Math.max(10, Math.round(
    sleepScore * 0.45 + nutritionScore * 0.3 + (100 - stressBase) * 0.25
  )));

  // Overall weighted by goal
  const overall = Math.round(
    sleepScore      * weights.sleep +
    recoveryScore   * weights.recovery +
    nutritionScore  * weights.nutrition +
    movementScore   * weights.movement +
    hydrationScore  * weights.hydration +
    energyScore     * weights.energy +
    focusScore      * weights.focus +
    stressBase      * weights.stress
  );

  return {
    overallScore:       Math.min(100, Math.max(0, overall)),
    sleep:              Math.round(sleepScore),
    recovery:           recoveryScore,
    hydration:          hydrationScore,
    nutrition:          Math.round(nutritionScore),
    movement:           movementScore,
    energy:             energyScore,
    focus:              focusScore,
    stress:             stressBase,
    sleepDebt:          Math.round(sleepDebt * 10) / 10,
    projectedRecovery,
    hydrationTargetL:   hydrationTarget,
  };
}

const INITIAL_SCORES = {
  overallScore: 0,
  recovery: 0,
  hydration: 0,
  nutrition: 0,
  movement: 0,
  sleep: 0,
  energy: 0,
  focus: 0,
  stress: 60,
  projectedRecovery: 0,
  sleepDebt: 0,
  hydrationLitres: 0,
  hydrationTargetL: 2.5,
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      profile: null,

      ...INITIAL_SCORES,

      sleepLog: null,
      weight: null,
      weightHistory: [],
      trainingLog: null,
      meals: [],
      lastUpdated: todayStr(),
      history: [],

      completeOnboarding: (profile: UserProfile) => {
        set((s) => {
          const base = {
            ...s,
            isOnboarded: true,
            profile,
            hydrationTargetL: calcHydrationTargetL(profile),
            weight: profile.weightKg,
            weightHistory: [{ date: todayStr(), value: profile.weightKg }],
          };
          const scores = computeScores(base);
          return { ...base, ...scores };
        });
      },

      logSleep: (bedtime, wakeTime) => {
        const duration = calcDuration(bedtime, wakeTime);
        const sleepLog: SleepLog = { bedtime, wakeTime, duration };
        set((s) => {
          const updated = { ...s, sleepLog };
          return { ...updated, ...computeScores(updated) };
        });
      },

      logWeight: (weight) => {
        set((s) => {
          const entry = { date: todayStr(), value: weight };
          const history = [...s.weightHistory.filter(e => e.date !== todayStr()), entry]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);
          return { weight, weightHistory: history };
        });
      },

      logTraining: (type) => {
        const trainingLog: TrainingLog = { type, intensity: "moderate" };
        set((s) => {
          const updated = { ...s, trainingLog };
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
          const updated = { ...s, hydrationLitres: Math.min(s.hydrationLitres + litres, 10) };
          return { ...updated, ...computeScores(updated) };
        });
      },

      resetOnboarding: () => {
        set({
          isOnboarded: false,
          profile: null,
          ...INITIAL_SCORES,
          sleepLog: null,
          weight: null,
          weightHistory: [],
          trainingLog: null,
          meals: [],
          history: [],
          hydrationLitres: 0,
        });
      },

      snapshotDay: () => {
        set((s) => {
          const today = todayStr();
          const snap: DaySnapshot = {
            date: today,
            overallScore: s.overallScore,
            recovery: s.recovery,
            sleep: s.sleep,
            hydration: s.hydration,
            nutrition: s.nutrition,
            movement: s.movement,
          };
          const history = [...s.history.filter(h => h.date !== today), snap]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);
          return { history, lastUpdated: today };
        });
      },
    }),
    { name: "human-os-v2" }
  )
);

export type { HealthState, SleepLog, TrainingLog, Meal, DaySnapshot };
