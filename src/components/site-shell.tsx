"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Command, Moon, Search, Sun, X } from "lucide-react";
import { useApp } from "@/components/app-provider";

interface SearchPayload {
  models: Array<{ slug: string; name: string; modelType: string; lab: { name: string } }>;
  labs: Array<{ slug: string; name: string; description: string }>;
  providers: Array<{ slug: string; name: string; description: string }>;
}

export function SiteShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const { compareSlugs, isDark, toggleTheme } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<SearchPayload>({ models: [], labs: [], providers: [] });
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState(0);
  const links = useMemo(() => [
    { href: "/models", title: "Models" }, { href: "/rankings", title: "Rankings" },
    { href: "/labs", title: "Labs & providers" }, { href: "/compare", title: "Compare" }
  ], []);
  const results = useMemo(() => [
    ...payload.models.map((item) => ({ title: item.name, subtitle: `${item.lab.name} · ${item.modelType}`, href: `/models/${item.slug}` })),
    ...payload.labs.map((item) => ({ title: item.name, subtitle: "AI lab", href: `/labs/${item.slug}` })),
    ...payload.providers.map((item) => ({ title: item.name, subtitle: "Inference provider", href: `/labs/${item.slug}` }))
  ], [payload]);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      } else if (event.key === "Escape") closeSearch();
      else if (searchOpen && event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
      } else if (searchOpen && event.key === "ArrowUp") {
        event.preventDefault();
        setSelected((value) => Math.max(value - 1, 0));
      } else if (searchOpen && event.key === "Enter" && results[selected]) {
        window.location.href = results[selected].href;
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [closeSearch, results, searchOpen, selected]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setPayload({ models: [], labs: [], providers: [] });
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    setSearchError("");
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Search request failed.");
          return response.json() as Promise<SearchPayload>;
        })
        .then(setPayload)
        .catch((error: unknown) => {
          if (error instanceof Error && error.name !== "AbortError") {
            setSearchError("Search is temporarily unavailable. Please try again.");
            console.error(error);
          }
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-[#111210] dark:text-[#f3f1eb]">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur dark:border-[#34342f] dark:bg-[#111210]/95">
        <div className="mx-auto flex h-[62px] max-w-[1480px] items-center gap-6 px-4 sm:px-7">
          <Link href="/models" className="flex shrink-0 items-center gap-2 text-[17px] font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-xs text-white dark:bg-white dark:text-ink">◎</span> OneAtlas
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => <Link key={link.href} href={link.href} className={`rounded-md px-3 py-2 text-sm transition hover:bg-[#efede6] dark:hover:bg-[#242520] ${pathname.startsWith(link.href) ? "bg-[#efede6] font-medium dark:bg-[#242520]" : "text-muted dark:text-[#aaa99f]"}`}>
              {link.title}{link.href === "/compare" && compareSlugs.length > 0 ? <span className="ml-1.5 rounded-full bg-[#dfe8de] px-1.5 py-0.5 text-[10px] text-accent">{compareSlugs.length}</span> : null}
            </Link>)}
          </nav>
          <button onClick={() => setSearchOpen(true)} className="ml-auto flex h-9 min-w-0 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-muted hover:border-[#c5beb0] dark:border-[#393a35] dark:bg-[#191a17] dark:text-[#aaa99f] sm:w-64">
            <Search size={15} /><span className="hidden flex-1 text-left sm:block">Search models, labs, providers</span><span className="ml-auto hidden items-center gap-0.5 rounded border border-line px-1 text-[10px] sm:flex"><Command size={10} />K</span>
          </button>
          <button onClick={toggleTheme} title={isDark ? "Switch to light mode" : "Switch to dark mode"} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-muted hover:bg-[#efede6] dark:border-[#393a35] dark:bg-[#191a17]">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${pathname.startsWith(link.href) ? "bg-[#efede6] font-medium dark:bg-[#242520]" : "text-muted"}`}>{link.title}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7">{children}</main>
      {compareSlugs.length > 0 && pathname !== "/compare" ? <div className="fixed inset-x-0 bottom-5 z-20 mx-auto flex w-[min(94%,560px)] items-center justify-between rounded-xl border border-line bg-white px-4 py-3 shadow-xl dark:border-[#393a35] dark:bg-[#1b1c18]">
        <span className="text-sm"><strong>{compareSlugs.length}</strong> model{compareSlugs.length === 1 ? "" : "s"} selected</span>
        <Link href={`/compare?models=${encodeURIComponent(compareSlugs.join(","))}`} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm text-white dark:bg-white dark:text-ink">Compare now <ArrowRight size={14} /></Link>
      </div> : null}
      {searchOpen ? <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-[12vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSearch(); }}>
        <section role="dialog" aria-modal="true" aria-label="Search OneAtlas" className="w-full max-w-[620px] overflow-hidden rounded-xl border border-line bg-white shadow-2xl dark:border-[#3a3b36] dark:bg-[#1b1c18]">
          <div className="flex items-center gap-3 border-b border-line px-4 dark:border-[#34342f]"><Search size={17} className="text-muted" /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} placeholder="Search models, labs, providers…" className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" /><button onClick={closeSearch} aria-label="Close search"><X size={16} /></button></div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {results.map((result, index) => <Link key={`${result.href}-${result.title}`} href={result.href} onClick={closeSearch} className={`flex items-center justify-between rounded-lg px-3 py-3 ${index === selected ? "bg-[#f3f1eb] dark:bg-[#292a25]" : "hover:bg-[#f3f1eb] dark:hover:bg-[#292a25]"}`}><span><span className="block text-sm font-medium">{result.title}</span><span className="mt-0.5 block text-xs text-muted">{result.subtitle}</span></span><ArrowRight size={14} className="text-muted" /></Link>)}
            {searchError ? <p role="alert" className="px-3 py-5 text-center text-sm text-red-700">{searchError}</p> : null}
            {query.length >= 2 && results.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">No matching models, labs, or providers.</p> : null}
            {query.length < 2 ? <p className="px-3 py-8 text-center text-sm text-muted">Type at least two characters to search the catalog.</p> : null}
          </div>
          <div className="border-t border-line px-4 py-2 text-[11px] text-muted dark:border-[#34342f]">↑↓ to navigate <span className="mx-2">·</span> Enter to open <span className="mx-2">·</span> Esc to close</div>
        </section>
      </div> : null}
    </div>
  );
}
