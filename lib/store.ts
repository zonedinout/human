"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface HealthState {
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

  // Logging data
  sleepLog: SleepLog | null;
  weight: number | null;
  trainingLog: TrainingLog | null;
  meals: Meal[];

  // Actions
  logSleep: (bedtime: string, wakeTime: string) => void;
  logWeight: (weight: number) => void;
  logTraining: (type: string) => void;
  logMeal: (size: string, protein: string) => void;
  updateScores: () => void;
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let duration = wh * 60 + wm - (bh * 60 + bm);
  if (duration < 0) duration += 24 * 60;
  return duration / 60;
}

function computeScores(state: Partial<HealthState>): Partial<HealthState> {
  let sleepScore = 65;
  let recoveryScore = 68;
  let nutritionScore = 72;
  let movementScore = 81;
  let hydrationScore = 45;
  let energyScore = 70;
  let focusScore = 77;
  let stressScore = 60;

  // Sleep scoring
  if (state.sleepLog) {
    const dur = state.sleepLog.duration;
    if (dur >= 7.5 && dur <= 9) sleepScore = 90 + Math.random() * 5;
    else if (dur >= 7 && dur < 7.5) sleepScore = 80;
    else if (dur >= 6 && dur < 7) sleepScore = 65;
    else if (dur >= 5 && dur < 6) sleepScore = 45;
    else if (dur < 5) sleepScore = 25;
    else sleepScore = 70; // >9h slight oversleep
    sleepScore = Math.min(100, Math.round(sleepScore));
  } else {
    sleepScore = state.sleep ?? 65;
  }

  // Recovery based on sleep
  recoveryScore = Math.round(sleepScore * 0.7 + (state.stress ?? 60) * 0.3 * 0.8);
  recoveryScore = Math.min(100, Math.max(10, recoveryScore));

  // Nutrition based on meals
  if (state.meals && state.meals.length > 0) {
    const recent = state.meals.filter(
      (m) => Date.now() - m.timestamp < 24 * 60 * 60 * 1000
    );
    const proteinScore =
      recent.reduce((acc, m) => {
        const p = m.protein === "high" ? 30 : m.protein === "medium" ? 20 : 10;
        return acc + p;
      }, 0) / Math.max(recent.length, 1);
    const mealCount = recent.length;
    const countScore = mealCount >= 3 ? 100 : mealCount === 2 ? 75 : mealCount === 1 ? 50 : 30;
    nutritionScore = Math.round((proteinScore / 30) * 100 * 0.5 + countScore * 0.5);
    nutritionScore = Math.min(100, Math.max(10, nutritionScore));
  } else {
    nutritionScore = state.nutrition ?? 72;
  }

  // Movement based on training
  if (state.trainingLog) {
    const typeBonus: Record<string, number> = {
      "Full Body": 95,
      Cardio: 90,
      Push: 85,
      Pull: 85,
      Legs: 88,
      Sport: 92,
    };
    movementScore = typeBonus[state.trainingLog.type] ?? 80;
  } else {
    movementScore = state.movement ?? 81;
  }

  // Energy is composite
  energyScore = Math.round(
    sleepScore * 0.4 + nutritionScore * 0.3 + recoveryScore * 0.3
  );
  energyScore = Math.min(100, Math.max(10, energyScore));

  // Focus based on sleep and nutrition
  focusScore = Math.round(
    sleepScore * 0.5 + nutritionScore * 0.3 + (100 - (state.stress ?? 60)) * 0.2
  );
  focusScore = Math.min(100, Math.max(10, focusScore));

  // Stress (lower training = higher stress baseline)
  stressScore = state.trainingLog
    ? Math.min(100, (state.stress ?? 60) + 10)
    : state.stress ?? 60;

  hydrationScore = state.hydration ?? 45;

  const overall = Math.round(
    sleepScore * 0.2 +
      recoveryScore * 0.15 +
      hydrationScore * 0.1 +
      nutritionScore * 0.15 +
      movementScore * 0.15 +
      energyScore * 0.1 +
      focusScore * 0.1 +
      stressScore * 0.05
  );

  return {
    overallScore: Math.min(100, Math.max(0, overall)),
    sleep: sleepScore,
    recovery: recoveryScore,
    hydration: hydrationScore,
    nutrition: nutritionScore,
    movement: movementScore,
    energy: energyScore,
    focus: focusScore,
    stress: stressScore,
  };
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      // Initial mock data
      overallScore: 73,
      recovery: 68,
      hydration: 45,
      nutrition: 72,
      movement: 81,
      sleep: 65,
      energy: 70,
      focus: 77,
      stress: 60,

      sleepLog: null,
      weight: null,
      trainingLog: null,
      meals: [],

      logSleep: (bedtime: string, wakeTime: string) => {
        const duration = calcDuration(bedtime, wakeTime);
        const sleepLog: SleepLog = { bedtime, wakeTime, duration };
        set((s) => {
          const updated = { ...s, sleepLog };
          const scores = computeScores(updated);
          return { ...updated, ...scores };
        });
      },

      logWeight: (weight: number) => {
        set({ weight });
      },

      logTraining: (type: string) => {
        const trainingLog: TrainingLog = { type, intensity: "moderate" };
        set((s) => {
          const updated = { ...s, trainingLog };
          const scores = computeScores(updated);
          return { ...updated, ...scores };
        });
      },

      logMeal: (size: string, protein: string) => {
        const meal: Meal = { size, protein, timestamp: Date.now() };
        set((s) => {
          const updated = { ...s, meals: [...s.meals, meal] };
          const scores = computeScores(updated);
          return { ...updated, ...scores };
        });
      },

      updateScores: () => {
        set((s) => {
          const scores = computeScores(s);
          return { ...s, ...scores };
        });
      },
    }),
    {
      name: "human-os-health",
    }
  )
);

export type { HealthState, SleepLog, TrainingLog, Meal };
