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
      className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </button>
  );
}
