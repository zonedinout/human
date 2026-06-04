"use client";

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

export default function Home() {
  const overallScore = useHealthStore((s) => s.overallScore);

  return (
    <div className="min-h-screen bg-[#050a0e] grid-bg relative">
      {/* Header */}
      <div className="sticky top-0 z-40">
        <Header />
        <StatusBar />
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6 pb-24">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-5 mb-5">
          {/* Left — vital systems top 4 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="font-mono text-[9px] tracking-[0.3em] text-[#334455] mb-3 uppercase">
              Vital Systems — Primary
            </div>
            <VitalSystems slice={[0, 4]} />
          </motion.div>

          {/* Center — digital twin */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Score ring */}
            <div
              className="glass-card-elevated corner-brackets p-6 w-full flex flex-col items-center gap-2"
              style={{ boxShadow: "0 0 60px rgba(0,212,255,0.06)" }}
            >
              <DigitalTwin score={overallScore} />
            </div>

            {/* Daily objective */}
            <DailyObjective />
          </motion.div>

          {/* Right — vital systems bottom 4 + AI coach */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-[#334455] mb-3 uppercase">
                Vital Systems — Secondary
              </div>
              <VitalSystems slice={[4, 8]} />
            </div>
            <AICoach />
          </motion.div>
        </div>

        {/* Prediction engine — full width */}
        <PredictionEngine />
      </main>

      {/* Floating log button */}
      <LogPanel />
    </div>
  );
}
