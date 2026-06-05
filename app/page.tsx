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
import CosmicBg from "@/components/CosmicBg";

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

  const recoveryColor = recovery >= 80 ? "#4dd0c4" : recovery >= 60 ? "#9b7fd4" : recovery >= 40 ? "#d4956b" : "#c46b7a";
  const projColor     = projectedRecovery >= 70 ? "#4dd0c4" : "#d4956b";

  return (
    <div className="min-h-screen relative" style={{ background: "#070510" }}>
      <CosmicBg />

      <div className="relative z-10 flex flex-col min-h-screen">
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
              className="cosmic-card w-full flex items-center justify-center py-8 px-4 relative overflow-hidden"
              style={{ minHeight: 340 }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgba(155,127,212,0.05) 0%, transparent 70%)" }}
              />

              <div className="flex flex-col items-center gap-5 w-full relative">
                <DigitalTwin score={overallScore} projected={projected ?? undefined} />

                {/* Stats row */}
                <div className="flex items-center gap-5 w-full justify-center">
                  <div className="text-center">
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.25rem" }}>recovery</div>
                    <motion.div
                      key={recovery}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.2rem", letterSpacing: "-0.01em", color: recoveryColor, textShadow: `0 0 12px ${recoveryColor}55` }}
                    >
                      {recovery}%
                    </motion.div>
                  </div>

                  <div style={{ color: "rgba(255,255,255,0.1)", fontSize: "1rem" }}>→</div>

                  <div className="text-center">
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.25rem" }}>projected</div>
                    <motion.div
                      key={projectedRecovery}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.2rem", letterSpacing: "-0.01em", color: projColor, textShadow: `0 0 12px ${projColor}55` }}
                    >
                      {projectedRecovery}%
                    </motion.div>
                  </div>

                  {sleepDebt > 0 && (
                    <>
                      <div style={{ color: "rgba(255,255,255,0.08)", fontSize: "1rem" }}>│</div>
                      <div className="text-center">
                        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.25rem" }}>sleep debt</div>
                        <motion.div
                          key={sleepDebt}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.2rem", letterSpacing: "-0.01em", color: sleepDebt > 1.5 ? "#c46b7a" : "#d4956b" }}
                        >
                          {sleepDebt.toFixed(1)}h
                        </motion.div>
                      </div>
                    </>
                  )}

                  {hrv !== null && (
                    <>
                      <div style={{ color: "rgba(255,255,255,0.08)", fontSize: "1rem" }}>│</div>
                      <div className="text-center">
                        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: "0.25rem" }}>HRV</div>
                        <motion.div
                          key={hrv}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.2rem", letterSpacing: "-0.01em", color: hrv! > 70 ? "#4dd0c4" : hrv! > 50 ? "#d4956b" : "#c46b7a" }}
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
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.55rem", color: "rgba(255,255,255,0.08)", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer", transition: "color 0.3s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.08)")}
          >
            reset profile
          </button>
        </div>
      </div>

      <LogPanel />
      </div>
    </div>
  );
}
