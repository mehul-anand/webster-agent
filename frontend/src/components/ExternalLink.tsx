import { ArrowUpRight } from "lucide-react";
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
      className="inline-flex items-center gap-0.5 break-all underline underline-offset-2 transition-opacity hover:opacity-80"
    >
      {children}
      <ArrowUpRight className="size-3 shrink-0" />
    </a>
  );
}
