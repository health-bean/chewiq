"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { user, loading } = useSession();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <span className="text-lg font-bold tracking-tight text-indigo-600">
          FILO
        </span>

        {/* User area */}
        <div className="flex items-center gap-3">
          {!loading && user && (
            <>
              <span className="text-sm text-slate-600">{user.firstName}</span>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                  "transition-colors duration-150"
                )}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
