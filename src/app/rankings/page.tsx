"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Trophy } from "lucide-react";
import { formatPrice, formatTokens } from "@/lib/types";

interface RankingEntry {
  position: number;
  score: number;
  percentage: number;
  model: {
    slug: string; name: string; contextWindow: number; inputPricePer1M: number; outputPricePer1M: number;
    lab: { slug: string; name: string }; isOpenWeights: boolean;
  };
}
interface RankingsResponse {
  benchmark: { slug: string; name: string; category: string; description: string; maxScore: number };
  entries: RankingEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const benchmarkOptions = [
  { slug: "mmlu-pro", label: "MMLU-Pro" }, { slug: "swe-bench", label: "SWE-bench / Coding" },
  { slug: "gpqa-diamond", label: "GPQA Diamond" }, { slug: "math-500", label: "MATH-500" }, { slug: "mmmu", label: "MMMU" }
];
const categories = ["All", "Reasoning", "Coding", "Open Weights"];

export default function RankingsPage(): React.JSX.Element {
  const [benchmark, setBenchmark] = useState("mmlu-pro");
  const [category, setCategory] = useState("All");
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ benchmark, category, limit: "50", page: "1" });
    const controller = new AbortController();
    setLoading(true);
    setPage(1);
    setData(null);
    setError("");
    setLoadMoreError("");
    fetch(`/api/rankings?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load benchmark rankings.");
        return response.json() as Promise<RankingsResponse>;
      })
      .then((result) => { setData(result); setError(""); })
      .catch((cause: unknown) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [benchmark, category]);

  const loadMore = async (): Promise<void> => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ benchmark, category, limit: "50", page: String(nextPage) });
      const response = await fetch(`/api/rankings?${params}`);
      if (!response.ok) throw new Error("Unable to load more ranking entries.");
      const result = await response.json() as RankingsResponse;
      setData((current) => current ? { ...result, entries: [...current.entries, ...result.entries] } : result);
      setPage(nextPage);
      setLoadMoreError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to load more ranking entries.";
      setLoadMoreError(message);
      console.error(message, cause);
    } finally {
      setLoadingMore(false);
    }
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs uppercase tracking-[.15em] text-muted">Model intelligence</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Rankings & benchmarks</h1><p className="mt-2 max-w-2xl text-sm text-muted">Explore published benchmark performance to find the strongest models for your workload.</p></div><div className="text-xs text-muted"><span className="font-mono text-ink dark:text-white">{data?.pagination.total ?? "—"}</span> scored entries</div></div>
    <div className="mt-6 flex flex-wrap gap-2">{benchmarkOptions.map((option) => <button key={option.slug} onClick={() => setBenchmark(option.slug)} className={`rounded-lg border px-3 py-2 text-xs ${benchmark === option.slug ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink" : "border-line bg-white text-muted dark:border-[#393a35] dark:bg-[#191a17]"}`}>{option.label}</button>)}</div>
    <div className="mt-3 flex flex-wrap items-center gap-2">{categories.map((option) => <button key={option} onClick={() => setCategory(option)} className={`rounded-full border px-3 py-1.5 text-xs ${category === option ? "border-[#c6d3c8] bg-[#e7efe8] text-accent dark:bg-[#26372e]" : "border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]"}`}>{option}</button>)}</div>
    <section className="mt-6 overflow-hidden rounded-xl border border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#f7f6f1] px-4 py-4 dark:border-[#34342f] dark:bg-[#22231e]"><div><h2 className="font-semibold">{data?.benchmark.name ?? "Benchmark leaderboard"}</h2><p className="mt-1 text-xs text-muted">{data?.benchmark.description ?? "Loading benchmark details…"}</p></div><span className="inline-flex items-center gap-1 text-xs text-muted"><Trophy size={14} />Higher is better</span></div>
      {error ? <p role="alert" className="p-8 text-center text-sm text-red-700">{error}</p> : null}
      {!error && loading ? <div className="space-y-3 p-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-[#eeece6] dark:bg-[#22231e]" />)}</div> : null}
      {!error && !loading && data?.entries.length === 0 ? <p className="p-10 text-center text-sm text-muted">No scores available for this benchmark and filter combination.</p> : null}
      {!error && !loading && data?.entries.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-muted"><tr>{["Rank", "Model", "Score", "Context", "Input / 1M", "Output / 1M"].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead><tbody>{data.entries.map((entry) => <tr key={entry.model.slug} className="border-t border-line dark:border-[#34342f]"><td className="px-4 py-3"><span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs ${entry.position <= 3 ? "bg-[#f0eee7] font-semibold" : "text-muted"}`}>{entry.position}</span></td><td className="px-4 py-3"><Link href={`/models/${entry.model.slug}`} className="font-medium hover:underline">{entry.model.name}</Link><div className="mt-1 text-xs text-muted"><Link href={`/labs/${entry.model.lab.slug}`} className="hover:underline">{entry.model.lab.name}</Link>{entry.model.isOpenWeights ? " · Open weights" : ""}</div></td><td className="px-4 py-3"><div className="flex items-center gap-3"><span className="w-12 font-mono">{entry.score.toFixed(1)}</span><div className="h-1.5 w-28 rounded-full bg-[#eeece6] dark:bg-[#30312b]"><div className="h-full rounded-full bg-[#557761]" style={{ width: `${Math.min(entry.percentage, 100)}%` }} /></div><span className="text-[10px] text-muted">{entry.percentage}%</span>{entry.position === 1 ? <Check size={13} className="text-accent" /> : null}</div></td><td className="px-4 py-3 font-mono text-xs">{formatTokens(entry.model.contextWindow)}</td><td className="px-4 py-3 font-mono text-xs">{formatPrice(entry.model.inputPricePer1M)}</td><td className="px-4 py-3 font-mono text-xs">{formatPrice(entry.model.outputPricePer1M)}</td></tr>)}</tbody></table></div> : null}
      {loadMoreError ? <p role="alert" className="border-t border-line px-4 py-3 text-xs text-red-700 dark:border-[#34342f]">{loadMoreError}</p> : null}
      {!error && !loading && data && page < data.pagination.pages ? <div className="border-t border-line p-4 text-center dark:border-[#34342f]"><button disabled={loadingMore} onClick={() => void loadMore()} className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-50 dark:border-[#393a35]">{loadingMore ? "Loading…" : "Load more rankings"}</button></div> : null}
    </section>
  </div>;
}
