export function SourcePill({ url }: { url: string }) {
  let display = url;
  try {
    display = new URL(url).hostname.replace("www.", "");
  } catch {}
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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs hover:opacity-80 transition-opacity"
    >
      <span className="truncate max-w-[160px]">{display}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className="shrink-0 opacity-50"
      >
        <path
          d="M2 8L8 2M8 2H4M8 2V6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
