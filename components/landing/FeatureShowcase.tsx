"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Dumbbell,
  Moon,
  Activity,
  Sparkles,
  Heart,
} from "lucide-react";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden h-full flex flex-col " +
        "hover:border-white/20 transition-colors duration-200 " +
        className
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex items-start justify-between px-4 pt-3.5 pb-1.5 shrink-0">
      <div>
        <p className="text-white/30 uppercase tracking-widest text-[8px] font-light mb-0.5">{label}</p>
        <p className="text-white text-[13px] font-light">{title}</p>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
        <button className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center border border-white/10">
          <Plus size={9} className="text-white/50" />
        </button>
      </div>
    </div>
  );
}

// ─── 1. Profile Card ───────────────────────────────────────────────────────────

const INTERESTS = ["Morning runner", "Coffee enthusiast", "Loves hiking", "Yoga", "Journaling"];

function LandingProfileCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      {/* Video — takes upper ~56% of the card */}
      <div className="relative overflow-hidden" style={{ height: "56%" }}>
        <video
          src="/mockprofile.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Bottom fade for seamless blend into content */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111119]/95 via-[#111119]/50 to-transparent pointer-events-none" />
        {/* Name + age + she/her pill + edit */}
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-white text-[13px] font-light leading-tight">Jane Doe</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-white/45 text-[10px]">25</span>
              <span className="text-[9px] text-rose-300/70 bg-rose-500/10 border border-rose-500/20 rounded-full px-1.5 py-0.5 leading-none">
                she/her
              </span>
            </div>
          </div>
          <button className="w-6 h-6 rounded-full bg-white/[0.12] border border-white/15 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-4 justify-between overflow-hidden">
        <div>
          <p className="text-white/25 uppercase tracking-widest text-[9px] mb-2">About</p>
          <p className="text-white/50 text-[12px] leading-relaxed">
            I start my mornings with fresh air and a warm cup of tea. I love exploring new trails, trying simple healthy recipes, and reflecting in my journal.
          </p>
        </div>
        <div>
          <p className="text-white/25 uppercase tracking-widest text-[9px] mb-2">Interests</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest, i) => (
              <span
                key={interest}
                className="text-[11px] text-white/55 bg-white/[0.07] border border-white/10 rounded-full px-3 py-1"
                style={{
                  opacity: animated ? 1 : 0,
                  transform: animated ? "translateY(0px)" : "translateY(6px)",
                  transition: `opacity 0.4s ease ${0.3 + i * 0.07}s, transform 0.4s ease ${0.3 + i * 0.07}s`,
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ─── 2. Cycle Phase Card ────────────────────────────────────────────────────────

const RING_R = 38;
const RING_C = 2 * Math.PI * RING_R;
const CYCLE_PROGRESS = 9 / 28;
const CYCLE_OFFSET = RING_C * (1 - CYCLE_PROGRESS);

function LandingCyclePhaseCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="Today" title="Cycle Phase" />
      <div className="flex-1 flex flex-col px-4 pt-2 pb-4 justify-between">
        {/* Top: phase name (left) + ring (right) */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xl font-light text-white leading-tight">Follicular</p>
            <p className="text-xl font-light text-white/35 italic leading-tight">Phase</p>
            <p className="text-[11px] text-white/35 mt-2">Day 9 of 28</p>
            <p className="text-[10px] text-white/25 mt-0.5">Energy rising · great for new goals</p>
          </div>
          {/* SVG ring */}
          <div className="relative shrink-0">
            <svg width="88" height="88" className="-rotate-90">
              <circle cx="44" cy="44" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <circle
                cx="44" cy="44" r={RING_R}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="7"
                strokeLinecap="round"
                style={{
                  strokeDasharray: RING_C,
                  strokeDashoffset: animated ? CYCLE_OFFSET : RING_C,
                  transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1) 0.3s",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-sm font-light leading-tight">Day 9</span>
              <span className="text-white/35 text-[10px]">of 28</span>
            </div>
          </div>
        </div>

        {/* Bottom: phase strip + pills */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 w-full">
            {[
              { key: "M", color: "#f43f5e", active: false },
              { key: "F", color: "#a78bfa", active: true },
              { key: "O", color: "#34d399", active: false },
              { key: "L", color: "#fbbf24", active: false },
            ].map((p) => (
              <div key={p.key} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full h-1 rounded-full"
                  style={{ backgroundColor: p.active ? p.color : "rgba(255,255,255,0.08)" }}
                />
                <span className="text-[7px]" style={{ color: p.active ? p.color : "rgba(255,255,255,0.25)" }}>{p.key}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <span className="text-[9px] text-white/55 bg-white/[0.07] border border-white/10 rounded-full px-2 py-0.5">Day 9</span>
            <span className="text-[9px] text-rose-300/70 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">18d to period</span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ─── 3. Vibe Card ──────────────────────────────────────────────────────────────

const VIBE_ROWS = [
  { label: "MOOD",   value: "4.0", pct: 80, color: "#8b5cf6", delay: 0.35 },
  { label: "ENERGY", value: "3.0", pct: 60, color: "#06b6d4", delay: 0.50 },
  { label: "LIBIDO", value: "2.0", pct: 40, color: "#ec4899", delay: 0.65 },
];

function LandingVibeCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="Last 7 Days" title="Vibe Check" />
      <div className="flex-1 flex flex-col justify-center px-4 pb-4 pt-2 gap-3.5">
        {VIBE_ROWS.map(({ label, value, pct, color, delay }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className="text-[9px] uppercase tracking-widest font-medium w-14 shrink-0"
              style={{ color }}
            >
              {label}
            </span>
            <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: animated ? `${pct}%` : "0%",
                  backgroundColor: color,
                  transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
                }}
              />
            </div>
            <span className="text-[11px] font-light text-white/70 w-6 text-right shrink-0">{value}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// ─── 4. Symptom Heatmap ────────────────────────────────────────────────────────

const SYMPTOMS   = ["Cramps", "Bloating", "Fatigue", "Headache", "Mood"];
const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const SYMPTOM_DATA = [
  [3, 2, 0, 0, 0, 1, 0],
  [2, 3, 1, 0, 0, 0, 2],
  [1, 2, 2, 3, 1, 0, 0],
  [0, 1, 0, 2, 0, 0, 1],
  [2, 1, 0, 1, 2, 1, 0],
];
const SEV_COLORS: Record<number, string> = {
  0: "rgba(255,255,255,0.04)",
  1: "#881337",
  2: "#be123c",
  3: "#f43f5e",
  4: "#fb7185",
};
const TODAY_COL = 4;

function LandingSymptomCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="This Week" title="Symptoms" />
      <div className="flex-1 flex flex-col px-3 pb-3 pt-1 overflow-hidden gap-1.5">
        {/* Day headers */}
        <div className="flex gap-0.5 pl-[56px] shrink-0">
          {DAYS_SHORT.map((d, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[9px]"
              style={{ color: i === TODAY_COL ? "white" : "rgba(255,255,255,0.28)" }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Rows */}
        {SYMPTOMS.map((symptom, row) => (
          <div key={symptom} className="flex items-center gap-0.5">
            <span className="text-[9px] text-white/35 w-[52px] truncate pr-1.5 text-right shrink-0">
              {symptom}
            </span>
            {SYMPTOM_DATA[row].map((severity, col) => (
              <div
                key={col}
                className="flex-1 aspect-square rounded-[3px]"
                style={{
                  backgroundColor: SEV_COLORS[severity],
                  opacity: animated ? 1 : 0,
                  transition: `opacity 0.3s ease ${row * 0.08 + col * 0.025}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// ─── 5. Nutrition Card ─────────────────────────────────────────────────────────

function ProgBar({ pct, color, delay, animated }: { pct: number; color: string; delay: number; animated: boolean }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: animated ? `${pct}%` : "0%",
          backgroundColor: color,
          transition: `width 0.75s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
        }}
      />
    </div>
  );
}

const MACROS = [
  { label: "Protein", val: 32, goal: 50,  color: "#a78bfa" },
  { label: "Carbs",   val: 180, goal: 250, color: "#fbbf24" },
  { label: "Fat",     val: 48,  goal: 65,  color: "#f472b6" },
];

function LandingNutritionCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="Today" title="Nutrition" />
      <div className="flex-1 flex flex-col justify-center px-4 pb-4 pt-1 gap-2.5">
        {/* Calories */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-white text-base font-light">1,420</span>
            <span className="text-white/30 text-[10px]">/ 2,000 kcal</span>
          </div>
          <ProgBar pct={71} color="rgba(244,63,94,0.75)" delay={0.3} animated={animated} />
        </div>
        {/* Macros */}
        <div className="flex flex-col gap-2">
          <p className="text-white/25 uppercase tracking-widest text-[8px]">Macros</p>
          {MACROS.map((m, i) => (
            <div key={m.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-white/55 text-[10px]">{m.label}</span>
                <span className="text-white/35 text-[10px]">{m.val}/{m.goal}g</span>
              </div>
              <ProgBar pct={(m.val / m.goal) * 100} color={m.color} delay={0.4 + i * 0.1} animated={animated} />
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ─── 6. Fitness Card ───────────────────────────────────────────────────────────

const FITNESS_DATA = [
  { day: "M", mins: 45 },
  { day: "T", mins: 0  },
  { day: "W", mins: 30 },
  { day: "T", mins: 60 },
  { day: "F", mins: 0  },
  { day: "S", mins: 55 },
  { day: "S", mins: 20 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FitnessBarShape(props: any) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  if (value === 0) {
    return <rect x={x + width / 2 - 1} y={y} width={2} height={height} rx={1} fill="rgba(255,255,255,0.08)" />;
  }
  return <rect x={x} y={y} width={width} height={height} rx={3} fill="#7c3aed" />;
}

function LandingFitnessCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="This Week" title="Fitness" />
      <div className="flex-1 flex flex-col px-2 pb-2 pt-1">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={animated ? "on" : "off"} data={FITNESS_DATA} barCategoryGap="30%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 9 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "#1a1a24",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "white",
                }}
                formatter={(v) => [`${v}m`, "Duration"]}
              />
              <Bar
                dataKey="mins"
                shape={<FitnessBarShape />}
                isAnimationActive={animated}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between px-2 mt-0.5">
          <span className="text-white/35 text-[10px]">Last: Running · 55m</span>
          <span className="text-white/35 text-[10px]">210 min this week</span>
        </div>
      </div>
    </CardShell>
  );
}

// ─── 7. Sleep Card ─────────────────────────────────────────────────────────────

const SLEEP_DATA = [
  { day: "M", hrs: 7.5 },
  { day: "T", hrs: 6   },
  { day: "W", hrs: 8   },
  { day: "T", hrs: 7   },
  { day: "F", hrs: 6.5 },
  { day: "S", hrs: 9   },
  { day: "S", hrs: 8.5 },
];

function LandingSleepCard({ animated }: { animated: boolean }) {
  return (
    <CardShell>
      <CardHeader label="Last 7 Days" title="Sleep" />
      <div className="flex-1 flex flex-col px-2 pb-2 pt-1">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={animated ? "on" : "off"} data={SLEEP_DATA} barCategoryGap="30%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 9 }}
              />
              <ReferenceLine
                y={8}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
                label={{ value: "8h", position: "insideTopRight", fill: "rgba(255,255,255,0.28)", fontSize: 9 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "#1a1a24",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "white",
                }}
                formatter={(v) => [`${v}h`, "Sleep"]}
              />
              <Bar
                dataKey="hrs"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
                isAnimationActive={animated}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between px-2 mt-0.5">
          <span className="text-white/35 text-[10px]">Last night · 8.5h</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {(["#ef4444", "#f97316", "#eab308", "#22c55e", "#22c55e"] as string[]).map((c, i) => (
                <div key={i} className="w-3 h-1 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-emerald-400/80 text-[10px]">Good</span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ─── Insights Placeholder ──────────────────────────────────────────────────────

const INSIGHT_CARDS = [
  {
    icon: TrendingDown,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.15)",
    label: "ENERGY FORECAST",
    headline: "Luteal phase in 3 days",
    description: "Progesterone rise expected — plan lighter workouts and extra rest from Day 21.",
    tag: "Day 18 · Follicular",
    tagColor: "rgba(167,139,250,0.7)",
    tagBg: "rgba(167,139,250,0.08)",
    tagBorder: "rgba(167,139,250,0.2)",
  },
  {
    icon: Dumbbell,
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.15)",
    label: "PERFORMANCE PEAK",
    headline: "Best workout window",
    description: "Estrogen is at its peak. Strength and endurance are optimal — push hard today.",
    tag: "Day 9 · Follicular",
    tagColor: "rgba(244,63,94,0.7)",
    tagBg: "rgba(244,63,94,0.08)",
    tagBorder: "rgba(244,63,94,0.2)",
  },
  {
    icon: Moon,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.15)",
    label: "RECOVERY SIGNAL",
    headline: "Rest day recommended",
    description: "Your HRV trend and cycle data suggest your body needs recovery time today.",
    tag: "Day 27 · Luteal",
    tagColor: "rgba(6,182,212,0.7)",
    tagBg: "rgba(6,182,212,0.08)",
    tagBorder: "rgba(6,182,212,0.2)",
  },
  {
    icon: Activity,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.15)",
    label: "CYCLE TREND",
    headline: "Cycle length stabilizing",
    description: "Your last 3 cycles averaged 27.3 days — within your personal baseline range.",
    tag: "3-cycle average",
    tagColor: "rgba(52,211,153,0.7)",
    tagBg: "rgba(52,211,153,0.08)",
    tagBorder: "rgba(52,211,153,0.2)",
  },
  {
    icon: Heart,
    color: "#fb7185",
    bg: "rgba(251,113,133,0.08)",
    border: "rgba(251,113,133,0.15)",
    label: "SLEEP PATTERN",
    headline: "Sleep dips on Day 24–27",
    description: "You consistently sleep 45 min less in your late luteal phase. Melatonin may help.",
    tag: "4-cycle insight",
    tagColor: "rgba(251,113,133,0.7)",
    tagBg: "rgba(251,113,133,0.08)",
    tagBorder: "rgba(251,113,133,0.2)",
  },
  {
    icon: Sparkles,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.15)",
    label: "MOOD PREDICTION",
    headline: "High mood window ahead",
    description: "Ovulation approaching — expect elevated energy, confidence, and social drive in 2 days.",
    tag: "Day 11 · Follicular",
    tagColor: "rgba(251,191,36,0.7)",
    tagBg: "rgba(251,191,36,0.08)",
    tagBorder: "rgba(251,191,36,0.2)",
  },
];

function InsightsPlaceholder() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:[grid-template-rows:270px_270px]">
      {INSIGHT_CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            className="h-[270px] md:h-auto"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.07 }}
          >
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 h-full flex flex-col px-5 pt-5 pb-5 gap-3 hover:border-white/20 transition-colors duration-200">
              {/* Icon + label */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
                >
                  <Icon size={15} style={{ color: card.color }} />
                </div>
                <span
                  className="text-[8px] uppercase tracking-widest font-medium"
                  style={{ color: card.color }}
                >
                  {card.label}
                </span>
              </div>

              {/* Headline */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-white text-[15px] font-light leading-snug mb-2">{card.headline}</p>
                  <p className="text-white/40 text-[11px] leading-relaxed">{card.description}</p>
                </div>

                {/* Tag pill */}
                <span
                  className="self-start text-[9px] rounded-full px-2.5 py-1 leading-none"
                  style={{
                    color: card.tagColor,
                    backgroundColor: card.tagBg,
                    border: `1px solid ${card.tagBorder}`,
                  }}
                >
                  {card.tag}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── AI Placeholder ────────────────────────────────────────────────────────────

const FIONA_MESSAGES = [
  { role: "user", text: "Why am I so tired today?" },
  {
    role: "fiona",
    text: "You're on Day 24 of your luteal phase — progesterone peaks here, which naturally lowers energy and can disrupt sleep. This is completely normal for your cycle pattern. Try a gentle walk, stay hydrated, and don't push intense workouts today.",
  },
  { role: "user", text: "When will I feel better?" },
  {
    role: "fiona",
    text: "Based on your last 3 cycles, your energy usually rebounds around Day 6–8 of your next cycle — about 4 days from now. Hang in there! 🌸",
  },
];

function AIPlaceholder() {
  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
    >
      <div className="rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden flex flex-col" style={{ height: "564px" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400/60 to-purple-500/60 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-white/80" />
          </div>
          <div className="flex-1">
            <p className="text-white text-[13px] font-light leading-tight">Fiona</p>
            <p className="text-white/35 text-[10px]">AI Cycle Guide</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <span className="text-white/35 text-[10px]">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden flex flex-col gap-3 px-5 py-4">
          {FIONA_MESSAGES.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.3 }}
            >
              {msg.role === "fiona" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400/50 to-purple-500/50 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles size={10} className="text-white/70" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/[0.09] text-white/80 rounded-tr-sm"
                    : "bg-rose-500/[0.08] border border-rose-500/[0.12] text-white/65 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input bar */}
        <div className="px-4 py-3.5 border-t border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5">
            <span className="flex-1 text-[11px] text-white/20 select-none">Ask Fiona anything about your cycle…</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/20 flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-rose-400/60 -rotate-45 translate-x-px">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    titleMain: "Your entire health,",
    titleItalic: "beautifully organized.",
    subtitle: "Every metric that matters — synced to your cycle.",
  },
  {
    id: "insights",
    label: "Insights",
    titleMain: "Understand your patterns,",
    titleItalic: "before they surprise you.",
    subtitle: "Predictive cycle analytics that learn how your body moves.",
  },
  {
    id: "ai",
    label: "AI Assistant",
    titleMain: "Your personal guide,",
    titleItalic: "always in sync.",
    subtitle: "Ask Fiona anything — she knows where you are in your cycle.",
  },
];

// ─── Main Export ───────────────────────────────────────────────────────────────

const STAGGER_DELAYS = [0, 0.07, 0.14, 0.21, 0.10, 0.17, 0.24];

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 50, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 28 } },
  exit: (dir: number) => ({ x: dir * -50, opacity: 0, transition: { duration: 0.18 } }),
};

export function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const isVisible = useInView(containerRef, { once: false, margin: "-10%" });
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setAnimated(true), 450);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  // Auto-advance: every 5s when in view and not hovered
  useEffect(() => {
    if (!isVisible || isHovered) return;
    const t = setInterval(() => {
      setDirection(1);
      setActiveTab((i) => (i + 1) % TABS.length);
    }, 5000);
    return () => clearInterval(t);
  }, [isVisible, isHovered, autoKey]);

  const goTo = (idx: number) => {
    setDirection(idx > activeTab ? 1 : -1);
    setActiveTab(idx);
    setAutoKey((k) => k + 1);
  };
  const next = () => goTo((activeTab + 1) % TABS.length);
  const prev = () => goTo((activeTab + TABS.length - 1) % TABS.length);

  const bounceVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.94 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 280, damping: 16, delay },
    }),
  };

  const cardProps = (i: number, rotateY: number) => ({
    initial: "hidden" as const,
    animate: isInView ? "visible" : "hidden",
    custom: STAGGER_DELAYS[i],
    variants: bounceVariants,
    style: { transformPerspective: 900 },
    whileHover: {
      rotateX: -5,
      rotateY,
      scale: 1.03,
      transition: { type: "spring" as const, stiffness: 350, damping: 20 },
    },
  });

  return (
    <div ref={containerRef} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* ── Tab bar ── */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => goTo(i)}
            className={
              "px-5 py-2 rounded-full text-sm font-light transition-all duration-200 " +
              (activeTab === i
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/40 hover:text-white/70 border border-transparent")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Dynamic heading ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`heading-${activeTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight leading-[1.15] tracking-tight text-white mb-3">
            {TABS[activeTab].titleMain}{" "}
            <span className="italic text-white/55">{TABS[activeTab].titleItalic}</span>
          </h2>
          <p className="text-white/40 text-base font-light">{TABS[activeTab].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* ── Tab content ── */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={`content-${activeTab}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {activeTab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:[grid-template-rows:270px_270px]">
              {/* Profile — spans both rows */}
              <motion.div className="h-[564px] md:h-auto md:row-span-2" {...cardProps(0, -10)}>
                <LandingProfileCard animated={animated} />
              </motion.div>

              {/* CyclePhase */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(1, -6)}>
                <LandingCyclePhaseCard animated={animated} />
              </motion.div>

              {/* Vibe */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(2, 6)}>
                <LandingVibeCard animated={animated} />
              </motion.div>

              {/* Symptoms */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(3, 10)}>
                <LandingSymptomCard animated={animated} />
              </motion.div>

              {/* Nutrition */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(4, -6)}>
                <LandingNutritionCard animated={animated} />
              </motion.div>

              {/* Fitness */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(5, 6)}>
                <LandingFitnessCard animated={animated} />
              </motion.div>

              {/* Sleep */}
              <motion.div className="h-[270px] md:h-auto" {...cardProps(6, 10)}>
                <LandingSleepCard animated={animated} />
              </motion.div>
            </div>
          )}

          {activeTab === 1 && <InsightsPlaceholder />}
          {activeTab === 2 && <AIPlaceholder />}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom nav: ‹ dots › ── */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
        >
          <ChevronLeft size={14} />
        </button>

        {TABS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: activeTab === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
              boxShadow: activeTab === i ? "0 0 6px 1px rgba(255,255,255,0.35)" : "none",
            }}
          />
        ))}

        <button
          onClick={next}
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
