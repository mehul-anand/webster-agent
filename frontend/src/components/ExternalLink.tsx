import type { ReactNode } from "react";

export function ExternalLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--text-link)" }}
      className="underline underline-offset-2 break-all hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  );
}
