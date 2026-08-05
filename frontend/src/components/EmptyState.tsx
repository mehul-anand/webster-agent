import { Sparkles } from "lucide-react";

export function EmptyState({
  name,
  greeting,
  prompts,
  onAsk,
}: {
  name: string;
  greeting: string;
  prompts: { title: string; subtitle: string }[];
  onAsk: (q: string) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-2xl px-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div
            className="flex size-14 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--text-link), var(--bg-ask-btn))",
              color: "var(--text-ask-btn)",
              boxShadow: "0 10px 24px -10px var(--text-link)",
            }}
          >
            <Sparkles className="size-7" />
          </div>
          <span
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Webster
          </span>
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

        {prompts.length > 0 && (
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
            {prompts.map((p) => (
              <button
                key={p.title}
                onClick={() => onAsk(p.title)}
                className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {p.title}
                </span>
                <span
                  className="mt-0.5 block text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {p.subtitle}
                </span>
              </button>
            ))}
          </div>
        )}

        <div
          className="mt-8 hidden flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs md:flex"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-1.5">
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              ⌘⇧F / Ctrl+Shift+F
            </kbd>
            search chats
          </span>
          <span className="flex items-center gap-1.5">
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              Alt+T
            </kbd>
            focus input
          </span>
          <span className="flex items-center gap-1.5">
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              \
            </kbd>
            toggle sidebar
          </span>
        </div>
      </div>
    </div>
  );
}
