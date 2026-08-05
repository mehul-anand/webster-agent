import { ArrowUpRight } from "lucide-react";

export function SourcePill({ url, index }: { url: string; index: number }) {
  let display = url;
  try {
    display = new URL(url).hostname.replace("www.", "");
  } catch {
    // keep raw url as fallback
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: "var(--pill-bg)",
        borderColor: "var(--pill-border)",
        color: "var(--pill-text)",
      }}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-[var(--pill-border)] hover:opacity-80"
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
          background: "var(--bg-active)",
          color: "var(--text-secondary)",
        }}
      >
        {index}
      </span>
      <span className="max-w-[160px] truncate">{display}</span>
      <ArrowUpRight className="size-3 shrink-0 opacity-50" />
    </a>
  );
}
