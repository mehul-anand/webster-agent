import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.91c.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

export default function Auth() {
  async function login(provider: "github" | "google") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });

    if (error) {
      alert("Error while signing in");
    }
  }

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--text-link) 18%, transparent), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-[36rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--bg-ask-btn) 14%, transparent), transparent)",
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl border p-8 text-center shadow-xl"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow:
            "0 24px 60px -24px color-mix(in oklab, var(--bg-ask-btn) 40%, transparent)",
        }}
      >
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--text-link), var(--bg-ask-btn))",
            color: "var(--text-ask-btn)",
          }}
        >
          <Sparkles className="size-6" />
        </div>

        <h1
          className="mt-4 text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Webster
        </h1>
        <p
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Ask anything. Search the live web.
          <br />
          Get cited, up-to-date answers.
        </p>

        <div className="mt-8 space-y-2.5">
          <button
            onClick={() => login("google")}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={() => login("github")}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <GitHubIcon />
            Continue with GitHub
          </button>
        </div>

        <p
          className="mt-6 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Your conversations are saved to your account.
        </p>
      </div>
    </div>
  );
}
