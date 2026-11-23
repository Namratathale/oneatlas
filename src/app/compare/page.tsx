"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { formatPrice, formatTokens, type ModelSummary } from "@/lib/types";

interface ModelListResponse { models: ModelSummary[]; }
interface CompareResponse { models: ModelSummary[]; }

export default function ComparePage(): React.JSX.Element {
  const { compareSlugs, setCompareSlugs } = useApp();
  const [available, setAvailable] = useState<ModelSummary[]>([]);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("models")?.split(",").filter(Boolean);
    if (requested) setCompareSlugs(requested);
    setReady(true);
    Promise.all([1, 2].map(async (page) => {
      const response = await fetch(`/api/models?limit=100&page=${page}&sort=name_asc`);
      if (!response.ok) throw new Error("Unable to load model options.");
      return response.json() as Promise<ModelListResponse>;
    }))
      .then((results) => setAvailable(results.flatMap((result) => result.models)))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load model options."));
  }, [setCompareSlugs]);

  useEffect(() => {
    if (!ready) return;
    const selected = compareSlugs.slice(0, 4);
    const url = selected.length ? `/compare?models=${encodeURIComponent(selected.join(","))}` : "/compare";
    window.history.replaceState(null, "", url);
    if (selected.length < 2) {
      setModels([]);
      return;
    }
    const controller = new AbortController();
    setModels([]);
    setError("");
    fetch(`/api/models/compare?slugs=${encodeURIComponent(selected.join(","))}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load comparison data.");
        return response.json() as Promise<CompareResponse>;
      })
      .then((result) => { setModels(result.models); setError(""); })
      .catch((cause: unknown) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, [compareSlugs, ready]);

  const selectedSet = useMemo(() => new Set(compareSlugs), [compareSlugs]);
  const addModel = (slug: string): void => {
    if (!selectedSet.has(slug) && compareSlugs.length < 4) setCompareSlugs([...compareSlugs, slug]);
    setAdding("");
  };
  const remove = (slug: string): void => setCompareSlugs(compareSlugs.filter((item) => item !== slug));
  const numericWinner = (key: "inputPricePer1M" | "outputPricePer1M" | "contextWindow" | "maxOutputTokens", values: ModelSummary[]): number | undefined => {
    if (!values.length) return undefined;
    return values.reduce((best, item) => key.includes("Price") ? Math.min(best, item[key]) : Math.max(best, item[key]), values[0][key]);
  };
  const comparisonRows: Array<{ group: string } | { label: string; value: (model: ModelSummary) => string; key?: "inputPricePer1M" | "outputPricePer1M" | "contextWindow" | "maxOutputTokens" }> = [
    { group: "Overview" },
    { label: "Model type", value: (model) => model.modelType },
    { label: "AI lab", value: (model) => model.lab.name },
    { label: "Release date", value: (model) => new Date(model.releaseDate).toLocaleDateString() },
    { label: "Weights", value: (model) => model.isOpenWeights ? "Open weights" : "Proprietary" },
    { group: "Pricing & economics" },
    { label: "Input / 1M tokens", value: (model) => formatPrice(model.inputPricePer1M), key: "inputPricePer1M" },
    { label: "Output / 1M tokens", value: (model) => formatPrice(model.outputPricePer1M), key: "outputPricePer1M" },
    { group: "Context & limits" },
    { label: "Context window", value: (model) => formatTokens(model.contextWindow), key: "contextWindow" },
    { label: "Max output", value: (model) => formatTokens(model.maxOutputTokens), key: "maxOutputTokens" },
    { group: "Capabilities & modalities" },
    { label: "Capabilities", value: (model) => model.capabilities.join(", ") },
    { label: "Modalities", value: (model) => model.modalities.join(", ") },
    { group: "Benchmark scores" }
  ];

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs uppercase tracking-[.15em] text-muted">Decision workspace</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Compare models</h1><p className="mt-2 text-sm text-muted">Evaluate pricing, limits, and benchmark performance side by side.</p></div><div className="flex items-center gap-2">
      {compareSlugs.length < 4 ? <div className="relative"><button onClick={() => setAdding(adding ? "" : "open")} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm dark:border-[#393a35] dark:bg-[#191a17]"><Plus size={14} />Add model</button>
        {adding ? <select autoFocus size={Math.min(8, available.filter((model) => !selectedSet.has(model.slug)).length + 1)} value="" onChange={(event) => addModel(event.target.value)} onBlur={() => setAdding("")} className="absolute right-0 top-11 z-10 w-64 rounded-lg border border-line bg-white p-2 text-sm shadow-lg dark:border-[#393a35] dark:bg-[#191a17]"><option value="" disabled>Select a model…</option>{available.filter((model) => !selectedSet.has(model.slug)).map((model) => <option key={model.slug} value={model.slug}>{model.name} · {model.lab.name}</option>)}</select> : null}
      </div> : null}
    </div></div>
    {error && compareSlugs.length < 2 ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
    {error && compareSlugs.length >= 2 ? <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button onClick={() => setCompareSlugs([])} className="underline">Clear selection</button></div> : null}
    {compareSlugs.length < 2 ? <div className="mt-8 rounded-xl border border-dashed border-line bg-white py-16 text-center dark:border-[#393a35] dark:bg-[#191a17]"><h2 className="text-lg font-medium">Choose at least two models</h2><p className="mt-2 text-sm text-muted">Select from your saved comparison list or add models above.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{available.filter((model) => !selectedSet.has(model.slug)).slice(0, 6).map((model) => <button key={model.slug} onClick={() => addModel(model.slug)} className="rounded-lg border border-line px-3 py-2 text-xs hover:bg-[#f3f1eb] dark:border-[#393a35] dark:hover:bg-[#242520]"><Plus size={12} className="mr-1 inline" />{model.name}</button>)}</div></div> : error ? null : models.length === 0 ? <div className="mt-6 h-48 animate-pulse rounded-xl bg-[#eeece6] dark:bg-[#22231e]" /> : <div className="mt-7 overflow-x-auto rounded-xl border border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]">
      <table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr><th className="w-48 border-b border-line bg-[#f4f2ec] p-4 text-left text-xs font-medium text-muted dark:border-[#34342f] dark:bg-[#22231e]">Specification</th>{models.map((model) => <th key={model.slug} className="border-b border-l border-line p-4 text-left align-top dark:border-[#34342f]"><div className="flex items-start justify-between gap-2"><div><Link href={`/models/${model.slug}`} className="font-semibold hover:underline">{model.name}</Link><Link href={`/labs/${model.lab.slug}`} className="mt-1 block text-xs text-muted hover:underline">{model.lab.name}</Link></div><button onClick={() => remove(model.slug)} aria-label={`Remove ${model.name}`}><X size={15} className="text-muted" /></button></div></th>)}</tr></thead>
      <tbody>{comparisonRows.map((row, index) => "group" in row ? <tr key={`group-${index}`}><td colSpan={models.length + 1} className="border-t border-line bg-[#f7f6f1] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted dark:border-[#34342f] dark:bg-[#22231e]">{row.group}</td></tr> : <tr key={row.label}><td className="border-t border-line px-4 py-3 text-xs text-muted dark:border-[#34342f]">{row.label}</td>{models.map((model) => {
          const winner = row.key ? numericWinner(row.key, models) : undefined;
          const isWinner = row.key !== undefined && model[row.key] === winner;
          return <td key={model.slug} className="border-l border-t border-line px-4 py-3 dark:border-[#34342f]"><span className={isWinner ? "inline-flex items-center gap-1 rounded-full bg-[#e7efe8] px-2 py-1 text-xs text-accent dark:bg-[#26372e]" : "text-xs"}>{isWinner ? <Check size={12} /> : null}{row.value(model)}</span></td>;
        })}</tr>)}
      {Array.from(new Set(models.flatMap((model) => model.benchmarkScores.map((score) => score.benchmark.slug)))).map((benchmarkSlug) => {
        const benchmarkName = models.flatMap((model) => model.benchmarkScores).find((score) => score.benchmark.slug === benchmarkSlug)?.benchmark.name ?? benchmarkSlug;
        const scores = models.map((model) => model.benchmarkScores.find((score) => score.benchmark.slug === benchmarkSlug));
        const winner = Math.max(...scores.map((score) => score?.score ?? -1));
        return <tr key={benchmarkSlug}><td className="border-t border-line px-4 py-3 text-xs text-muted dark:border-[#34342f]">{benchmarkName}</td>{models.map((model, index) => <td key={model.slug} className="border-l border-t border-line px-4 py-3 font-mono text-xs dark:border-[#34342f]">{scores[index] ? <span className={scores[index]?.score === winner ? "inline-flex items-center gap-1 rounded-full bg-[#e7efe8] px-2 py-1 text-accent dark:bg-[#26372e]" : ""}>{scores[index]?.score === winner ? <Check size={12} /> : null}{scores[index]?.score}</span> : "—"}</td>)}</tr>;
      })}
      </tbody></table>
    </div>}
  </div>;
}
