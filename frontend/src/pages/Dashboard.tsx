import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ThemePicker } from "@/components/ThemePicker";
import { AssistantMessage } from "@/components/AssistantMessage";
import { TypingDots } from "@/components/TypingDots";
import { SidebarBtn } from "@/components/SidebarBtn";
import { IconBtn } from "@/components/IconBtn";
import { PlusIcon, SearchIcon, PaletteIcon, LogoutIcon } from "@/components/Icons";
import type { Message, Conversation } from "@/types/dashboard";
import { useMediaQuery } from "@/lib/useMediaQuery";

const supabase = createClient();

function killWordBackward(value: string, cursor: number): [string, number] {
  const before = value.slice(0, cursor);
  const after = value.slice(cursor);
  let i = before.length - 1;
  while (i >= 0 && before[i] === " ") i--;
  while (i >= 0 && before[i] !== " ") i--;
  const newBefore = before.slice(0, i + 1);
  return [newBefore + after, newBefore.length];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, term: string, style: React.CSSProperties): React.ReactNode {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <span key={i} style={style}>{part}</span>
      : part
  );
}

async function getJwt() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [findMatchIndex, setFindMatchIndex] = useState(0);

  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const abortRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const findOpenRef = useRef(findOpen);
  findOpenRef.current = findOpen;
  const searchOpenRef = useRef(searchOpen);
  searchOpenRef.current = searchOpen;
  const initialRestored = useRef(false);
  const greetings = [
    "Hey {name}, what's on your mind?",
    "What can I help you with, {name}?",
    "Ask me anything, {name}",
    "Ready when you are, {name}",
    "What are we exploring today, {name}?",
    "Got a question, {name}?",
  ];
  const greeting = useRef(greetings[Math.floor(Math.random() * greetings.length)]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (searchOpenRef.current) {
          setSearchOpen(false);
          setSearch("");
        } else {
          setSidebarOpen(true);
          setSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (findOpenRef.current) {
          setFindOpen(false);
        } else {
          setFindOpen(true);
          setTimeout(() => findInputRef.current?.select(), 50);
        }
        return;
      }
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        chatInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (findOpenRef.current) {
          setFindOpen(false);
          setFindText("");
          return;
        }
        setSearchOpen(false);
        setThemePickerOpen(false);
        if (isMobile) setSidebarOpen(false);
        return;
      }
      if (
        e.key === "\\" &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) setUser(data.user);
    }).finally(() => setAuthLoading(false));
  }, []);

  const fetchConversations = useCallback(async () => {
    const jwt = await getJwt();
    if (!jwt) return;
    setConversationsLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/conversations`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      setConversations(data);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Restore conversation from URL on mount
  useEffect(() => {
    if (authLoading || !user || initialRestored.current) return;
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) selectConversation(idFromUrl);
    initialRestored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);
  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  // Sync activeId to URL
  useEffect(() => {
    if (!initialRestored.current) return;
    if (activeId) {
      setSearchParams({ id: activeId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, setSearchParams]);

  async function selectConversation(id: string) {
    setActiveId(id);
    setQuery("");
    setChatMessages([]);
    setChatLoading(true);
    streamBufferRef.current = "";
    const jwt = await getJwt();
    const { data } = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/conversation/${id}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    setChatMessages(data.messages);
    setChatLoading(false);
  }

  function newChat() {
    setActiveId(null);
    setChatMessages([]);
    setQuery("");
    streamBufferRef.current = "";
  }

  async function ask(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
    setLoading(true);
    streamBufferRef.current = "";
    const jwt = await getJwt();
    abortRef.current = new AbortController();

    const userMsg: Message = {
      id: Date.now(),
      content: q,
      role: "User",
      createdAt: new Date().toISOString(),
    };
    if (activeId) {
      setChatMessages((prev) => [...prev, userMsg]);
    } else {
      setChatMessages([userMsg]);
    }
    setQuery("");

    const endpoint = activeId ? `/webster/follow-up` : `/webster/ask`;
    const body = activeId
      ? { conversationId: activeId, query: q }
      : { query: q };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        },
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        streamBufferRef.current = buffer;

        const convMatch = buffer.match(
          /<CONVERSATION_ID>(.*?)<\/CONVERSATION_ID>\n?/,
        );
        if (convMatch) {
          setActiveId(convMatch[1]);
          buffer = buffer.replace(convMatch[0], "");
        }

        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "Assistant")
            return [...prev.slice(0, -1), { ...last, content: buffer }];
          return [
            ...prev,
            {
              id: Date.now(),
              content: buffer,
              role: "Assistant" as const,
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: "Error: " + err.message,
            role: "Assistant",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      fetchConversations();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  }

  const filteredConversations = conversations.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      c.messages[0]?.content?.toLowerCase().includes(term)
    );
  });

  const totalMatches = useMemo(() => {
    if (!findText) return 0;
    const re = new RegExp(escapeRegex(findText), "gi");
    let count = 0;
    for (const msg of chatMessages) {
      const m = msg.content.match(re);
      if (m) count += m.length;
    }
    return count;
  }, [chatMessages, findText]);

  function scrollToMatch(idx: number) {
    if (!findText || totalMatches === 0) return;
    let accumulated = 0;
    for (const msg of chatMessages) {
      const count = (msg.content.match(new RegExp(escapeRegex(findText), "gi")) || []).length;
      if (idx < accumulated + count) {
        const el = document.querySelector(`[data-msg-id="${msg.id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      accumulated += count;
    }
  }

  function goFindNext() {
    if (totalMatches === 0) return;
    const next = (findMatchIndex + 1) % totalMatches;
    setFindMatchIndex(next);
    scrollToMatch(next);
  }

  function goFindPrev() {
    if (totalMatches === 0) return;
    const prev = (findMatchIndex - 1 + totalMatches) % totalMatches;
    setFindMatchIndex(prev);
    scrollToMatch(prev);
  }

  if (authLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-5 animate-spin rounded-full border-2"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--text-muted)",
            }}
          />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <button
          onClick={() => navigate("/auth")}
          className="px-6 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      {/* ── Sidebar ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`flex flex-col shrink-0 border-r transition-all duration-200 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : "relative"
        }`}
        style={{
          width: isMobile ? undefined : (sidebarOpen ? "17rem" : "3rem"),
          borderColor: "var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <div
          className="flex items-center justify-between h-12 px-2 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {sidebarOpen && (
            <span
              className="truncate text-xs px-1 flex-1"
              style={{ color: "var(--text-primary)" }}
            >
              {user.user_metadata.full_name}
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70 shrink-0"
            style={{ color: "var(--text-muted)" }}
            title={isMobile ? "Close" : (sidebarOpen ? "Collapse (\\)" : "Expand (\\")}
          >
            {isMobile || sidebarOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {sidebarOpen ? (
          <>
            <div className="p-2 space-y-1 shrink-0">
              <SidebarBtn
                icon={<PlusIcon />}
                label="New chat"
                active={activeId === null}
                onClick={newChat}
              />
              <SidebarBtn
                icon={<SearchIcon />}
                label="Search chats"
                hint="⌘⇧F"
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              />
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                      e.preventDefault();
                      const el = e.currentTarget;
                      const start = el.selectionStart ?? search.length;
                      const [newValue, newCursor] = killWordBackward(search, start);
                      setSearch(newValue);
                      setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
                    }
                  }}
                  placeholder="Filter conversations…"
                  className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {conversationsLoading && filteredConversations.length === 0 && (
                <div className="space-y-3 px-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse space-y-1.5">
                      <div className="h-3 rounded w-3/4" style={{ background: "var(--bg-active)" }} />
                      <div className="h-2 rounded w-1/2" style={{ background: "var(--bg-active)" }} />
                    </div>
                  ))}
                </div>
              )}
              {!conversationsLoading && filteredConversations.length === 0 && !search && (
                <p
                  className="text-xs px-3 py-4 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  No conversations yet
                </p>
              )}
              {filteredConversations.length === 0 && search && (
                <p
                  className="text-xs px-3 py-4 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  No matches
                </p>
              )}
              {filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    selectConversation(c.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                  style={{
                    background:
                      activeId === c.id ? "var(--bg-active)" : "transparent",
                    color:
                      activeId === c.id
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (activeId !== c.id)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (activeId !== c.id)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <div className="truncate font-medium text-sm">
                    {c.title || c.slug}
                  </div>
                  <div
                    className="truncate text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {(() => {
                      const raw = c.messages[0]?.content ?? "";
                      const match = raw.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/);
                      const clean = match
                        ? match[1].trim()
                        : raw.replace(/<[^>]+>/g, "").trim();
                      return (
                        clean.slice(0, 55) || `${c._count.messages} messages`
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>

            <div
              className="relative px-3 py-4 shrink-0 space-y-1"
              style={{ borderColor: "var(--border)" }}
            >
              {themePickerOpen && (
                <ThemePicker onClose={() => setThemePickerOpen(false)} />
              )}
              <SidebarBtn
                icon={<PaletteIcon />}
                label="Theme"
                onClick={() => setThemePickerOpen((v) => !v)}
              />
              <SidebarBtn
                icon={<LogoutIcon />}
                label="Logout"
                danger
                onClick={logout}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 pt-2">
              <IconBtn title="New chat" onClick={newChat}>
                <PlusIcon />
              </IconBtn>
              <IconBtn
                title="Search (⌘⇧F)"
                onClick={() => {
                  setSidebarOpen(true);
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
              >
                <SearchIcon />
              </IconBtn>
            </div>
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1 pb-2">
              <IconBtn
                title="Theme"
                onClick={() => {
                  setSidebarOpen(true);
                  setThemePickerOpen(true);
                }}
              >
                <PaletteIcon />
              </IconBtn>
            </div>
          </>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {isMobile && !sidebarOpen && (
          <div
            className="flex items-center h-12 px-3 border-b shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70 shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-medium ml-2 flex-1 truncate" style={{ color: "var(--text-primary)" }}>
              {activeId
                ? (conversations.find((c) => c.id === activeId)?.title || "Chat")
                : "Webster"}
            </span>
            <button
              onClick={() => setFindOpen((v) => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity hover:opacity-70 shrink-0 ml-auto"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {activeId && !chatLoading && (
          <div
            className="shrink-0 px-4 py-2.5 border-b text-center"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {conversations.find((c) => c.id === activeId)?.title || "Chat"}
            </span>
          </div>
        )}
        {findOpen && (
          <div
            className="shrink-0 flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value);
                setFindMatchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) goFindPrev();
                  else goFindNext();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart ?? findText.length;
                  const [newValue, newCursor] = killWordBackward(findText, start);
                  setFindText(newValue);
                  setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
                }
              }}
              placeholder="Find in chat…"
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-input)",
                color: "var(--text-primary)",
              }}
            />
            <span className="text-xs tabular-nums min-w-8 text-right" style={{ color: "var(--text-muted)" }}>
              {findText ? `${findMatchIndex + 1}/${totalMatches}` : ""}
            </span>
            <button
              onClick={goFindPrev}
              disabled={!findText || totalMatches === 0}
              className="p-1 rounded transition-opacity hover:opacity-70 disabled:opacity-20"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 10L7 7 4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={goFindNext}
              disabled={!findText || totalMatches === 0}
              className="p-1 rounded transition-opacity hover:opacity-70 disabled:opacity-20"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4L7 7 10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => { setFindOpen(false); setFindText(""); }}
              className="p-1 rounded transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {chatLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-5 animate-spin rounded-full border-2"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--text-muted)",
                  }}
                />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Loading conversation…
                </span>
              </div>
            </div>
          )}
          {!chatLoading && chatMessages.length === 0 && !loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <p
                  className="text-2xl font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {greeting.current.replace("{name}", user.user_metadata.full_name?.split(" ")[0] || "there")}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Powered by web search + AI
                </p>
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => {
            const isStreaming =
              loading &&
              msg.role === "Assistant" &&
              i === chatMessages.length - 1;
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={`flex ${msg.role === "User" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "User" ? (
                  <div
                    className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap"
                    style={{
                      background: "var(--bg-user-msg)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {findText && !loading
                      ? highlightText(msg.content, findText, { background: "var(--highlight)", borderRadius: "2px" })
                      : msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] md:max-w-[80%]">
                    <AssistantMessage
                      content={msg.content}
                      streaming={isStreaming}
                      onFollowUp={ask}
                      highlight={findText}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {loading &&
            chatMessages[chatMessages.length - 1]?.role !== "Assistant" && (
              <TypingDots />
            )}
          <div ref={chatEndRef} />
        </div>

        <div
          className="border-t px-4 py-4"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              ref={chatInputRef}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-input)",
                color: "var(--text-primary)",
              }}
              placeholder={activeId ? "Ask a follow-up…" : "Ask anything…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) ask();
                if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart ?? query.length;
                  const [newValue, newCursor] = killWordBackward(query, start);
                  setQuery(newValue);
                  setTimeout(() => el.setSelectionRange(newCursor, newCursor), 0);
                }
              }}
            />
            {loading ? (
              <button
                onClick={stop}
                className="px-4 py-2.5 rounded-xl border text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  background: "var(--bg-input)",
                }}
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => ask()}
                disabled={!query.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "var(--bg-ask-btn)",
                  color: "var(--text-ask-btn)",
                }}
              >
                Ask
              </button>
            )}
          </div>
        </div>
      </div>

      {/* \ shortcut tooltip */}
      <div
        className="fixed bottom-4 right-4 z-50 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs pointer-events-none select-none"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <kbd
          className="font-mono px-1 py-0.5 rounded text-[10px] border"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
          }}
        >
          \
        </kbd>
        <span>toggle sidebar</span>
      </div>
    </div>
  );
}
