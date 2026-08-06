import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import { Check, Copy } from "lucide-react";
import { isValidElement, useState } from "react";
import { ExternalLink } from "./ExternalLink";
import { SourcePill } from "./SourcePill";
import { parseAssistantContent } from "@/lib/parseAssistantContent";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
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

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      title={copied ? "Copied" : "Copy code"}
      className="absolute right-2 top-2 rounded p-1 transition-colors hover:bg-[var(--bg-hover)]"
      style={{ color: "var(--text-muted)" }}
    >
      {copied ? (
        <Check className="size-3.5" style={{ color: "var(--text-link)" }} />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function AssistantMessage({
  content,
  streaming,
  onFollowUp,
  highlight,
  activeMatch,
}: {
  content: string;
  streaming?: boolean;
  onFollowUp?: (q: string) => void;
  highlight?: string;
  activeMatch?: number | null;
}) {
  const { answer, followUps, sources } = parseAssistantContent(content);

  let matchCount = 0;
  const highlighted = highlight
    ? answer.replace(
        new RegExp(`(${escapeRegex(highlight)})`, "gi"),
        (m) => {
          const idx = matchCount;
          const active = activeMatch === matchCount;
          matchCount += 1;
          return `<mark data-find-index="${idx}" style="background:var(--highlight);border-radius:2px;color:inherit${
            active ? ";box-shadow:0 0 0 1.5px var(--text-link)" : ""
          }">${m}</mark>`;
        },
      )
    : answer;

  const followUpsPending =
    streaming &&
    content.includes("</ANSWER>") &&
    !content.includes("<FOLLOW_UPS>");

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
          remarkPlugins={streaming ? [remarkGfm] : [remarkGfm, remarkMath]}
          rehypePlugins={
            streaming
              ? [rehypeRaw]
              : [rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]
          }
          components={{
            a: ({ href, children }) => (
              <ExternalLink href={href}>{children}</ExternalLink>
            ),
            pre: ({ children }) => {
              const codeText = extractText(children);
              return (
                <div className="relative">
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
                  {codeText && <CodeCopyButton text={codeText} />}
                </div>
              );
            },
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

      {followUps.length > 0 ? (
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
      ) : followUpsPending ? (
        <div
          className="flex items-center gap-2 pt-1 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            className="inline-block size-3 animate-spin rounded-full border"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--text-muted)",
            }}
          />
          Generating follow-ups…
        </div>
      ) : null}

      <CopyButton text={answer} />
    </div>
  );
}
