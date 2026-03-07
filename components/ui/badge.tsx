import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variantClasses = {
  allowed: "bg-green-50 text-green-700 ring-green-600/20",
  avoid: "bg-red-50 text-red-700 ring-red-600/20",
  moderation: "bg-amber-50 text-amber-700 ring-amber-600/20",
  default: "bg-slate-50 text-slate-600 ring-slate-500/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
} as const;

type BadgeVariant = keyof typeof variantClasses;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium ring-1 ring-inset",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export type { BadgeProps, BadgeVariant };
