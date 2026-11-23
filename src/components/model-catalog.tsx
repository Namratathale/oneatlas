"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Check, ChevronDown, Grid2X2, List, RotateCcw, Search } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { formatPrice, formatTokens, type ModelSummary } from "@/lib/types";

interface ModelResponse {
  models: ModelSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
interface DirectoryResponse {
  labs: Array<{ slug: string; name: string }>;
  providers: Array<{ slug: string; name: string }>;
}
interface Filters {
  q: string;
  lab: string;
  provider: string;
  capability: string[];
  type: string;
  openWeights: boolean;
  sort: string;
}

const initialFilters: Filters = { q: "", lab: "", provider: "", capability: [], type: "", openWeights: false, sort: "newest" };
const capabilities = ["Reasoning", "Function Calling", "JSON Mode", "Vision", "Code", "Audio"];
const inputClass = "h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-[#a29b8d] dark:border-[#393a35] dark:bg-[#191a17] dark:text-[#f3f1eb]";

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") ?? "", lab: params.get("lab") ?? "", provider: params.get("provider") ?? "",
    capability: params.get("capability")?.split(",").filter(Boolean) ?? [], type: params.get("type") ?? "",
    openWeights: params.get("openWeights") === "true", sort: params.get("sort") ?? "newest"
  };
}

