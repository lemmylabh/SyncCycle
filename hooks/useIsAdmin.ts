"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
    });
  }, []);

  return isAdmin;
}
