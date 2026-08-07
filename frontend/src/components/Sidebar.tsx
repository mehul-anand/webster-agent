import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, LogOut, Palette, Plus, Search, X } from "lucide-react";
import type { Conversation } from "@/types/dashboard";
import { IconBtn } from "./IconBtn";
import { SidebarBtn } from "./SidebarBtn";
import { ThemePicker } from "./ThemePicker";
import { killWordBackward, cn } from "@/lib/utils";

function conversationPreview(c: Conversation): string {
  const raw = c.messages[0]?.content ?? "";
  const match = raw.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/);
  const clean = match ? match[1].trim() : raw.replace(/<[^>]+>/g, "").trim();
  return clean.slice(0, 55) || `${c._count.messages} messages`;
}

export function Sidebar({
  open,
  isMobile,
  userName,
  conversations,
  activeId,
  search,
  searchOpen,
  themePickerOpen,
  conversationsLoading,
  onNewChat,
  onSelect,
  onClose,
  onToggle,
  onSearchChange,
  onToggleSearch,
  onToggleThemePicker,
  onOpenThemePicker,
  onLogout,
  searchInputRef,
  streaming,
  onSelectPending,
}: {
  open: boolean;
  isMobile: boolean;
  userName: string;
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  searchOpen: boolean;
  themePickerOpen: boolean;
  conversationsLoading: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  onToggle: () => void;
  onSearchChange: (v: string) => void;
  onToggleSearch: () => void;
  onToggleThemePicker: () => void;
  onOpenThemePicker: () => void;
  onLogout: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  streaming: { key: string; convId: string | null; title: string }[];
  onSelectPending: (key: string) => void;
}) {
  const term = search.toLowerCase();
  const filtered = conversations.filter(
    (c) =>
      c.title?.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      c.messages[0]?.content?.toLowerCase().includes(term),
  );
  const pendingStreams = streaming.filter(
    (s) => s.convId === null || !conversations.some((c) => c.id === s.convId),
  );
  const streamingIds = new Set(
    streaming.map((s) => s.convId).filter((v): v is string => v !== null),
  );

  const [searchIndex, setSearchIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const safeSearchIndex =
    filtered.length === 0 ? 0 : Math.min(searchIndex, filtered.length - 1);

  function moveSearch(delta: number) {
    if (filtered.length === 0) return;
    const next = (searchIndex + delta + filtered.length) % filtered.length;
    setSearchIndex(next);
    document
      .querySelector(`[data-conv-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }

  useEffect(() => {
    if (!open || !searchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        moveSearch(e.key === "ArrowUp" ? -1 : 1);
      } else if (e.key === "Enter") {
        const row = filtered[safeSearchIndex];
        if (row) {
          e.preventDefault();
          onSelect(row.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r transition-all duration-200",
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 ${open ? "translate-x-0" : "-translate-x-full"}`
            : "relative",
        )}
        style={{
          width: isMobile ? undefined : open ? "17rem" : "3rem",
          borderColor: "var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <div
          className="flex h-12 shrink-0 items-center justify-between border-b px-2"
          style={{ borderColor: "var(--border)" }}
        >
          {open && (
            <span
              className="flex-1 truncate px-1 text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {userName}
            </span>
          )}
          <button
            onClick={onToggle}
            title={isMobile ? "Close" : open ? "Collapse (\\" : "Expand (\\"}
            className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            {open || isMobile ? (
              <X className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {open ? (
          <>
            <div className="shrink-0 space-y-1 p-2">
              <SidebarBtn icon={<Plus />} label="New chat" active={activeId === null} onClick={onNewChat} />
              <SidebarBtn
                icon={searchOpen ? <X /> : <Search />}
                label={searchOpen ? "Close search" : "Search chats"}
                hint={searchOpen ? undefined : "⌘⇧F / Ctrl+Shift+F"}
                onClick={onToggleSearch}
              />
              {searchOpen && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    value={search}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onChange={(e) => {
                      onSearchChange(e.target.value);
                      setSearchIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isMobile) {
                          e.currentTarget.blur();
                        } else {
                          const row = filtered[safeSearchIndex];
                          if (row) onSelect(row.id);
                        }
                      }
                      if (
                        !isMobile &&
                        (e.key === "ArrowUp" || e.key === "ArrowDown")
                      ) {
                        e.preventDefault();
                        moveSearch(e.key === "ArrowUp" ? -1 : 1);
                      }
                      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                        e.preventDefault();
                        const el = e.currentTarget;
                        const start = el.selectionStart ?? search.length;
                        const [newValue, newCursor] = killWordBackward(search, start);
                        onSearchChange(newValue);
                        setSearchIndex(0);
                        setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
                      }
                    }}
                    placeholder="Filter conversations…"
                    className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
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
                    {search
                      ? filtered.length
                        ? `${safeSearchIndex + 1}/${filtered.length}`
                        : "0/0"
                      : ""}
                  </span>
                  {(!isMobile || !searchFocused) && (
                    <>
                      <button
                        onClick={() => moveSearch(-1)}
                        disabled={filtered.length === 0}
                        className="flex size-7 items-center justify-center rounded-full border transition-opacity hover:opacity-80 disabled:opacity-30"
                        style={{
                          background: "var(--bg-input)",
                          borderColor: "var(--border-input)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <ChevronUp className="size-5" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => moveSearch(1)}
                        disabled={filtered.length === 0}
                        className="flex size-7 items-center justify-center rounded-full border transition-opacity hover:opacity-80 disabled:opacity-30"
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
                </div>
              )}
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2 pt-2">
              {conversationsLoading && filtered.length === 0 && (
                <div className="space-y-3 px-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse space-y-1.5">
                      <div className="h-3 w-3/4 rounded" style={{ background: "var(--bg-active)" }} />
                      <div className="h-2 w-1/2 rounded" style={{ background: "var(--bg-active)" }} />
                    </div>
                  ))}
                </div>
              )}
              {!conversationsLoading &&
                filtered.length === 0 &&
                !search &&
                pendingStreams.length === 0 && (
                <p
                  className="px-3 py-4 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No conversations yet
                </p>
              )}
              {filtered.length === 0 && search && (
                <p
                  className="px-3 py-4 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No matches
                </p>
              )}
              {pendingStreams.map((p) => (
                <button
                  key={p.key}
                  onClick={() => onSelectPending(p.key)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span
                    className="size-2 shrink-0 animate-pulse rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {p.title || "New chat…"}
                    </div>
                    <div
                      className="mt-0.5 truncate text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Generating…
                    </div>
                  </div>
                </button>
              ))}
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  data-conv-index={i}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                    activeId === c.id && "bg-[var(--bg-active)]",
                  )}
                  style={{
                    color:
                      activeId === c.id
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    boxShadow:
                      search && i === safeSearchIndex
                        ? "0 0 0 1.5px var(--text-link), 0 0 0 4px var(--bg-surface)"
                        : undefined,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {c.title || c.slug}
                    </div>
                    <div
                      className="mt-0.5 truncate text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {conversationPreview(c)}
                    </div>
                  </div>
                  {streamingIds.has(c.id) && (
                    <span
                      className="size-2 shrink-0 animate-pulse rounded-full"
                      style={{ background: "var(--accent)" }}
                      title="Generating…"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="relative shrink-0 space-y-1 px-3 py-4">
              {themePickerOpen && (
                <ThemePicker onClose={onToggleThemePicker} />
              )}
              <SidebarBtn
                icon={<Palette />}
                label="Theme"
                onClick={onToggleThemePicker}
              />
              <SidebarBtn
                icon={<LogOut />}
                label="Logout"
                danger
                onClick={onLogout}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 pt-2">
              <IconBtn title="New chat" onClick={onNewChat}>
                <Plus />
              </IconBtn>
              <IconBtn
                title="Search (⌘⇧F / Ctrl+Shift+F)"
                onClick={() => {
                  onToggle();
                  if (!searchOpen) onToggleSearch();
                }}
              >
                <Search />
              </IconBtn>
            </div>
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1 pb-2">
              <IconBtn
                title="Theme"
                onClick={() => {
                  onToggle();
                  setTimeout(onOpenThemePicker, 0);
                }}
              >
                <Palette />
              </IconBtn>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
