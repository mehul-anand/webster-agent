import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SidebarBtn({
  icon,
  label,
  hint,
  active,
  danger,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        danger
          ? "hover:text-red-500"
          : "hover:bg-[var(--bg-hover)]",
        active && "bg-[var(--bg-active)]",
      )}
      style={{
        color: danger
          ? "var(--text-muted)"
          : active
            ? "var(--text-primary)"
            : "var(--text-secondary)",
      }}
    >
      {icon}
      <span className={cn(hint && "min-w-0 flex-1 truncate")}>{label}</span>
      {hint && (
        <span
          className="ml-auto hidden shrink-0 whitespace-nowrap text-xs md:inline"
          style={{ color: "var(--text-muted)" }}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
