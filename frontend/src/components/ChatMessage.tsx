import { Sparkles } from "lucide-react";
import { AssistantMessage } from "./AssistantMessage";
import type { Message } from "@/types/dashboard";
import { cn } from "@/lib/utils";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(
  text: string,
  term: string,
  style: React.CSSProperties,
): React.ReactNode {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <span key={i} style={style}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ChatMessage({
  msg,
  streaming,
  onFollowUp,
  highlight,
  userName,
}: {
  msg: Message;
  streaming: boolean;
  onFollowUp: (q: string) => void;
  highlight: string;
  userName: string;
}) {
  const isUser = msg.role === "User";

  return (
    <div
      data-msg-id={msg.id}
      className={cn("flex items-start gap-3", isUser && "justify-end")}
    >
      {!isUser && (
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
      )}

      <div
        className={cn(
          "min-w-0",
          isUser ? "max-w-[85%] md:max-w-[70%]" : "max-w-[90%] md:max-w-[80%]",
        )}
      >
        {isUser ? (
          <div
            className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words"
            style={{
              background: "var(--bg-user-msg)",
              color: "var(--text-primary)",
            }}
          >
            {highlight
              ? highlightText(msg.content, highlight, {
                  background: "var(--highlight)",
                  borderRadius: "2px",
                })
              : msg.content}
          </div>
        ) : (
          <AssistantMessage
            content={msg.content}
            streaming={streaming}
            onFollowUp={onFollowUp}
            highlight={highlight}
          />
        )}
      </div>

      {isUser && (
        <div
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {initials(userName) || "U"}
        </div>
      )}
    </div>
  );
}
