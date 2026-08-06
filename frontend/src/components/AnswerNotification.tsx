import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type AnswerToast = {
  key: string;
  convId: string;
  title: string;
};

function ToastItem({
  toast,
  onView,
  onDismiss,
}: {
  toast: AnswerToast;
  onView: (t: AnswerToast) => void;
  onDismiss: (key: string) => void;
}) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(toast.key), 10000);
    return () => clearTimeout(t);
  }, [toast.key]);

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "0 12px 32px -12px rgba(0,0,0,0.45)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Answer ready
        </p>
        <p
          className="truncate text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {toast.title}
        </p>
      </div>
      <button
        onClick={() => onView(toast)}
        className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
        style={{
          background: "var(--bg-ask-btn)",
          color: "var(--text-ask-btn)",
        }}
      >
        View
        <ArrowRight className="size-3.5" />
      </button>
      <button
        onClick={() => onDismiss(toast.key)}
        className="shrink-0 rounded p-1 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function AnswerNotification({
  toasts,
  onView,
  onDismiss,
}: {
  toasts: AnswerToast[];
  onView: (t: AnswerToast) => void;
  onDismiss: (key: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex w-72 flex-col gap-2 md:bottom-16">
      {toasts.map((t) => (
        <ToastItem key={t.key} toast={t} onView={onView} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
