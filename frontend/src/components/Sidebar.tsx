import { ChevronRight, LogOut, Palette, Plus, Search, X } from "lucide-react";
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
}) {
  const term = search.toLowerCase();
  const filtered = conversations.filter(
    (c) =>
      c.title?.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      c.messages[0]?.content?.toLowerCase().includes(term),
  );

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
                icon={<Search />}
                label="Search chats"
                hint="⌘⇧F"
                onClick={() => {
                  onToggleSearch();
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              />
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                      e.preventDefault();
                      const el = e.currentTarget;
                      const start = el.selectionStart ?? search.length;
                      const [newValue, newCursor] = killWordBackward(search, start);
                      onSearchChange(newValue);
                      setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
                    }
                  }}
                  placeholder="Filter conversations…"
                  className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                />
              )}
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
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
              {!conversationsLoading && filtered.length === 0 && !search && (
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
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]",
                    activeId === c.id && "bg-[var(--bg-active)]",
                  )}
                  style={{
                    color:
                      activeId === c.id
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  <div className="truncate text-sm font-medium">
                    {c.title || c.slug}
                  </div>
                  <div
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {conversationPreview(c)}
                  </div>
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
                title="Search (⌘⇧F)"
                onClick={() => {
                  onToggle();
                  setTimeout(() => searchInputRef.current?.focus(), 100);
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
