"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Moon, Scale, Dumbbell, Utensils } from "lucide-react";
import { useHealthStore } from "@/lib/store";

type Tab = "SLEEP" | "WEIGHT" | "TRAINING" | "NUTRITION";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const TRAINING_TYPES = ["Push", "Pull", "Legs", "Full Body", "Cardio", "Sport"];

function calcDuration(bed: string, wake: string): string {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function CyberButton({
  onClick,
  children,
  color = "#00d4ff",
  disabled = false,
  active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className="font-mono text-[10px] tracking-[0.2em] px-3 py-2 transition-all duration-200"
      style={{
        border: `1px solid ${active ? color : color + "55"}`,
        background: active ? `${color}22` : `${color}08`,
        color: active ? color : `${color}99`,
        boxShadow: active ? `0 0 12px ${color}33` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

function SleepTab({ onDone }: { onDone: () => void }) {
  const [bed, setBed] = useState("22:30");
  const [wake, setWake] = useState("06:30");
  const logSleep = useHealthStore((s) => s.logSleep);

  const [bedH, bedM] = bed.split(":");
  const [wakeH, wakeM] = wake.split(":");

  const handleLog = () => {
    logSleep(bed, wake);
    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "BED TIME", h: bedH, m: bedM, setH: (v: string) => setBed(`${v}:${bedM}`), setM: (v: string) => setBed(`${bedH}:${v}`) },
          { label: "WAKE TIME", h: wakeH, m: wakeM, setH: (v: string) => setWake(`${v}:${wakeM}`), setM: (v: string) => setWake(`${wakeH}:${v}`) },
        ].map(({ label, h, m, setH, setM }) => (
          <div key={label}>
            <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">{label}</div>
            <div className="flex gap-2 items-center">
              <select
                value={h}
                onChange={(e) => setH(e.target.value)}
                className="font-mono text-sm bg-[#0a1520] border border-[#1a2a3a] text-[#00d4ff] px-2 py-1.5 focus:border-[#00d4ff66] outline-none"
              >
                {HOURS.map((hr) => <option key={hr} value={hr}>{hr}</option>)}
              </select>
              <span className="font-mono text-[#445566]">:</span>
              <select
                value={m}
                onChange={(e) => setM(e.target.value)}
                className="font-mono text-sm bg-[#0a1520] border border-[#1a2a3a] text-[#00d4ff] px-2 py-1.5 focus:border-[#00d4ff66] outline-none"
              >
                {MINUTES.map((mn) => <option key={mn} value={mn}>{mn}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 py-2 px-3 border border-[#1a2a3a] bg-[#080f14]">
        <Moon size={12} color="#8899aa" />
        <span className="font-mono text-[10px] text-[#445566] tracking-widest">DURATION</span>
        <span className="font-mono text-sm font-bold ml-auto" style={{ color: "#00d4ff" }}>
          {calcDuration(bed, wake)}
        </span>
      </div>

      <CyberButton onClick={handleLog} color="#00d4ff">LOG SLEEP</CyberButton>
    </div>
  );
}

function WeightTab({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const logWeight = useHealthStore((s) => s.logWeight);

  const handleLog = () => {
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) {
      logWeight(n);
      onDone();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">BODY WEIGHT (KG)</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
            className="w-full font-mono text-2xl bg-[#0a1520] border border-[#1a2a3a] text-[#00d4ff] px-3 py-2 focus:border-[#00d4ff66] outline-none tracking-widest"
            style={{ boxShadow: "inset 0 0 10px #00d4ff08" }}
          />
          <Scale size={16} color="#445566" />
        </div>
      </div>
      <CyberButton onClick={handleLog} color="#00d4ff" disabled={!value || isNaN(parseFloat(value))}>
        LOG WEIGHT
      </CyberButton>
    </div>
  );
}

function TrainingTab({ onDone }: { onDone: () => void }) {
  const [trained, setTrained] = useState<boolean | null>(null);
  const [type, setType] = useState("Push");
  const logTraining = useHealthStore((s) => s.logTraining);

  const handleLog = () => {
    if (trained === null) return;
    logTraining(trained ? type : "Rest");
    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">TODAY'S STATUS</div>
        <div className="flex gap-2">
          <CyberButton onClick={() => setTrained(true)} color="#00ff88" active={trained === true}>
            TRAINED
          </CyberButton>
          <CyberButton onClick={() => setTrained(false)} color="#8899aa" active={trained === false}>
            REST DAY
          </CyberButton>
        </div>
      </div>

      {trained && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">SESSION TYPE</div>
          <div className="grid grid-cols-3 gap-2">
            {TRAINING_TYPES.map((t) => (
              <CyberButton key={t} onClick={() => setType(t)} color="#00d4ff" active={type === t}>
                {t.toUpperCase()}
              </CyberButton>
            ))}
          </div>
        </motion.div>
      )}

      <CyberButton onClick={handleLog} color="#00ff88" disabled={trained === null}>
        LOG TRAINING
      </CyberButton>
    </div>
  );
}

function NutritionTab({ onDone }: { onDone: () => void }) {
  const [size, setSize] = useState<string | null>(null);
  const [protein, setProtein] = useState<string | null>(null);
  const logMeal = useHealthStore((s) => s.logMeal);

  const handleLog = () => {
    if (!size || !protein) return;
    logMeal(size, protein);
    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">MEAL SIZE</div>
        <div className="flex gap-2">
          {["Small", "Medium", "Large"].map((s) => (
            <CyberButton key={s} onClick={() => setSize(s)} color="#ffaa00" active={size === s}>
              {s.toUpperCase()}
            </CyberButton>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#445566] mb-2">PROTEIN CONTENT</div>
        <div className="flex gap-2">
          {["low", "medium", "high"].map((p) => (
            <CyberButton key={p} onClick={() => setProtein(p)} color="#00d4ff" active={protein === p}>
              {p.toUpperCase()}
            </CyberButton>
          ))}
        </div>
      </div>

      <CyberButton onClick={handleLog} color="#ffaa00" disabled={!size || !protein}>
        LOG MEAL
      </CyberButton>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: "SLEEP", label: "SLEEP", icon: Moon },
  { id: "WEIGHT", label: "WEIGHT", icon: Scale },
  { id: "TRAINING", label: "TRAINING", icon: Dumbbell },
  { id: "NUTRITION", label: "NUTRITION", icon: Utensils },
];

export default function LogPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("SLEEP");

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 font-mono text-xs tracking-[0.2em]"
        style={{
          background: "rgba(0,212,255,0.1)",
          border: "1px solid rgba(0,212,255,0.5)",
          color: "#00d4ff",
          boxShadow: "0 0 20px rgba(0,212,255,0.2), 0 4px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Plus size={14} />
        LOG DATA
      </motion.button>

      {/* Overlay + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(5,10,14,0.8)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
              style={{
                background: "rgba(8,15,20,0.98)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderBottom: "none",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-0.5 bg-[#1a2a3a] rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#0a1520]">
                <span className="font-mono text-xs tracking-[0.3em] text-[#8899aa]">DATA INPUT TERMINAL</span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#445566] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#0a1520]">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[9px] tracking-[0.2em] transition-all duration-200"
                    style={{
                      color: tab === id ? "#00d4ff" : "#445566",
                      borderBottom: tab === id ? "2px solid #00d4ff" : "2px solid transparent",
                      background: tab === id ? "rgba(0,212,255,0.05)" : "transparent",
                    }}
                  >
                    <Icon size={10} color={tab === id ? "#00d4ff" : "#445566"} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === "SLEEP" && <SleepTab onDone={() => setOpen(false)} />}
                    {tab === "WEIGHT" && <WeightTab onDone={() => setOpen(false)} />}
                    {tab === "TRAINING" && <TrainingTab onDone={() => setOpen(false)} />}
                    {tab === "NUTRITION" && <NutritionTab onDone={() => setOpen(false)} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
