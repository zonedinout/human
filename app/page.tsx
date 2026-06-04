"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import StatusBar from "@/components/StatusBar";
import DigitalTwin from "@/components/DigitalTwin";
import VitalSystems from "@/components/VitalSystems";
import DailyObjective from "@/components/DailyObjective";
import AICoach from "@/components/AICoach";
import LogPanel from "@/components/LogPanel";
import PredictionEngine from "@/components/PredictionEngine";
import { useHealthStore } from "@/lib/store";

export default function Page() {
  const [projected, setProjected] = useState<number | null>(null);
  const overallScore = useHealthStore((s) => s.overallScore);

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Sticky header group */}
      <div className="sticky top-0 z-30">
        <Header />
        <StatusBar />
      </div>

      {/* Main 3-column layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5 mb-6">
          {/* Left column — VitalSystems top 4 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            <VitalSystems slice={[0, 4]} />
          </motion.div>

          {/* Center column — Digital Twin + Objective */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Twin container */}
            <div
              className="glass-card-elevated corner-brackets w-full flex items-center justify-center py-8 px-4 relative overflow-hidden"
              style={{ minHeight: 360 }}
            >
              {/* Background hex grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 70%)`,
                }}
              />
              <DigitalTwin score={overallScore} projected={projected ?? undefined} />
            </div>

            {/* Daily Objective */}
            <div className="w-full">
              <DailyObjective />
            </div>
          </motion.div>

          {/* Right column — VitalSystems bottom 4 + AICoach */}
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

        {/* Prediction Engine — full width */}
        <PredictionEngine onProject={setProjected} />
      </div>

      {/* Floating log panel */}
      <LogPanel />
    </div>
  );
}
