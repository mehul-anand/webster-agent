import { Sparkles } from "lucide-react";

export function EmptyState({
  name,
  greeting,
  suggestions,
  onAsk,
}: {
  name: string;
  greeting: string;
  suggestions: string[];
  onAsk: (q: string) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-lg px-4 text-center">
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--text-link), var(--bg-ask-btn))",
            color: "var(--text-ask-btn)",
            boxShadow: "0 10px 24px -10px var(--text-link)",
          }}
        >
          <Sparkles className="size-6" />
        </div>
        <div className="mt-5 space-y-1.5">
          <p
            className="text-2xl font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {greeting.replace("{name}", name)}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Powered by web search + AI — get cited, up-to-date answers
          </p>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onAsk(s)}
                className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:opacity-80"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
