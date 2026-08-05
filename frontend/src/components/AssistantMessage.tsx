import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { ExternalLink } from "./ExternalLink";
import { SourcePill } from "./SourcePill";
import { parseAssistantContent } from "@/lib/parseAssistantContent";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      style={{ color: "var(--text-muted)" }}
      className="flex items-center gap-1.5 self-start rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

export function AssistantMessage({
  content,
  streaming,
  onFollowUp,
  highlight,
}: {
  content: string;
  streaming?: boolean;
  onFollowUp?: (q: string) => void;
  highlight?: string;
}) {
  const { answer, followUps, sources } = parseAssistantContent(content);

  const highlighted = highlight
    ? answer.replace(
        new RegExp(`(${escapeRegex(highlight)})`, "gi"),
        '<mark style="background:var(--highlight);border-radius:2px;color:inherit">$1</mark>',
      )
    : answer;

  return (
    <div className="space-y-3">
      <div
        className="prose prose-sm max-w-none leading-relaxed"
        style={{
          color: "var(--text-primary)",
          "--tw-prose-body": "var(--text-primary)",
          "--tw-prose-headings": "var(--text-primary)",
          "--tw-prose-bold": "var(--text-primary)",
          "--tw-prose-bullets": "var(--text-secondary)",
          "--tw-prose-links": "var(--text-link)",
          "--tw-prose-code": "var(--text-primary)",
          "--tw-prose-pre-code": "var(--text-secondary)",
          "--tw-prose-pre-bg": "var(--bg-surface)",
          "--tw-prose-quotes": "var(--text-secondary)",
          "--tw-prose-quote-borders": "var(--border)",
          "--tw-prose-hr": "var(--border)",
          "--tw-prose-th-borders": "var(--border)",
          "--tw-prose-td-borders": "var(--border)",
          "--tw-prose-counters": "var(--text-secondary)",
          "--tw-prose-captions": "var(--text-muted)",
          "--tw-prose-kbd": "var(--text-primary)",
          "--tw-prose-kbd-shadows": "var(--border)",
          "--tw-prose-lead": "var(--text-secondary)",
        } as React.CSSProperties}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children }) => (
              <ExternalLink href={href}>{children}</ExternalLink>
            ),
            pre: ({ children }) => (
              <pre
                className="overflow-x-auto border"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  padding: "0.9rem 1rem",
                }}
              >
                {children}
              </pre>
            ),
          }}
        >
          {highlighted}
        </ReactMarkdown>
        {streaming && (
          <span
            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle"
            style={{ background: "var(--cursor)" }}
          />
        )}
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span
            className="mr-1 text-[10px] font-medium uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Sources
          </span>
          {sources.map((url, i) => (
            <SourcePill key={i} url={url} index={i + 1} />
          ))}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp?.(q)}
              style={{
                background: "var(--pill-bg)",
                borderColor: "var(--pill-border)",
                color: "var(--pill-text)",
              }}
              className="text-left rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-active)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <CopyButton text={answer} />
    </div>
  );
}
