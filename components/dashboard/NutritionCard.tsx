"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";

const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 50;
const CARBS_GOAL = 250;
const FAT_GOAL = 65;

function ProgressBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function freshnessColor(hasData: boolean, today: string, logDate: string | null): string {
  if (!logDate) return "bg-white/20";
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (logDate === today) return "bg-green-400";
  if (logDate === yesterday) return "bg-amber-400";
  return "bg-white/20";
}

export function NutritionCard() {
  const [loading, setLoading] = useState(true);
  const [logDate, setLogDate] = useState<string | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [waterMl, setWaterMl] = useState<number | null>(null);
  const [protein, setProtein] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("nutrition_logs")
        .select("log_date,calories_kcal,water_ml,protein_g,carbs_g,fat_g")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (data) {
        setLogDate(data.log_date as string);
        setCalories(data.calories_kcal);
        setWaterMl(data.water_ml);
        setProtein(data.protein_g);
        setCarbs(data.carbs_g);
        setFat(data.fat_g);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3 h-full">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-2 w-16 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-3 bg-white/10 rounded" />)}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const hasData = calories !== null || protein !== null || carbs !== null || fat !== null;
  const calPct = calories ? Math.min((calories / CALORIE_GOAL) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 flex flex-col gap-4 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today</p>
          <h2 className="text-white text-base font-semibold">Nutrition</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${freshnessColor(hasData, today, logDate)}`}
            title={logDate === today ? "Logged today" : "Not logged today"}
          />
          <Link
            href="/dashboard/nutrition"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Log nutrition"
          >
            <Plus size={12} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {hasData ? (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Calories */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-gray-500 text-xs">Calories</span>
              <span className="text-white text-xs font-medium">
                {(calories ?? 0).toLocaleString()} <span className="text-gray-500 font-normal">/ {CALORIE_GOAL} kcal</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500" style={{ width: `${calPct}%` }} />
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-2">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Macros</p>
            {([
              { label: "Protein", value: protein, goal: PROTEIN_GOAL, color: "bg-purple-400" },
              { label: "Carbs",   value: carbs,   goal: CARBS_GOAL,   color: "bg-amber-400" },
              { label: "Fat",     value: fat,     goal: FAT_GOAL,     color: "bg-pink-400"  },
            ] as const).map(({ label, value, goal, color }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-400">{value ?? 0}g</span>
                </div>
                <ProgressBar value={value ?? 0} goal={goal} color={color} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-500 text-sm">Nothing logged today</p>
          <Link
            href="/dashboard/nutrition"
            className="block text-center py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            Log Nutrition →
          </Link>
        </div>
      )}
    </div>
  );
}
