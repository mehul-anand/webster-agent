import type { ReactNode } from "react";

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
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        color: danger
          ? "var(--text-muted)"
          : active
            ? "var(--text-primary)"
            : "var(--text-secondary)",
        background: active ? "var(--bg-active)" : "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
        if (danger) (e.currentTarget as HTMLElement).style.color = "#ef4444";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = active
          ? "var(--bg-active)"
          : "transparent";
        if (danger)
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {icon}
      <span>{label}</span>
      {hint && (
        <span
          className="ml-auto text-xs hidden md:inline"
          style={{ color: "var(--text-muted)" }}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
