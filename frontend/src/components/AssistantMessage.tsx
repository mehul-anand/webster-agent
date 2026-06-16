import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ExternalLink } from "./ExternalLink";
import { SourcePill } from "./SourcePill";
import { CopyButton } from "./CopyButton";
import { parseAssistantContent } from "@/lib/parseAssistantContent";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        } as React.CSSProperties}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children }) => (
              <ExternalLink href={href}>{children}</ExternalLink>
            ),
          }}
        >
          {highlighted}
        </ReactMarkdown>
        {streaming && (
          <span
            className="inline-block w-0.5 h-4 animate-pulse ml-0.5 align-middle"
            style={{ background: "var(--cursor)" }}
          />
        )}
      </div>
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {sources.map((url, i) => (
            <SourcePill key={i} url={url} />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 pt-1">
        <CopyButton text={answer} />
        {followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp?.(q)}
                style={{
                  background: "var(--pill-bg)",
                  borderColor: "var(--pill-border)",
                  color: "var(--pill-text)",
                }}
                className="text-xs px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
