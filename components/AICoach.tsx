"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { useHealthStore } from "@/lib/store";
import { calcSleepTargetH } from "@/lib/bioEngine";

interface CoachMessage {
  id: number;
  text: string;
  severity: "info" | "warn" | "critical" | "good";
  ts: Date;
}

function analyseState(): string[] {
  const s = useHealthStore.getState();
  const profile = s.profile;
  const msgs: string[] = [];

  const sleepTarget = profile ? calcSleepTargetH(profile) : 8;

  // Critical
  if (s.hydration < 30)  msgs.push("Critical hydration deficit. Drink water immediately.");
  if (s.sleep < 40)      msgs.push("Severe sleep debt detected. Cognitive impairment likely.");
  if (s.recovery < 30)   msgs.push("Recovery critically low. Training today will cause damage.");
  if (s.overallScore < 40) msgs.push("Biological performance compromised. Rest is the priority.");

  // Warnings
  if (s.hydration < 55 && s.hydration >= 30) msgs.push("Hydration below optimal. Drink water now.");
  if (s.sleepDebt > 1.5)  msgs.push(`Sleep debt: ${s.sleepDebt.toFixed(1)}h. Schedule recovery sleep.`);
  if (s.stress < 45)      msgs.push("Stress accumulating. Active recovery recommended.");
  if (s.nutrition < 50)   msgs.push("Protein intake limiting adaptation. Log a high-protein meal.");

  // Context-aware
  if (profile && s.sleepLog) {
    const dur = s.sleepLog.duration;
    if (dur < sleepTarget - 1.5) msgs.push(`Slept ${dur.toFixed(1)}h. Target is ${sleepTarget}h. Sleep debt building.`);
    else if (dur >= sleepTarget)  msgs.push(`Sleep target met. Recovery window optimal.`);
  }

  if (s.trainingLog?.type && s.recovery < 60)
    msgs.push(`${s.trainingLog.type} session logged. Recovery protocols engaged.`);

  if (s.movement > 80)    msgs.push("Movement target exceeded. Strength adaptation likely.");
  if (s.recovery > 85)    msgs.push("Recovery complete. System primed for high output.");
  if (s.hydration > 85)   msgs.push("Hydration optimal. Cognitive performance sustained.");
  if (s.sleep > 85)       msgs.push("Sleep quality optimal. HRV likely elevated.");

  // Profile-based
  if (profile) {
    if (profile.goal === "performance" && s.nutrition < 70)
      msgs.push("Performance goal: protein synthesis suboptimal.");
    if (profile.goal === "composition" && s.movement < 60)
      msgs.push("Composition goal: movement below threshold.");
    if (profile.age > 40 && s.recovery < 70)
      msgs.push("Age-adjusted recovery window not met. Add 24h.");
  }

  if (msgs.length === 0) msgs.push("All systems nominal. Maintain current protocols.");
  return msgs;
}

function severity(text: string): CoachMessage["severity"] {
  if (text.includes("Critical") || text.includes("critical") || text.includes("compromised") || text.includes("damage")) return "critical";
  if (text.includes("below") || text.includes("debt") || text.includes("accumulating") || text.includes("limiting") || text.includes("suboptimal")) return "warn";
  if (text.includes("optimal") || text.includes("met") || text.includes("exceeded") || text.includes("complete") || text.includes("likely elevated") || text.includes("nominal")) return "good";
  return "info";
}

const SEVERITY_COLOR: Record<CoachMessage["severity"], string> = {
  critical: "#ff3366",
  warn:     "#ffaa00",
  good:     "#00ff88",
  info:     "#00d4ff",
};

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text]);
  return <>{displayed}<span className="blink-fast opacity-60" style={{ color: "#00d4ff" }}>_</span></>;
}

export default function AICoach() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const idRef = useRef(0);

  const pushMsg = (text: string) => {
    const msg: CoachMessage = { id: idRef.current++, text, severity: severity(text), ts: new Date() };
    setMessages(prev => [msg, ...prev].slice(0, 6));
  };

  // Initial batch
  useEffect(() => {
    const initial = analyseState().slice(0, 3);
    initial.forEach((t, i) => setTimeout(() => pushMsg(t), i * 600));
  }, []);

  // Reactive to store changes
  useEffect(() => {
    const unsub = useHealthStore.subscribe(() => {
      const all = analyseState();
      const pick = all[Math.floor(Math.random() * all.length)];
      pushMsg(pick);
    });
    return unsub;
  }, []);

  // Periodic refresh
  useEffect(() => {
    const id = setInterval(() => {
      const all = analyseState();
      const pick = all[Math.floor(Math.random() * all.length)];
      pushMsg(pick);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="glass-card corner-brackets p-4 flex-1"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu size={12} color="#00d4ff" />
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">AI COACH</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] blink" />
          <span className="font-mono text-[8px] text-[#334455] tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const color = SEVERITY_COLOR[msg.severity];
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: Math.max(0.3, 1 - i * 0.15), x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2 py-1.5 border-b border-[#0a1520] last:border-0"
              >
                <span className="font-mono text-[9px] mt-0.5 shrink-0" style={{ color }}>›</span>
                <span className="font-mono text-[11px] leading-relaxed flex-1" style={{ color: i === 0 ? "#ccd8e0" : "#667788" }}>
                  {i === 0 ? <TypewriterText text={msg.text} /> : msg.text}
                </span>
                <span className="font-mono text-[8px] text-[#222d36] shrink-0 mt-0.5">
                  {msg.ts.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
