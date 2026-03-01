"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, Loader2 } from "lucide-react";

export function DemoLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "demo@syncycle.ai",
      password: "Hello@1220",
    });
    if (authError) {
      setError("Demo unavailable. Try again.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div>
      <button
        onClick={handleDemo}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-5 py-2.5 text-sm text-gray-500 hover:border-rose-400 hover:text-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Eye size={15} />
        )}
        Try Demo — no account needed
      </button>
      {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
    </div>
  );
}
