import { Moon, Sun } from "lucide-react";
import { THEMES } from "../lib/theme.ts";
import type { ThemeMode } from "../lib/theme.ts";
import { useTheme } from "@/context/ThemeContext";

export function ThemePicker({ onClose }: { onClose: () => void }) {
  const { activeTheme, mode, setTheme, setMode } = useTheme();

  return (
    <div
      className="absolute bottom-14 left-2 z-50 w-64 rounded-xl border p-4 shadow-xl"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex-1 text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Mode
        </span>
        <div
          className="flex overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {(["light", "dark"] as ThemeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs transition-colors capitalize"
              style={{
                background:
                  mode === m ? "var(--bg-ask-btn)" : "var(--bg-input)",
                color: mode === m ? "var(--text-ask-btn)" : "var(--text-muted)",
              }}
            >
              {m === "light" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
              {m}
            </button>
          ))}
        </div>
      </div>

      <p
        className="mb-2 text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        Theme
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t)}
            className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-all"
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
        className="mt-3 w-full rounded-lg py-1 text-xs transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}
      >
        Close
      </button>
    </div>
  );
}
