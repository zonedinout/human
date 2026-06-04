import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#00ff88";
  if (score >= 50) return "#ffaa00";
  return "#ff3366";
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return "OPTIMAL";
  if (score >= 70) return "STABLE";
  if (score >= 50) return "LOW";
  return "CRITICAL";
}

export function getScoreGlow(score: number): string {
  if (score >= 80) return "glow-green";
  if (score >= 50) return "glow-amber";
  return "glow-red";
}
