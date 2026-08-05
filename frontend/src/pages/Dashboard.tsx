import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Menu, Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { InputBar } from "@/components/InputBar";
import { EmptyState } from "@/components/EmptyState";
import { FindBar } from "@/components/FindBar";
import { TypingDots } from "@/components/TypingDots";
import type { Message, Conversation } from "@/types/dashboard";
import { useMediaQuery } from "@/lib/useMediaQuery";

const supabase = createClient();

async function getJwt() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
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
  const suggestions = [
    "What's the latest in AI this week?",
    "Explain quantum computing simply",
    "Best practices for React performance",
    "Compare Claude vs GPT-4",
  ];

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
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
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
          className="rounded-xl border px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
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

  const firstName = user.user_metadata.full_name?.split(" ")[0] || "there";
  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      {/* ── Sidebar ── */}
      <Sidebar
        open={sidebarOpen}
        isMobile={isMobile}
        userName={user.user_metadata.full_name}
        conversations={conversations}
        activeId={activeId}
        search={search}
        searchOpen={searchOpen}
        themePickerOpen={themePickerOpen}
        conversationsLoading={conversationsLoading}
        onNewChat={newChat}
        onSelect={(id) => {
          selectConversation(id);
          if (isMobile) setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((v) => !v)}
        onSearchChange={setSearch}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        onToggleThemePicker={() => setThemePickerOpen((v) => !v)}
        onOpenThemePicker={() => setThemePickerOpen(true)}
        onLogout={logout}
        searchInputRef={searchInputRef}
      />

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isMobile && !sidebarOpen && (
          <div
            className="flex h-12 shrink-0 items-center border-b px-3"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Menu className="size-5" />
            </button>
            <span
              className="ml-2 flex-1 truncate text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {activeId ? activeTitle || "Chat" : "Webster"}
            </span>
            <button
              onClick={() => setFindOpen((v) => !v)}
              className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Search className="size-4" />
            </button>
          </div>
        )}

        {activeId && !chatLoading && (
          <div
            className="shrink-0 border-b px-4 py-2.5 text-center"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {activeTitle || "Chat"}
            </span>
          </div>
        )}

        {findOpen && (
          <FindBar
            findText={findText}
            totalMatches={totalMatches}
            findMatchIndex={findMatchIndex}
            onFindTextChange={(v) => {
              setFindText(v);
              setFindMatchIndex(0);
            }}
            onPrev={goFindPrev}
            onNext={goFindNext}
            onClose={() => {
              setFindOpen(false);
              setFindText("");
            }}
            inputRef={findInputRef}
          />
        )}

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
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
            <EmptyState
              name={firstName}
              greeting={greeting.current}
              suggestions={suggestions}
              onAsk={ask}
            />
          )}

          {chatMessages.map((msg, i) => {
            const isStreaming =
              loading &&
              msg.role === "Assistant" &&
              i === chatMessages.length - 1;
            return (
              <ChatMessage
                key={msg.id}
                msg={msg}
                streaming={isStreaming}
                onFollowUp={ask}
                highlight={findText}
                userName={user.user_metadata.full_name}
              />
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
          <InputBar
            value={query}
            onChange={setQuery}
            onSubmit={() => ask()}
            onStop={stop}
            loading={loading}
            placeholder={activeId ? "Ask a follow-up…" : "Ask anything…"}
            inputRef={chatInputRef}
          />
        </div>
      </div>

      {/* \ shortcut tooltip */}
      <div
        className="fixed bottom-4 right-4 z-50 hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs pointer-events-none select-none md:flex"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <kbd
          className="rounded border px-1 py-0.5 font-mono text-[10px]"
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
