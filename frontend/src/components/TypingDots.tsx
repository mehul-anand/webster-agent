export function TypingDots() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
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
