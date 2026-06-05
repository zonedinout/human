"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  if (s.hydration < 30)  msgs.push("Critical hydration deficit. Drink water immediately.");
  if (s.sleep < 40)      msgs.push("Severe sleep debt detected. Cognitive impairment likely.");
  if (s.recovery < 30)   msgs.push("Recovery critically low. Training today will cause damage.");
  if (s.overallScore < 40) msgs.push("Biological performance compromised. Rest is the priority.");

  if (s.hydration < 55 && s.hydration >= 30) msgs.push("Hydration below optimal. Drink water now.");
  if (s.sleepDebt > 1.5)  msgs.push(`Sleep debt at ${s.sleepDebt.toFixed(1)}h. Schedule recovery sleep.`);
  if (s.stress < 45)      msgs.push("Stress accumulating. Active recovery recommended.");
  if (s.nutrition < 50)   msgs.push("Protein intake limiting adaptation. Log a high-protein meal.");

  if (profile && s.sleepLog) {
    const dur = s.sleepLog.duration;
    if (dur < sleepTarget - 1.5) msgs.push(`Slept ${dur.toFixed(1)}h. Target is ${sleepTarget}h. Sleep debt building.`);
    else if (dur >= sleepTarget)  msgs.push(`Sleep target met. Recovery window is optimal.`);
  }

  if (s.trainingLog?.type && s.recovery < 60)
    msgs.push(`${s.trainingLog.type} session logged. Recovery protocols engaged.`);

  if (s.movement > 80)    msgs.push("Movement target exceeded. Strength adaptation likely.");
  if (s.recovery > 85)    msgs.push("Recovery complete. System primed for high output.");
  if (s.hydration > 85)   msgs.push("Hydration optimal. Cognitive performance sustained.");
  if (s.sleep > 85)       msgs.push("Sleep quality optimal. HRV likely elevated.");

  if (s.caffeineLevel >= 3) msgs.push("High caffeine load. Cortisol elevated. Recovery impaired.");
  else if (s.caffeineLevel === 2) msgs.push("Moderate caffeine. Monitor sleep onset tonight.");

  if (s.subjectiveStress !== null) {
    if (s.subjectiveStress >= 4) msgs.push("High subjective stress reported. Prioritise recovery.");
    else if (s.subjectiveStress <= 2) msgs.push("Subjective stress low. System well-regulated.");
  }

  const consec = s.consecutiveTrainingDays;
  if (consec >= 5) msgs.push(`${consec} consecutive training days. Deload required.`);
  else if (consec >= 3) msgs.push(`${consec} days straight. Monitor recovery closely.`);

  if (s.sleepDebt > 4) msgs.push(`${s.sleepDebt.toFixed(1)}h sleep debt accumulated. Prioritise tonight.`);
  else if (s.sleepDebt > 2) msgs.push(`${s.sleepDebt.toFixed(1)}h sleep debt building.`);

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
  critical: "#c46b7a",
  warn:     "#d4956b",
  good:     "#4dd0c4",
  info:     "#9b7fd4",
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
    }, 20);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        style={{ color: "#9b7fd4", marginLeft: "1px" }}
      >
        |
      </motion.span>
    </>
  );
}

export default function AICoach() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const idRef = useRef(0);

  const pushMsg = (text: string) => {
    const msg: CoachMessage = { id: idRef.current++, text, severity: severity(text), ts: new Date() };
    setMessages(prev => [msg, ...prev].slice(0, 6));
  };

  useEffect(() => {
    const initial = analyseState().slice(0, 3);
    initial.forEach((t, i) => setTimeout(() => pushMsg(t), i * 700));
  }, []);

  useEffect(() => {
    const unsub = useHealthStore.subscribe(() => {
      const all = analyseState();
      pushMsg(all[Math.floor(Math.random() * all.length)]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const all = analyseState();
      pushMsg(all[Math.floor(Math.random() * all.length)]);
    }, 14000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="cosmic-card p-4 flex-1"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#9b7fd4", boxShadow: "0 0 6px #9b7fd4" }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          coach
        </span>
        <div className="ml-auto">
          <motion.div
            className="w-1 h-1 rounded-full"
            style={{ background: "#4dd0c4" }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const color = SEVERITY_COLOR[msg.severity];
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 14, height: 0 }}
                animate={{ opacity: Math.max(0.25, 1 - i * 0.18), x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-2.5 pb-2 last:pb-0"
                style={{ borderBottom: i < messages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: i === 0 ? 300 : 300,
                  fontSize: "0.7rem", lineHeight: 1.5, flex: 1,
                  color: i === 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)",
                }}>
                  {i === 0 ? <TypewriterText text={msg.text} /> : msg.text}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
