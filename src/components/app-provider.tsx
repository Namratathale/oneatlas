"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AppContextValue {
  compareSlugs: string[];
  toggleCompare: (slug: string) => void;
  setCompareSlugs: (slugs: string[]) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = "oneatlas-compare";

export function AppProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [compareSlugs, setCompareSlugsState] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) setCompareSlugsState(parsed.slice(0, 4));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsDark(localStorage.getItem("oneatlas-theme") === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareSlugs));
  }, [compareSlugs]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("oneatlas-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const setCompareSlugs = useCallback((slugs: string[]) => setCompareSlugsState([...new Set(slugs)].slice(0, 4)), []);
  const toggleCompare = useCallback((slug: string) => {
    setCompareSlugsState((current) => current.includes(slug) ? current.filter((value) => value !== slug) : current.length < 4 ? [...current, slug] : current);
  }, []);
  const value = useMemo(() => ({ compareSlugs, toggleCompare, setCompareSlugs, isDark, toggleTheme: () => setIsDark((current) => !current) }), [compareSlugs, toggleCompare, setCompareSlugs, isDark]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}
