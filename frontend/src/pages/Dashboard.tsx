import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { flushSync } from "react-dom";
import axios from "axios";
import { ArrowDown } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BottomBar } from "@/components/BottomBar";
import { ChatMessage } from "@/components/ChatMessage";
import { InputBar } from "@/components/InputBar";
import { EmptyState } from "@/components/EmptyState";
import { FindBar } from "@/components/FindBar";
import { TypingDots } from "@/components/TypingDots";
import { LandingGate } from "@/components/LandingGate";
import { AnswerNotification } from "@/components/AnswerNotification";
import { parseAssistantContent } from "@/lib/parseAssistantContent";
import type { AnswerToast } from "@/components/AnswerNotification";
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

function countFindMatches(msg: Message, term: string): number {
  const text =
    msg.role === "User"
      ? msg.content
      : parseAssistantContent(msg.content).answer;
  return (text.match(new RegExp(escapeRegex(term), "gi")) || []).length;
}

type ActiveStream = {
  key: string;
  convId: string | null;
  title: string;
  controller: AbortController;
  buffer: string;
  msgId: number | null;
  error: boolean;
};

type StreamInfo = {
  key: string;
  convId: string | null;
  title: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
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
  const [streamingList, setStreamingList] = useState<StreamInfo[]>([]);
  const [toasts, setToasts] = useState<AnswerToast[]>([]);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const streamsRef = useRef(new Map<string, ActiveStream>());
  const activeIdRef = useRef<string | null>(null);
  const pendingKeyRef = useRef("");
  const navEpochRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
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
  const prompts = [
    { title: "What's new in AI this week?", subtitle: "Get the latest with live web search" },
    { title: "Explain quantum computing", subtitle: "A simple, plain-English breakdown" },
    { title: "React performance tips", subtitle: "Best practices for faster apps" },
    { title: "Compare Claude vs GPT-4", subtitle: "Strengths and weaknesses side-by-side" },
  ];

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (searchOpenRef.current) {
          setSearchOpen(false);
          setSearch("");
        } else {
          openSidebarSearch();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (findOpenRef.current) closeFind();
        else openFind();
        return;
      }
      if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        findOpenRef.current &&
        !searchOpenRef.current &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        if (e.key === "ArrowUp") findNavRef.current.prev();
        else findNavRef.current.next();
        return;
      }
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        chatInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (findOpenRef.current) {
          closeFind();
          return;
        }
        if (searchOpenRef.current) {
          setSearchOpen(false);
          setSearch("");
          return;
        }
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
    if (!nearBottomRef.current) return;
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

  function isStreamRenderable(s: ActiveStream) {
    if (s.convId !== null) return activeIdRef.current === s.convId;
    return activeIdRef.current === null && pendingKeyRef.current === s.key;
  }

  function resetScroll() {
    nearBottomRef.current = true;
    setShowScrollDown(false);
  }

  function onMessagesScroll() {
    const el = messagesRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = near;
    setShowScrollDown(!near);
  }

  function scrollToBottom() {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    nearBottomRef.current = true;
    setShowScrollDown(false);
  }

  async function selectConversation(id: string) {
    navEpochRef.current += 1;
    activeIdRef.current = id;
    setActiveId(id);
    setQuery("");
    setChatMessages([]);
    resetScroll();
    setChatLoading(true);
    const jwt = await getJwt();
    const { data } = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/conversation/${id}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    let msgs: Message[] = data.messages;
    const s = streamsRef.current.get(id);
    if (s && s.buffer) {
      if (s.msgId === null) s.msgId = Date.now();
      msgs = [
        ...msgs,
        { id: s.msgId, content: s.buffer, role: "Assistant", createdAt: new Date().toISOString() },
      ];
    }
    setChatMessages(msgs);
    setChatLoading(false);
  }

  function newChat() {
    navEpochRef.current += 1;
    activeIdRef.current = null;
    setActiveId(null);
    setChatMessages([]);
    resetScroll();
    setQuery("");
  }

  function viewPendingStream(key: string) {
    const s = streamsRef.current.get(key);
    if (!s) return;
    navEpochRef.current += 1;
    activeIdRef.current = null;
    pendingKeyRef.current = key;
    setActiveId(null);
    resetScroll();
    const msgs: Message[] = [];
    if (s.title) {
      msgs.push({ id: Date.now(), content: s.title, role: "User", createdAt: new Date().toISOString() });
    }
    if (s.buffer) {
      if (s.msgId === null) s.msgId = Date.now();
      msgs.push({ id: s.msgId, content: s.buffer, role: "Assistant", createdAt: new Date().toISOString() });
    }
    setChatMessages(msgs);
    setQuery("");
  }

  async function ask(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q || viewStreaming) return;

    const target = activeId;
    const key = target ?? `new-${Date.now()}`;
    if (streamsRef.current.has(key)) return;

    const controller = new AbortController();
    const stream: ActiveStream = {
      key,
      convId: target,
      title: q,
      controller,
      buffer: "",
      msgId: null,
      error: false,
    };
    streamsRef.current.set(key, stream);
    if (!target) pendingKeyRef.current = key;
    setStreamingList((prev) => [...prev, { key, convId: target, title: q }]);

    const startEpoch = navEpochRef.current;
    const userMsg: Message = {
      id: Date.now(),
      content: q,
      role: "User",
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => (target ? [...prev, userMsg] : [userMsg]));
    setQuery("");

    const endpoint = target ? `/webster/follow-up` : `/webster/ask`;
    const body = target
      ? { conversationId: target, query: q }
      : { query: q };

    try {
      const jwt = await getJwt();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // non-JSON error body, keep the generic message
        }
        throw new Error(message);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const s = streamsRef.current.get(key);
        if (!s) break;
        s.buffer = buffer;

        const convMatch = buffer.match(
          /<CONVERSATION_ID>(.*?)<\/CONVERSATION_ID>\n?/,
        );
        if (convMatch) {
          const convId = convMatch[1];
          buffer = buffer.replace(convMatch[0], "");
          s.convId = convId;
          s.buffer = buffer;
          setStreamingList((prev) =>
            prev.map((e) => (e.key === key ? { ...e, convId } : e)),
          );
          if (
            activeIdRef.current === null &&
            (startEpoch === navEpochRef.current || pendingKeyRef.current === key)
          ) {
            activeIdRef.current = convId;
            setActiveId(convId);
          }
        }

        if (!isStreamRenderable(s)) continue;

        if (s.msgId === null) s.msgId = Date.now();
        const mid = s.msgId;
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "Assistant" && last.id === mid)
            return [...prev.slice(0, -1), { ...last, content: buffer }];
          return [
            ...prev,
            {
              id: mid,
              content: buffer,
              role: "Assistant" as const,
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    } catch (err) {
      const s = streamsRef.current.get(key);
      if (s) s.error = true;
      if (err instanceof Error && err.name !== "AbortError" && !controller.signal.aborted) {
        const s2 = streamsRef.current.get(key);
        if (s2 && isStreamRenderable(s2)) {
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
      }
    } finally {
      const s = streamsRef.current.get(key);
      streamsRef.current.delete(key);
      if (pendingKeyRef.current === key) pendingKeyRef.current = "";
      setStreamingList((prev) => prev.filter((e) => e.key !== key));
      if (s && !s.error && !controller.signal.aborted && s.convId && activeIdRef.current !== s.convId) {
        setToasts((prev) => [...prev, { key, convId: s.convId!, title: s.title }]);
      }
      fetchConversations();
    }
  }

  function stop() {
    const s = activeId
      ? streamsRef.current.get(activeId)
      : streamsRef.current.get(pendingKeyRef.current);
    s?.controller.abort();
  }

  function dismissToast(key: string) {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }

  function viewToast(t: AnswerToast) {
    dismissToast(t.key);
    selectConversation(t.convId);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  }

  const matchInfo = useMemo(() => {
    const info: { first: number | null; count: number }[] = [];
    let acc = 0;
    for (const msg of chatMessages) {
      const count = countFindMatches(msg, findText);
      info.push(count > 0 ? { first: acc, count } : { first: null, count: 0 });
      acc += count;
    }
    return info;
  }, [chatMessages, findText]);
  const totalMatches = matchInfo.reduce((sum, i) => sum + i.count, 0);

  function scrollToMatch(idx: number) {
    if (!findText || totalMatches === 0) return;
    for (let i = 0; i < chatMessages.length; i++) {
      const info = matchInfo[i];
      if (
        info.first !== null &&
        idx >= info.first &&
        idx < info.first + info.count
      ) {
        document
          .querySelector(`[data-msg-id="${chatMessages[i].id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
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

  const findNavRef = useRef({ next: goFindNext, prev: goFindPrev });
  findNavRef.current = { next: goFindNext, prev: goFindPrev };

  function openFind() {
    flushSync(() => {
      setFindOpen(true);
      setFindMatchIndex(0);
    });
    findInputRef.current?.select();
  }

  function openSidebarSearch() {
    flushSync(() => {
      setSidebarOpen(true);
      setSearchOpen(true);
    });
    searchInputRef.current?.select();
  }

  function closeFind() {
    setFindOpen(false);
    setFindText("");
    chatInputRef.current?.focus();
  }

  if (authLoading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
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
    return <LandingGate onSignIn={() => navigate("/auth")} />;
  }

  const firstName = user.user_metadata.full_name?.split(" ")[0] || "there";
  const activeTitle = conversations.find((c) => c.id === activeId)?.title;
  const viewStreaming = streamingList.some((e) =>
    activeId
      ? e.convId === activeId
      : e.convId === null && e.key === pendingKeyRef.current,
  );

  const findBarEl = (
    <FindBar
      open={findOpen}
      findText={findText}
      totalMatches={totalMatches}
      findMatchIndex={findMatchIndex}
      onFindTextChange={(v) => {
        setFindText(v);
        setFindMatchIndex(0);
      }}
      onPrev={goFindPrev}
      onNext={goFindNext}
      onClose={closeFind}
      inputRef={findInputRef}
      align={isMobile ? "bottom" : "top"}
    />
  );

  return (
    <div
      className="flex h-dvh overflow-hidden"
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
        streaming={streamingList}
        onNewChat={() => {
          newChat();
          if (isMobile) setSidebarOpen(false);
        }}
        onSelect={(id) => {
          selectConversation(id);
          if (isMobile) setSidebarOpen(false);
        }}
        onSelectPending={(key) => {
          viewPendingStream(key);
          if (isMobile) setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((v) => !v)}
        onSearchChange={setSearch}
        onToggleSearch={() => {
          if (searchOpen) {
            setSearchOpen(false);
            setSearch("");
          } else {
            flushSync(() => setSearchOpen(true));
            searchInputRef.current?.select();
          }
        }}
        onToggleThemePicker={() => setThemePickerOpen((v) => !v)}
        onOpenThemePicker={() => setThemePickerOpen(true)}
        onLogout={logout}
        searchInputRef={searchInputRef}
      />

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isMobile && !sidebarOpen && activeId && (
          <div
            className="flex shrink-0 items-center border-b px-3"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              height: "calc(3rem + env(safe-area-inset-top))",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <span
              className="flex-1 truncate text-center text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {activeTitle || "Chat"}
            </span>
          </div>
        )}

        {activeId && !chatLoading && (
          <div
            className="hidden shrink-0 border-b px-4 py-2.5 text-center md:block"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg)",
              paddingTop: "calc(0.625rem + env(safe-area-inset-top))",
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {activeTitle || "Chat"}
            </span>
          </div>
        )}

        {!isMobile && findBarEl}

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={messagesRef}
            onScroll={onMessagesScroll}
            className="flex-1 space-y-6 overflow-y-auto px-4 pt-6 pb-10 md:pb-6"
            style={{
              paddingTop:
                isMobile && !activeId
                  ? "calc(1.5rem + env(safe-area-inset-top))"
                  : undefined,
            }}
          >
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
            {!chatLoading && chatMessages.length === 0 && !viewStreaming && (
              <EmptyState
                name={firstName}
                greeting={greeting.current}
                prompts={prompts}
                onAsk={ask}
              />
            )}

            {chatMessages.map((msg, i) => {
              const isStreaming =
                viewStreaming &&
                msg.role === "Assistant" &&
                i === chatMessages.length - 1;
              const info = matchInfo[i];
              const activeLocal =
                info.first !== null &&
                findMatchIndex >= info.first &&
                findMatchIndex < info.first + info.count
                  ? findMatchIndex - info.first
                  : null;
              return (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  streaming={isStreaming}
                  onFollowUp={ask}
                  highlight={findText}
                  activeMatch={activeLocal}
                  userName={user.user_metadata.full_name}
                />
              );
            })}

            {viewStreaming &&
              chatMessages[chatMessages.length - 1]?.role !== "Assistant" && (
                <TypingDots />
              )}
            <div ref={chatEndRef} />
          </div>

          {showScrollDown && chatMessages.length > 0 && (
            <button
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              className="absolute bottom-4 right-4 z-10 flex size-9 items-center justify-center rounded-full border shadow-sm transition-opacity hover:opacity-80"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <ArrowDown className="size-4" />
            </button>
          )}
        </div>

        {isMobile && findBarEl}

        <div
          className="border-t px-4 py-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg)",
          }}
        >
          <InputBar
            value={query}
            onChange={setQuery}
            onSubmit={() => ask()}
            onStop={stop}
            loading={viewStreaming}
            placeholder={activeId ? "Ask a follow-up…" : "Ask anything…"}
            inputRef={chatInputRef}
          />
        </div>

        <BottomBar
          onNewChat={() => {
            newChat();
            if (isMobile) setSidebarOpen(false);
          }}
          onFind={() => (findOpen ? closeFind() : openFind())}
          onMenu={() => setSidebarOpen(true)}
        />
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

      {/* Completion notifications */}
      <AnswerNotification
        toasts={toasts}
        onView={viewToast}
        onDismiss={dismissToast}
      />
    </div>
  );
}
