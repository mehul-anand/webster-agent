import type { ReactNode } from "react";

export function IconBtn({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)]"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </button>
  );
}
