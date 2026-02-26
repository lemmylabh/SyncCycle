"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/");
      } else {
        setUserEmail(session.user.email ?? null);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to SyncCycle 🌸
        </h1>
        <p className="text-gray-500 text-sm">Signed in as {userEmail}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="rounded-xl border-2 border-rose-200 px-6 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
      >
        Sign Out
      </button>
    </main>
  );
}