export function ModelCatalog(): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [directory, setDirectory] = useState<DirectoryResponse>({ labs: [], providers: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [directoryError, setDirectoryError] = useState("");
  const loadMoreController = useRef<AbortController | null>(null);
  const { compareSlugs, toggleCompare } = useApp();

  useEffect(() => {
    setFilters(readFilters());
    fetch("/api/labs")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load filter options.");
        return response.json() as Promise<DirectoryResponse>;
      })
      .then(setDirectory)
      .catch((cause: unknown) => setDirectoryError(cause instanceof Error ? cause.message : "Unable to load filter options."));
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) ? value.length > 0 : typeof value === "boolean" ? value : value !== "" && value !== "newest") {
        params.set(key, Array.isArray(value) ? value.join(",") : String(value));
      }
    });
    params.set("page", "1");
    params.set("limit", "24");
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const urlParams = new URLSearchParams(query);
    urlParams.delete("page");
    window.history.replaceState(null, "", `${window.location.pathname}${urlParams.size ? `?${urlParams}` : ""}`);
    loadMoreController.current?.abort();
    setLoadingMore(false);
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/models?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load models. Please try again.");
        return response.json() as Promise<ModelResponse>;
      })
      .then((result) => {
        setModels(result.models);
        setTotal(result.pagination.total);
        setPage(1);
        setPages(result.pagination.pages);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      loadMoreController.current?.abort();
    };
  }, [query]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const params = new URLSearchParams(query);
    params.set("page", String(nextPage));
    loadMoreController.current?.abort();
    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoadingMore(true);
    fetch(`/api/models?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load more models.");
        return response.json() as Promise<ModelResponse>;
      })
      .then((result) => {
        setModels((current) => [...current, ...result.models]);
        setPage(nextPage);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  }, [page, query]);
  const update = (patch: Partial<Filters>): void => setFilters((current) => ({ ...current, ...patch }));
  const reset = (): void => setFilters(initialFilters);
  const toggleCapability = (capability: string): void => update({
    capability: filters.capability.includes(capability)
      ? filters.capability.filter((item) => item !== capability)
      : [...filters.capability, capability]
  });
  const cardModels: Array<ModelSummary | null> = loading && models.length === 0
    ? Array.from({ length: 6 }, () => null)
    : models;

  return (
    <>
      <section className="mb-9 grid gap-8 py-4 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-7">
        <div>
          <div className="mb-4 text-xs font-medium uppercase tracking-[.15em] text-muted">The model directory · updated daily</div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[56px]">Every AI model,<br className="hidden sm:block" /> compared.</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted dark:text-[#b2b0a7]">Specs, pricing, capabilities, and providers in one place. Filter what matters, compare your shortlist, and find the right model for the job.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/rankings" className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-ink">Explore rankings</Link>
            <Link href="/labs" className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm dark:border-[#393a35] dark:bg-[#191a17]">Browse labs & providers</Link>
          </div>
        </div>
        <StatsPanel />
      </section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={filters.q} onChange={(event) => update({ q: event.target.value })} placeholder={`Search ${total || "models"}`} className={`${inputClass} w-full pl-9`} /></label>
        <select value={filters.lab} onChange={(event) => update({ lab: event.target.value })} className={`${inputClass} min-w-[135px]`}><option value="">All labs</option>{directory.labs.map((lab) => <option key={lab.slug} value={lab.slug}>{lab.name}</option>)}</select>
        <select value={filters.provider} onChange={(event) => update({ provider: event.target.value })} className={`${inputClass} min-w-[145px]`}><option value="">Any provider</option>{directory.providers.map((provider) => <option key={provider.slug} value={provider.slug}>{provider.name}</option>)}</select>
        <select value={filters.type} onChange={(event) => update({ type: event.target.value })} className={`${inputClass} min-w-[135px]`}><option value="">All types</option>{["Chat / LLM", "Reasoning", "Multimodal", "Code", "Embedding"].map((type) => <option key={type}>{type}</option>)}</select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm dark:border-[#393a35] dark:bg-[#191a17]"><input type="checkbox" checked={filters.openWeights} onChange={(event) => update({ openWeights: event.target.checked })} className="accent-[#355f52]" />Open weights</label>
        <select value={filters.sort} onChange={(event) => update({ sort: event.target.value })} className={`${inputClass} min-w-[160px]`} aria-label="Sort models">
          <option value="newest">Release date</option><option value="price_asc">Input price: low to high</option><option value="output_asc">Output price: low to high</option><option value="price_desc">Output price: high to low</option><option value="context_desc">Context: high to low</option><option value="name_asc">Name: A to Z</option>
        </select>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {capabilities.map((capability) => <button key={capability} onClick={() => toggleCapability(capability)} className={`rounded-full border px-3 py-1.5 text-xs transition ${filters.capability.includes(capability) ? "border-accent bg-[#e6eee8] text-accent dark:bg-[#26372e]" : "border-line bg-white hover:bg-[#f1efe9] dark:border-[#393a35] dark:bg-[#191a17]"}`}>{capability}</button>)}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted"><span>{loading ? "Loading…" : `${total.toLocaleString()} models`}</span><button aria-label="Card view" onClick={() => setView("cards")} className={`rounded-md border p-2 ${view === "cards" ? "border-line bg-white dark:border-[#4a4b45] dark:bg-[#23241f]" : "border-transparent"}`}><Grid2X2 size={15} /></button><button aria-label="Table view" onClick={() => setView("table")} className={`rounded-md border p-2 ${view === "table" ? "border-line bg-white dark:border-[#4a4b45] dark:bg-[#23241f]" : "border-transparent"}`}><List size={15} /></button></div>
      </div>
      {directoryError ? <p role="alert" className="mb-3 text-xs text-red-700">{directoryError}</p> : null}
      {error ? <div role="alert" className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={reset} className="inline-flex items-center gap-1 underline"><RotateCcw size={13} />Reset filters</button></div> : null}
      {!loading && !error && models.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white py-16 text-center dark:border-[#393a35] dark:bg-[#191a17]"><h2 className="text-lg font-medium">No models match these filters</h2><p className="mt-2 text-sm text-muted">Try adjusting your search or removing a filter.</p><button onClick={reset} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><RotateCcw size={14} />Reset filters</button></div> : null}
      {view === "cards" ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cardModels.map((model, index) => model ? <article key={model.id} className="rounded-xl border border-line bg-white p-4 transition hover:border-[#cfc9bc] hover:shadow-sm dark:border-[#393a35] dark:bg-[#191a17] dark:hover:border-[#575850]">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-[#fbfaf7] text-xs font-semibold dark:border-[#393a35] dark:bg-[#23241f]">{model.lab.logoBadge}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><Link href={`/models/${model.slug}`} className="truncate font-semibold hover:underline">{model.name}</Link><span className="shrink-0 rounded bg-[#f0eee7] px-1.5 py-0.5 text-[10px] text-muted dark:bg-[#292a25]">{model.isOpenWeights ? "Open weights" : "Proprietary"}</span></div><Link href={`/labs/${model.lab.slug}`} className="mt-1 block text-xs text-muted hover:underline">{model.lab.name} · {model.modelType}</Link></div></div>
          <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-5 text-muted">{model.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{model.capabilities.slice(0, 4).map((capability) => <span key={capability} className="rounded-full bg-[#f3f1eb] px-2 py-1 text-[10px] text-[#55534d] dark:bg-[#282923] dark:text-[#c2c0b7]">{capability}</span>)}</div>
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-[#f7f6f1] p-3 dark:bg-[#22231e]"><Spec label="Context" value={formatTokens(model.contextWindow)} /><Spec label="Max output" value={formatTokens(model.maxOutputTokens)} /><Spec label="Input / 1M" value={formatPrice(model.inputPricePer1M)} /><Spec label="Output / 1M" value={formatPrice(model.outputPricePer1M)} /></div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{model.offers.length} provider{model.offers.length === 1 ? "" : "s"}</span><button disabled={!compareSlugs.includes(model.slug) && compareSlugs.length >= 4} title={compareSlugs.length >= 4 && !compareSlugs.includes(model.slug) ? "Compare up to four models" : undefined} onClick={() => toggleCompare(model.slug)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${compareSlugs.includes(model.slug) ? "border-[#b6c8bc] bg-[#edf3ee] text-accent dark:bg-[#26372e]" : "border-line hover:bg-[#f3f1eb] dark:border-[#393a35]"}`}>{compareSlugs.includes(model.slug) ? <Check size={13} /> : null}{compareSlugs.includes(model.slug) ? "Added" : "+ Compare"}</button></div>
        </article> : <div key={`skeleton-${index}`} className="h-[258px] animate-pulse rounded-xl border border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]" />)}
      </div> : <div className="overflow-x-auto rounded-xl border border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f4f2ec] text-[10px] uppercase tracking-wider text-muted dark:bg-[#22231e]"><tr>{["Model", "Lab", "Providers", "Context", "Input / 1M", "Output / 1M", "Weights", ""].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{models.map((model) => <tr key={model.id} className="border-t border-line dark:border-[#34342f]"><td className="px-4 py-3"><Link className="font-medium hover:underline" href={`/models/${model.slug}`}>{model.name}</Link><div className="mt-1 text-xs text-muted">{model.modelType}</div></td><td className="px-4 py-3 text-muted">{model.lab.name}</td><td className="px-4 py-3">{model.offers.length}</td><td className="px-4 py-3 font-mono">{formatTokens(model.contextWindow)}</td><td className="px-4 py-3 font-mono">{formatPrice(model.inputPricePer1M)}</td><td className="px-4 py-3 font-mono">{formatPrice(model.outputPricePer1M)}</td><td className="px-4 py-3">{model.isOpenWeights ? "Open" : "Closed"}</td><td className="px-4 py-3"><button onClick={() => toggleCompare(model.slug)} className="text-xs text-accent">{compareSlugs.includes(model.slug) ? "Added ✓" : "+ Compare"}</button></td></tr>)}</tbody></table></div>}
      {models.length < total ? <div className="mt-6 text-center"><button disabled={loading || loadingMore || page >= pages} onClick={loadMore} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm disabled:opacity-50 dark:border-[#393a35] dark:bg-[#191a17]"><ArrowDownUp size={14} />{loadingMore ? "Loading…" : "Load more models"}</button></div> : null}
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <div className="min-w-0"><div className="truncate text-[9px] uppercase tracking-wider text-muted">{label}</div><div className="mt-1 truncate font-mono text-xs font-medium">{value}</div></div>;
}

function StatsPanel(): React.JSX.Element {
  const [stats, setStats] = useState<{ models: number; labs: number; providers: number; lowestPrice: number; openWeights: number; offers: number } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/stats").then(async (response) => {
      if (!response.ok) throw new Error("Stats could not be loaded.");
      return response.json() as Promise<{ models: number; labs: number; providers: number; lowestPrice: number; openWeights: number; offers: number }>;
    }).then(setStats).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : "Stats could not be loaded.";
      setError(message);
      console.error(message, cause);
    });
  }, []);
  return <div className="rounded-2xl border border-[#e4dfd4] bg-[#f1eee6] p-4 dark:border-[#393a35] dark:bg-[#1b1c18] sm:p-5">
    {error ? <p role="alert" className="mb-3 text-xs text-red-700">{error}</p> : null}
    <div className="grid grid-cols-4 gap-2">{[["Models", stats?.models], ["Labs", stats?.labs], ["Providers", stats?.providers], ["Lowest input", stats ? formatPrice(stats.lowestPrice) : undefined]].map(([label, value]) => <div key={String(label)}><div className="font-mono text-xl font-medium tracking-tight sm:text-2xl">{typeof value === "number" && label !== "Lowest input" ? value.toLocaleString() : value ?? "—"}</div><div className="mt-1 text-[10px] text-muted sm:text-xs">{label}</div></div>)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white/70 p-3 dark:bg-[#242520]"><div className="mb-2 flex items-center justify-between text-xs font-medium"><span>Open-weight coverage</span><span className="font-mono text-muted">{stats ? `${stats.openWeights} / ${stats.models}` : "—"}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e3e0d7] dark:bg-[#393a35]"><div className="h-full rounded-full bg-[#627a6c]" style={{ width: `${stats?.models ? stats.openWeights / stats.models * 100 : 0}%` }} /></div><div className="mt-2 text-[10px] text-muted">Models with published open weights</div></div><div className="rounded-xl bg-white/70 p-3 dark:bg-[#242520]"><div className="mb-2 flex items-center justify-between text-xs font-medium"><span>Provider listings</span><ChevronDown size={13} className="text-muted" /></div><p className="font-mono text-xl font-medium">{stats?.offers.toLocaleString() ?? "—"}</p><p className="mt-1 text-[10px] text-muted">Active model-provider offers tracked</p></div></div>
  </div>;
}
