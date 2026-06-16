import { createContext, useContext, useEffect, useState } from "react";
import { THEMES, applyTheme } from "../lib/theme.ts";
import type { Theme, ThemeMode } from "../lib/theme.ts";

type ThemeContextValue = {
  activeTheme: Theme;
  mode: ThemeMode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("wb-theme");
    return THEMES.find((t) => t.name === saved) ?? THEMES[0];
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("wb-mode") as ThemeMode) ?? "dark";
  });

  useEffect(() => {
    applyTheme(activeTheme, mode);
    localStorage.setItem("wb-theme", activeTheme.name);
    localStorage.setItem("wb-mode", mode);
  }, [activeTheme, mode]);

  function setTheme(theme: Theme) {
    setActiveTheme(theme);
  }

  function setMode(m: ThemeMode) {
    setModeState(m);
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
