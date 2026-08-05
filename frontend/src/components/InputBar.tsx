import { Send, Square } from "lucide-react";
import { useEffect } from "react";
import { killWordBackward } from "@/lib/utils";

export function InputBar({
  value,
  onChange,
  onSubmit,
  onStop,
  loading,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  loading: boolean;
  placeholder: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, inputRef]);

  return (
    <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border px-3 py-2.5 transition-colors focus-within:border-[var(--border-input)]">
      <textarea
        ref={inputRef}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !(e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
          if ((e.metaKey || e.ctrlKey) && e.key === "w") {
            e.preventDefault();
            const el = e.currentTarget;
            const start = el.selectionStart ?? value.length;
            const [newValue, newCursor] = killWordBackward(value, start);
            onChange(newValue);
            setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
          }
        }}
        placeholder={placeholder}
        className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed outline-none"
        style={{ color: "var(--text-primary)" }}
      />
      {loading ? (
        <button
          onClick={onStop}
          title="Stop"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-70"
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <Square className="size-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          title="Send (Enter)"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            background: "var(--bg-ask-btn)",
            color: "var(--text-ask-btn)",
          }}
        >
          <Send className="size-4" />
        </button>
      )}
    </div>
  );
}
