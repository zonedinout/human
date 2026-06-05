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
import LogPanel from "@/components/LogPanel";
import Onboarding from "@/components/Onboarding";

export default function Page() {
  const [projected, setProjected] = useState<number | null>(null);
  const isOnboarded = useHealthStore(s => s.isOnboarded);
  const overallScore = useHealthStore(s => s.overallScore);
  const projectedRecovery = useHealthStore(s => s.projectedRecovery);
  const recovery = useHealthStore(s => s.recovery);
  const sleepDebt = useHealthStore(s => s.sleepDebt);
  const resetOnboarding = useHealthStore(s => s.resetOnboarding);

  if (!isOnboarded) return <Onboarding />;

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="sticky top-0 z-30">
        <Header />
        <StatusBar />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5 mb-6">

          {/* Left — vital systems top 4 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            <VitalSystems slice={[0, 4]} />
          </motion.div>

          {/* Center — digital twin + objective */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex flex-col items-center gap-5"
          >
            <div
              className="glass-card-elevated corner-brackets w-full flex items-center justify-center py-8 px-4 relative overflow-hidden"
              style={{ minHeight: 360 }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 70%)" }}
              />
              <div className="flex flex-col items-center gap-4 w-full">
                <DigitalTwin score={overallScore} projected={projected ?? undefined} />

                {/* Recovery projection row */}
                <div className="flex items-center gap-6 w-full justify-center mt-2">
                  <div className="text-center">
                    <div className="font-mono text-[8px] text-[#334455] tracking-[0.25em] mb-1">RECOVERY NOW</div>
                    <div className="font-mono text-lg font-bold" style={{ color: recovery >= 70 ? "#00ff88" : recovery >= 50 ? "#ffaa00" : "#ff3366" }}>
                      {recovery}%
                    </div>
                  </div>
                  <div className="font-mono text-[#1a2a3a] text-lg">→</div>
                  <div className="text-center">
                    <div className="font-mono text-[8px] text-[#334455] tracking-[0.25em] mb-1">PROJECTED</div>
                    <div className="font-mono text-lg font-bold" style={{ color: projectedRecovery >= 70 ? "#00ff88" : "#ffaa00" }}>
                      {projectedRecovery}%
                    </div>
                  </div>
                  {sleepDebt > 0 && (
                    <>
                      <div className="font-mono text-[#1a2a3a] text-lg">│</div>
                      <div className="text-center">
                        <div className="font-mono text-[8px] text-[#334455] tracking-[0.25em] mb-1">SLEEP DEBT</div>
                        <div className="font-mono text-lg font-bold" style={{ color: sleepDebt > 1.5 ? "#ff3366" : "#ffaa00" }}>
                          {sleepDebt.toFixed(1)}h
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full"><DailyObjective /></div>
          </motion.div>

          {/* Right — vital systems bottom 4 + AI coach */}
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

        {/* Prediction engine */}
        <PredictionEngine onProject={setProjected} />

        {/* Dev reset — small bottom link */}
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
