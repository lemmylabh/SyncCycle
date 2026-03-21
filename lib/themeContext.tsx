"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Theme = "dark" | "aurora";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

const VALID_THEMES: Theme[] = ["dark", "aurora"];

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // 1. Apply localStorage instantly (no flash)
    const saved = localStorage.getItem("synccycle-theme");
    const normalized = saved === "glass" ? "dark" : saved;
    const local: Theme = VALID_THEMES.includes(normalized as Theme) ? (normalized as Theme) : "dark";
    setThemeState(local);
    applyTheme(local);

    // 2. Async: hydrate from DB if authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("user_profiles")
        .select("theme")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme && VALID_THEMES.includes(data.theme as Theme)) {
            const dbTheme = data.theme as Theme;
            setThemeState(dbTheme);
            localStorage.setItem("synccycle-theme", dbTheme);
            applyTheme(dbTheme);
          }
        });
    });
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("synccycle-theme", t);
    applyTheme(t);

    // Persist to DB async (fire and forget)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("user_profiles")
        .update({ theme: t })
        .eq("id", session.user.id)
        .then(() => {});
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
