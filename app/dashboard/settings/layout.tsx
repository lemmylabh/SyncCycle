"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsDropdown } from "@/components/mobile/SettingsDropdown";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar — hidden on mobile */}
      <SettingsSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header — hidden on desktop */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[var(--page-bg)] flex-shrink-0">
          {/* Left spacer — balances the close button so dropdown stays centered */}
          <div className="w-8" />

          {/* Center: settings section dropdown */}
          <SettingsDropdown />

          {/* Right: close button → back to dashboard */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
