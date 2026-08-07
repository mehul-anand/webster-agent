import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { killWordBackward } from "@/lib/utils";

export function FindBar({
  findText,
  totalMatches,
  findMatchIndex,
  onFindTextChange,
  onPrev,
  onNext,
  onClose,
  inputRef,
  isMobile = false,
  align = "top",
  open = true,
}: {
  findText: string;
  totalMatches: number;
  findMatchIndex: number;
  onFindTextChange: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isMobile?: boolean;
  align?: "top" | "bottom";
  open?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`${open ? "" : "hidden "}flex shrink-0 items-center gap-2 px-4 py-2 ${align === "top" ? "border-b" : ""}`}
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
    >
      <input
        ref={inputRef}
        value={findText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          onFindTextChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onPrev();
            else onNext();
            if (isMobile) e.currentTarget.blur();
          }
          if (!isMobile && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            if (e.key === "ArrowUp") onPrev();
            else onNext();
          }
          if ((e.metaKey || e.ctrlKey) && e.key === "w") {
            e.preventDefault();
            const el = e.currentTarget;
            const start = el.selectionStart ?? findText.length;
            const [newValue, newCursor] = killWordBackward(findText, start);
            onFindTextChange(newValue);
            setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
          }
        }}
        placeholder="Find in chat…"
        className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-input)",
          color: "var(--text-primary)",
        }}
      />
      <span
        className="min-w-8 text-right text-xs tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        {findText
          ? totalMatches === 0
            ? "0/0"
            : `${findMatchIndex + 1}/${totalMatches}`
          : ""}
      </span>
      {(!isMobile || !focused) && (
        <>
          <button
            onClick={onPrev}
            disabled={!findText || totalMatches === 0}
            className="flex size-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border-input)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronUp className="size-5" strokeWidth={2.5} />
          </button>
          <button
            onClick={onNext}
            disabled={!findText || totalMatches === 0}
            className="flex size-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border-input)",
              color: "var(--text-primary)",
            }}
          >
            <ChevronDown className="size-5" strokeWidth={2.5} />
          </button>
        </>
      )}
      <button
        onClick={onClose}
        className="rounded p-1 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
