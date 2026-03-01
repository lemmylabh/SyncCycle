export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export function cycleDay(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
}

export function computePhase(day: number, periodLen = 5, cycleLen = 28): Phase {
  if (day <= periodLen) return "menstrual";
  if (day <= cycleLen - 15) return "follicular";
  if (day <= cycleLen - 12) return "ovulatory";
  return "luteal";
}

export const PHASE_CONFIG: Record<Phase, {
  label: string;
  tagline: string;
  gradient: string;
  ring: string;
}> = {
  menstrual:  { label: "Menstrual Phase",  tagline: "Rest & restore your body",       gradient: "from-rose-900/40 to-rose-800/20",     ring: "#f43f5e" },
  follicular: { label: "Follicular Phase", tagline: "Rising energy & creativity",      gradient: "from-rose-900/30 to-purple-900/30",   ring: "#a855f7" },
  ovulatory:  { label: "Ovulatory Phase",  tagline: "Peak energy & confidence",        gradient: "from-pink-900/40 to-purple-900/30",   ring: "#f472b6" },
  luteal:     { label: "Luteal Phase",     tagline: "Wind down & reflect",             gradient: "from-violet-900/40 to-purple-900/30", ring: "#8b5cf6" },
};
