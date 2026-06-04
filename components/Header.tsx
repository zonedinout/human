"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Header() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }).toUpperCase()
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-4 border-b border-[#1a2a3a]"
      style={{ background: "rgba(5,10,14,0.95)", backdropFilter: "blur(20px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-8 h-8 border border-[#00d4ff] flex items-center justify-center"
            style={{ boxShadow: "0 0 10px #00d4ff33" }}
          >
            <div className="w-3 h-3 bg-[#00d4ff]" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          </div>
        </div>
        <div>
          <span
            className="font-mono text-xl font-bold text-white tracking-[0.2em]"
            style={{ textShadow: "0 0 15px rgba(0,212,255,0.6)" }}
          >
            HUMAN OS
          </span>
          <span
            className="ml-2 font-mono text-xs px-1.5 py-0.5 border border-[#00d4ff44] text-[#00d4ff] align-middle"
            style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}
          >
            v2.0
          </span>
        </div>
      </div>

      {/* Center — tagline */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-px h-4 bg-[#1a2a3a]" />
        <span className="font-mono text-xs text-[#445566] tracking-widest uppercase">
          Biological Performance Interface
        </span>
        <div className="w-px h-4 bg-[#1a2a3a]" />
      </div>

      {/* Right — clock + status */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-sm text-white tracking-widest">{time}</div>
          <div className="font-mono text-[10px] text-[#445566] tracking-widest">{date}</div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full bg-[#00ff88] blink"
            style={{ boxShadow: "0 0 6px #00ff88" }}
          />
          <span className="font-mono text-[10px] text-[#00ff88] tracking-widest uppercase">
            Online
          </span>
        </div>
      </div>
    </motion.header>
  );
}
