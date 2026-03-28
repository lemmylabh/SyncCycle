"use client";

import { usePathname } from "next/navigation";
import { User, Lock, LayoutDashboard, Palette, CreditCard, Plug, HelpCircle, type LucideIcon } from "lucide-react";

const items: { Icon: LucideIcon; label: string; href: string }[] = [
  { Icon: User,           label: "Profile",       href: "/dashboard/settings/profile" },
  { Icon: Lock,           label: "Account",       href: "/dashboard/settings/account" },
  { Icon: LayoutDashboard,label: "Dashboard",     href: "/dashboard/settings/dashboard" },
  { Icon: Palette,        label: "App Settings",  href: "/dashboard/settings/app-settings" },
  { Icon: CreditCard,     label: "Subscription",  href: "/dashboard/settings/subscription" },
  { Icon: Plug,           label: "Connections",   href: "/dashboard/settings/connections" },
  { Icon: HelpCircle,     label: "Help & Support",href: "/dashboard/settings/help" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex w-[220px] flex-shrink-0 sticky top-0 border-r border-white/10 bg-white/[0.025] flex-col"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto">
        {items.map(({ Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <div key={href} className="relative">
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-violet-500 rounded-full" />
              )}
              <a
                href={href}
                className={
                  isActive
                    ? "flex items-center gap-3 px-3 py-2 rounded-lg text-violet-400 font-medium text-sm bg-violet-500/[0.12]"
                    : "flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm"
                }
              >
                <Icon size={15} className="flex-shrink-0" />
                {label}
              </a>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
