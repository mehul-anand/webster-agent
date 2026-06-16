import { THEMES } from "../lib/theme.ts";
import type { ThemeMode } from "../lib/theme.ts";
import { useTheme } from "@/context/ThemeContext";

export function ThemePicker({ onClose }: { onClose: () => void }) {
  const { activeTheme, mode, setTheme, setMode } = useTheme();

  return (
    <div
      className="absolute bottom-14 left-2 z-50 rounded-xl border p-4 w-64 shadow-xl"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs font-medium flex-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Mode
        </span>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {(["light", "dark"] as ThemeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 text-xs transition-colors capitalize"
              style={{
                background:
                  mode === m ? "var(--bg-ask-btn)" : "var(--bg-input)",
                color: mode === m ? "var(--text-ask-btn)" : "var(--text-muted)",
              }}
            >
              {m === "light" ? "☀️ Light" : "🌙 Dark"}
            </button>
          ))}
        </div>
      </div>

      {/* Theme grid */}
      <p
        className="text-xs font-medium mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Theme
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left border transition-all"
            style={{
              background:
                activeTheme.name === t.name
                  ? "var(--bg-active)"
                  : "var(--bg-input)",
              borderColor:
                activeTheme.name === t.name
                  ? "var(--border-input)"
                  : "transparent",
              color: "var(--text-primary)",
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full text-xs py-1 rounded-lg transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}
      >
        Close
      </button>
    </div>
  );
}
