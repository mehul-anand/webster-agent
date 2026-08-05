import { Sparkles } from "lucide-react";

export function TypingDots() {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          background:
            "linear-gradient(135deg, var(--text-link), var(--bg-ask-btn))",
          color: "var(--text-ask-btn)",
        }}
      >
        <Sparkles className="size-3.5" />
      </div>
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-3"
        style={{ background: "var(--bg-surface)" }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full"
            style={{
              background: "var(--text-muted)",
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
