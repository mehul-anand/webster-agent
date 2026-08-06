import { Menu, Plus, Search } from "lucide-react";

export function BottomBar({
  onNewChat,
  onFind,
  onMenu,
}: {
  onNewChat: () => void;
  onFind: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      className="shrink-0 border-t px-2 md:hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-surface)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-stretch justify-around">
        <button
          onClick={onNewChat}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-primary)" }}
        >
          <Plus className="size-5" />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            New
          </span>
        </button>
        <button
          onClick={onFind}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-primary)" }}
        >
          <Search className="size-5" />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Find
          </span>
        </button>
        <button
          onClick={onMenu}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-primary)" }}
        >
          <Menu className="size-5" />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Menu
          </span>
        </button>
      </div>
    </div>
  );
}
