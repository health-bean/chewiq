"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Calendar, LineChart, Settings, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Timeline", href: "/timeline", icon: Calendar },
  { label: "Insights", href: "/insights", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: Wrench },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2",
                "transition-colors duration-150",
                "active:bg-slate-100",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
