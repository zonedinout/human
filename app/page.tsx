"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useHealthStore } from "@/lib/store";
import Header from "@/components/Header";
import StatusBar from "@/components/StatusBar";
import DigitalTwin from "@/components/DigitalTwin";
import VitalSystems from "@/components/VitalSystems";
import DailyObjective from "@/components/DailyObjective";
import AICoach from "@/components/AICoach";
import PredictionEngine from "@/components/PredictionEngine";
import CircadianTimeline from "@/components/CircadianTimeline";
import NutritionProtocol from "@/components/NutritionProtocol";
import LogPanel from "@/components/LogPanel";
import Onboarding from "@/components/Onboarding";

export default function Page() {
  const [projected, setProjected] = useState<number | null>(null);
  const isOnboarded       = useHealthStore(s => s.isOnboarded);
  const overallScore      = useHealthStore(s => s.overallScore);
  const projectedRecovery = useHealthStore(s => s.projectedRecovery);
  const recovery          = useHealthStore(s => s.recovery);
  const sleepDebt         = useHealthStore(s => s.sleepDebt);
  const hrv               = useHealthStore(s => s.hrv);
  const resetOnboarding   = useHealthStore(s => s.resetOnboarding);

  if (!isOnboarded) return <Onboarding />;

  const recoveryColor = recovery >= 70 ? "#00ff88" : recovery >= 50 ? "#ffaa00" : "#ff3366";
  const projColor     = projectedRecovery >= 70 ? "#00ff88" : "#ffaa00";

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <div className="sticky top-0 z-30">
        <Header />
        <StatusBar />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-6">

        {/* ── Row 1: 3-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5 mb-5">

          {/* Left — vitals top 4 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            <VitalSystems slice={[0, 4]} />
          </motion.div>

          {/* Center — digital twin + recovery stats + objective */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex flex-col items-center gap-5"
          >
            <div
              className="glass-card-elevated corner-brackets w-full flex items-center justify-center py-8 px-4 relative overflow-hidden"
              style={{ minHeight: 340 }}
            >
              {/* Ambient background glow */}
              <div className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
              />

              <div className="flex flex-col items-center gap-5 w-full relative">
                <DigitalTwin score={overallScore} projected={projected ?? undefined} />

                {/* Stats row */}
                <div className="flex items-center gap-5 w-full justify-center">
                  <div className="text-center">
                    <div className="font-mono text-[8px] text-[#2a3a48] tracking-[0.25em] mb-1">RECOVERY</div>
                    <motion.div
                      key={recovery}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-mono text-xl font-bold"
                      style={{ color: recoveryColor, textShadow: `0 0 12px ${recoveryColor}66` }}
                    >
                      {recovery}%
                    </motion.div>
                  </div>

                  <div className="font-mono text-[#0d1e2a] text-xl">→</div>

                  <div className="text-center">
                    <div className="font-mono text-[8px] text-[#2a3a48] tracking-[0.25em] mb-1">PROJECTED</div>
                    <motion.div
                      key={projectedRecovery}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-mono text-xl font-bold"
                      style={{ color: projColor, textShadow: `0 0 12px ${projColor}66` }}
                    >
                      {projectedRecovery}%
                    </motion.div>
                  </div>

                  {sleepDebt > 0 && (
                    <>
                      <div className="font-mono text-[#0d1e2a] text-xl">│</div>
                      <div className="text-center">
                        <div className="font-mono text-[8px] text-[#2a3a48] tracking-[0.25em] mb-1">SLEEP DEBT</div>
                        <motion.div
                          key={sleepDebt}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-mono text-xl font-bold"
                          style={{ color: sleepDebt > 1.5 ? "#ff3366" : "#ffaa00" }}
                        >
                          {sleepDebt.toFixed(1)}h
                        </motion.div>
                      </div>
                    </>
                  )}

                  {hrv !== null && (
                    <>
                      <div className="font-mono text-[#0d1e2a] text-xl">│</div>
                      <div className="text-center">
                        <div className="font-mono text-[8px] text-[#2a3a48] tracking-[0.25em] mb-1">HRV</div>
                        <motion.div
                          key={hrv}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-mono text-xl font-bold"
                          style={{ color: hrv > 70 ? "#00ff88" : hrv > 50 ? "#ffaa00" : "#ff3366" }}
                        >
                          {hrv}ms
                        </motion.div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full"><DailyObjective /></div>
          </motion.div>

          {/* Right — vitals bottom 4 + AI coach */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex flex-col gap-5"
          >
            <VitalSystems slice={[4, 8]} />
            <AICoach />
          </motion.div>
        </div>

        {/* ── Row 2: Circadian Timeline ── */}
        <div className="mb-5">
          <CircadianTimeline />
        </div>

        {/* ── Row 3: Nutrition Protocol ── */}
        <div className="mb-5">
          <NutritionProtocol />
        </div>

        {/* ── Row 4: Prediction Engine ── */}
        <PredictionEngine onProject={setProjected} />

        {/* Dev reset */}
        <div className="flex justify-center mt-8">
          <button
            onClick={resetOnboarding}
            className="font-mono text-[8px] text-[#1a2a3a] hover:text-[#334455] tracking-widest transition-colors"
          >
            RESET PROFILE
          </button>
        </div>
      </div>

      <LogPanel />
    </div>
  );
}
