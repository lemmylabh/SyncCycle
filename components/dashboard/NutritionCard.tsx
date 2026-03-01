"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Utensils, Droplets, ExternalLink } from "lucide-react";

const CALORIE_GOAL = 2000;
const WATER_GOAL_ML = 2000;

export function NutritionCard() {
  const [loading, setLoading] = useState(true);
  const [calories, setCalories] = useState<number | null>(null);
  const [waterMl, setWaterMl] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("nutrition_logs")
        .select("calories_kcal,water_ml")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (data) {
        setCalories(data.calories_kcal);
        setWaterMl(data.water_ml);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3">
        <div className="h-2.5 w-20 bg-white/10 rounded" />
        <div className="h-6 w-24 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
      </div>
    );
  }

  const hasData = calories !== null || waterMl !== null;
  const calPct = calories ? Math.min((calories / CALORIE_GOAL) * 100, 100) : 0;
  const waterGlasses = waterMl ? Math.round(waterMl / 250) : 0; // 250ml per glass, max 8

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils size={14} className="text-amber-400" />
          <p className="text-amber-400 text-xs uppercase tracking-widest">Nutrition</p>
        </div>
        <a href="/dashboard/nutrition" className="text-gray-600 hover:text-gray-400 transition-colors">
          <ExternalLink size={13} />
        </a>
      </div>

      {hasData ? (
        <>
          {/* Calories */}
          {calories !== null && (
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-white text-2xl font-bold">{calories.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">/ {CALORIE_GOAL} kcal</p>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${calPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Water */}
          {waterMl !== null && (
            <div className="flex items-center gap-2">
              <Droplets size={13} className="text-sky-400 flex-shrink-0" />
              <div className="flex gap-0.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors ${i < waterGlasses ? "bg-sky-400" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-gray-500 text-[10px] ml-1">{waterMl}ml</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <p className="text-gray-500 text-sm">Nothing logged today</p>
          <a href="/dashboard/nutrition" className="text-amber-400 text-xs hover:text-amber-300 transition-colors">
            Log Nutrition →
          </a>
        </div>
      )}
    </div>
  );
}
