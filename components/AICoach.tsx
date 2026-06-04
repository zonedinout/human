"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { useHealthStore } from "@/lib/store";

function generateMessages(state: ReturnType<typeof useHealthStore.getState>): string[] {
  const msgs: string[] = [];
  if (state.hydration < 50) msgs.push("Hydration below optimal.");
  if (state.sleep < 60)     msgs.push("Sleep debt detected.");
  if (state.recovery < 60)  msgs.push("Recovery incomplete.");
  if (state.nutrition < 60) msgs.push("Protein intake limiting progress.");
  if (state.movement > 80)  msgs.push("Movement target exceeded.");
  if (state.energy < 50)    msgs.push("Energy reserves low.");
  if (state.stress < 50)    msgs.push("Stress accumulating.");
  if (state.focus > 75)     msgs.push("Cognitive performance nominal.");
  if (state.recovery > 80)  msgs.push("Recovery improving.");
  if (state.sleep > 80)     msgs.push("Sleep quality optimal.");
  if (state.overallScore > 80) msgs.push("System performance peak.");
  if (state.overallScore < 50) msgs.push("Biological degradation detected.");
  if (msgs.length === 0)    msgs.push("All systems nominal.");
  return msgs;
}

interface CoachMessage {
  id: number;
  text: string;
  timestamp: Date;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [text]);
  return <span>{displayed}<span className="blink-fast" style={{ color: "#00d4ff" }}>_</span></span>;
}

export default function AICoach() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const state = useHealthStore();

  useEffect(() => {
    const initial = generateMessages(useHealthStore.getState());
    const init = initial.slice(0, 3).map((text, i) => ({
      id: i,
      text,
      timestamp: new Date(),
    }));
    setMessages(init);

    const id = setInterval(() => {
      const all = generateMessages(useHealthStore.getState());
      const text = all[Math.floor(Math.random() * all.length)];
      setMessages((prev) => [
        { id: Date.now(), text, timestamp: new Date() },
        ...prev.slice(0, 4),
      ]);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="glass-card corner-brackets p-4 h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu size={12} color="#00d4ff" />
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#445566]">
          AI COACH — SYSTEM INTEL
        </span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00ff88] blink" />
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 20, height: 0 }}
              animate={{ opacity: 1 - i * 0.15, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2 py-1.5 border-b border-[#0a1520]"
            >
              <span className="font-mono text-[9px] text-[#00d4ff] mt-0.5 shrink-0">›</span>
              <span className="font-mono text-[11px] text-[#aabbcc] leading-relaxed">
                {i === 0 ? <TypewriterText text={msg.text} /> : msg.text}
              </span>
              <span className="font-mono text-[8px] text-[#334455] ml-auto shrink-0 mt-0.5">
                {msg.timestamp.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
