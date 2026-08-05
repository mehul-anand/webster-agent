import {
  ArrowRight,
  Globe,
  History,
  Link2,
  MessageSquare,
  Palette,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Live web search",
    desc: "Every answer is grounded in real, up-to-date search results.",
  },
  {
    icon: Link2,
    title: "Cited sources",
    desc: "Numbered sources let you click through and verify each claim.",
  },
  {
    icon: MessageSquare,
    title: "Suggested follow-ups",
    desc: "One-tap follow-up questions keep the conversation moving.",
  },
  {
    icon: Palette,
    title: "6 themes × light/dark",
    desc: "Hand-tuned colorways for whatever mood you're in.",
  },
  {
    icon: History,
    title: "Saved history",
    desc: "Conversations persist per account and stay in sync.",
  },
  {
    icon: Sparkles,
    title: "Streaming answers",
    desc: "Watch answers appear in real time as they're generated.",
  },
];

export function LandingGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--text-link) 16%, transparent), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 right-1/4 h-96 w-[40rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--bg-ask-btn) 12%, transparent), transparent)",
        }}
      />

      {/* Nav */}
      <nav
        className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--text-link), var(--bg-ask-btn))",
              color: "var(--text-ask-btn)",
            }}
          >
            <Sparkles className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Webster</span>
        </div>
        <button
          onClick={onSignIn}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          Sign in
        </button>
      </nav>

      <main className="relative mx-auto max-w-5xl px-6 pb-20">
        {/* Hero */}
        <section className="pt-14 text-center md:pt-20">
          <h1
            className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Ask anything.
            <br />
            Search the live web.
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Webster answers your questions with real-time search results, cited
            sources, and one-tap follow-ups — so you can trust what you read.
          </p>
          <button
            onClick={onSignIn}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--bg-ask-btn)",
              color: "var(--text-ask-btn)",
            }}
          >
            Start asking
            <ArrowRight className="size-4" />
          </button>
        </section>

        {/* Mock chat preview */}
        <section className="mt-16">
          <div
            className="mx-auto max-w-2xl rounded-2xl border p-5 md:p-6"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              boxShadow:
                "0 24px 60px -24px color-mix(in oklab, var(--bg-ask-btn) 35%, transparent)",
            }}
          >
            <div
              className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
              style={{ background: "var(--bg-user-msg)" }}
            >
              What's the latest in open-source AI?
            </div>
            <div className="mt-4 flex items-start gap-3">
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
              <div className="min-w-0 space-y-3">
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Open-source AI moved fast this year. Local-first models and
                  open-weight releases are now competitive with the major
                  closed APIs for many workloads.
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="mr-1 text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sources
                  </span>
                  {["huggingface.co", "arxiv.org", "github.com"].map((s, i) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                      style={{
                        background: "var(--pill-bg)",
                        borderColor: "var(--pill-border)",
                        color: "var(--pill-text)",
                      }}
                    >
                      <span
                        className="flex size-4 items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{
                          background: "var(--bg-active)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Best open models to self-host",
                    "How to fine-tune locally",
                  ].map((q) => (
                    <span
                      key={q}
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{
                        background: "var(--pill-bg)",
                        borderColor: "var(--pill-border)",
                        color: "var(--pill-text)",
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border p-5 transition-colors hover:bg-[var(--bg-surface)]"
              style={{ borderColor: "var(--border)" }}
            >
              <f.icon
                className="size-5"
                style={{ color: "var(--text-link)" }}
              />
              <h3
                className="mt-3 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer
        className="relative border-t py-6 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Webster — web-search-augmented AI answers.
      </footer>
    </div>
  );
}
