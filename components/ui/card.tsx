import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function Card({ children, header, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {header && (
        <div className="border-b border-slate-100 px-5 py-4">
          {typeof header === "string" ? (
            <h3 className="text-base font-semibold text-slate-800">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}

      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
