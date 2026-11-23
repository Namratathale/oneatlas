"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { formatPrice, formatTokens, type ModelSummary } from "@/lib/types";

export default function ModelDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [model, setModel] = useState<ModelSummary | null>(null);
  const [error, setError] = useState("");
  const [inputTokens, setInputTokens] = useState(1_000_000);
  const [outputTokens, setOutputTokens] = useState(200_000);
  const { compareSlugs, toggleCompare } = useApp();

  useEffect(() => {
    const controller = new AbortController();
    setModel(null);
    setError("");
    fetch(`/api/models/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This model could not be found." : "Unable to load model details.");
        return response.json() as Promise<ModelSummary>;
      })
      .then(setModel)
      .catch((cause: unknown) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, [slug]);

  const costRows = useMemo(() => model?.offers.map((offer) => ({
    ...offer,
    estimatedCost: (inputTokens * offer.inputPricePer1M + outputTokens * offer.outputPricePer1M) / 1_000_000
  })) ?? [], [inputTokens, model, outputTokens]);

  if (error) return <div role="alert" className="mx-auto max-w-3xl rounded-xl border border-line bg-white p-8 text-center dark:border-[#393a35] dark:bg-[#191a17]"><h1 className="text-xl font-semibold">{error}</h1><Link href="/models" className="mt-4 inline-flex items-center gap-2 text-sm text-accent"><ArrowLeft size={14} />Back to models</Link></div>;
  if (!model) return <div className="mx-auto max-w-5xl animate-pulse"><div className="h-48 rounded-2xl bg-[#eeece6] dark:bg-[#22231e]" /><div className="mt-4 h-40 rounded-2xl bg-[#eeece6] dark:bg-[#22231e]" /></div>;

  const isCompared = compareSlugs.includes(model.slug);
  return <div className="mx-auto max-w-5xl">
    <div className="mb-5 flex items-center gap-2 text-sm text-muted"><Link href="/models" className="hover:text-ink dark:hover:text-white">Models</Link><ChevronRight size={14} /><Link href={`/labs/${model.lab.slug}`} className="hover:text-ink dark:hover:text-white">{model.lab.name}</Link><ChevronRight size={14} /><span className="truncate text-ink dark:text-white">{model.name}</span></div>
    <section className="rounded-2xl border border-line bg-white p-5 dark:border-[#393a35] dark:bg-[#191a17] sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-line bg-[#fbfaf7] font-semibold dark:border-[#393a35] dark:bg-[#23241f]">{model.lab.logoBadge}</span><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{model.name}</h1><Link href={`/labs/${model.lab.slug}`} className="mt-1 inline-block text-sm text-muted hover:underline">{model.lab.name} <ArrowUpRight size={12} className="inline" /></Link><div className="mt-3 flex flex-wrap gap-2"><Badge>{model.modelType}</Badge><Badge>{model.isOpenWeights ? "Open weights" : "Proprietary"}</Badge><Badge>{model.parameters}</Badge></div></div></div>
        <button disabled={!isCompared && compareSlugs.length >= 4} title={compareSlugs.length >= 4 && !isCompared ? "Compare up to four models" : undefined} onClick={() => toggleCompare(model.slug)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-[#f3f1eb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#393a35] dark:hover:bg-[#242520]">{isCompared ? <Check size={14} /> : null}{isCompared ? "In comparison" : "Add to compare"}</button>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-6 text-muted dark:text-[#b2b0a7]">{model.description}</p>
      <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-[#ebe8e0] overflow-hidden rounded-xl border border-[#ebe8e0] sm:grid-cols-4 sm:divide-y-0 dark:divide-[#34342f] dark:border-[#34342f]">
        <Metric label="Context window" value={formatTokens(model.contextWindow)} sub={`${model.contextWindow.toLocaleString()} tokens`} />
        <Metric label="Max output" value={formatTokens(model.maxOutputTokens)} sub={`${model.maxOutputTokens.toLocaleString()} tokens`} />
        <Metric label="Input · / 1M" value={formatPrice(model.inputPricePer1M)} sub="USD per 1M tokens" />
        <Metric label="Output · / 1M" value={formatPrice(model.outputPricePer1M)} sub="USD per 1M tokens" />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">{model.modalities.map((modality) => <Badge key={modality}>{modality}</Badge>)}{model.capabilities.map((capability) => <Badge key={capability}>{capability}</Badge>)}</div>
      <div className="mt-4 text-xs text-muted">Released {new Date(model.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
    </section>

    <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border border-line bg-white p-5 dark:border-[#393a35] dark:bg-[#191a17]">
        <SectionTitle title="Token cost calculator" sub="Estimate monthly inference spend" />
        <TokenInput label="Monthly input tokens" value={inputTokens} onChange={setInputTokens} />
        <TokenInput label="Monthly output tokens" value={outputTokens} onChange={setOutputTokens} />
        <div className="mt-4 space-y-2">{costRows.map((offer) => <div key={offer.id} className="flex items-center justify-between rounded-lg bg-[#f7f6f1] px-3 py-2.5 dark:bg-[#22231e]"><span className="text-xs">{offer.provider.name}</span><span className="font-mono text-sm font-medium">${offer.estimatedCost.toFixed(2)}</span></div>)}</div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 dark:border-[#393a35]">
        <SectionTitle title="Provider routing" sub={`${model.offers.length} available offer${model.offers.length === 1 ? "" : "s"}`} />
        {model.offers.length === 0 ? <p className="py-8 text-center text-sm text-muted">No active provider offers are listed for this model.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-muted"><tr>{["Provider", "Input / 1M", "Output / 1M", "Latency", "Throughput"].map((item) => <th key={item} className="border-b border-line px-2 py-3 font-medium dark:border-[#34342f]">{item}</th>)}</tr></thead><tbody>{model.offers.map((offer) => <tr key={offer.id} className="border-b border-line last:border-0 dark:border-[#34342f]"><td className="px-2 py-3"><Link href={`/labs/${offer.provider.slug}`} className="font-medium hover:underline">{offer.provider.name}</Link></td><td className="px-2 py-3 font-mono">{formatPrice(offer.inputPricePer1M)}</td><td className="px-2 py-3 font-mono">{formatPrice(offer.outputPricePer1M)}</td><td className="px-2 py-3 font-mono">{offer.latencyMs} ms</td><td className="px-2 py-3 font-mono">{offer.throughputTps} tok/s</td></tr>)}</tbody></table></div>}
      </section>
    </div>

    <section className="mt-5 rounded-2xl border border-line bg-white p-5 dark:border-[#393a35] dark:bg-[#191a17]"><SectionTitle title="Benchmark performance" sub="Published scores relative to benchmark maximum" />
      {model.benchmarkScores.length === 0 ? <p className="py-6 text-sm text-muted">No published benchmark scores for this model yet.</p> : <div className="space-y-5">{model.benchmarkScores.map((entry) => <div key={entry.benchmark.slug}><div className="mb-2 flex items-center justify-between"><div><div className="text-sm font-medium">{entry.benchmark.name}</div><div className="text-xs text-muted">{entry.benchmark.category}</div></div><div className="font-mono text-sm">{entry.score}<span className="text-muted"> / {entry.benchmark.maxScore}</span></div></div><div className="h-2 overflow-hidden rounded-full bg-[#eeece6] dark:bg-[#30312b]"><div className="h-full rounded-full bg-[#557761]" style={{ width: `${Math.min(100, entry.score / entry.benchmark.maxScore * 100)}%` }} /></div></div>)}</div>}
    </section>
  </div>;
}

function Badge({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <span className="rounded-full border border-line bg-[#faf9f6] px-2.5 py-1 text-[11px] text-[#55534d] dark:border-[#393a35] dark:bg-[#22231e] dark:text-[#c2c0b7]">{children}</span>;
}
function Metric({ label, value, sub }: { label: string; value: string; sub: string }): React.JSX.Element {
  return <div className="p-4"><div className="text-xs text-muted">{label}</div><div className="mt-2 font-mono text-xl font-medium">{value}</div><div className="mt-1 text-[10px] text-muted">{sub}</div></div>;
}
function SectionTitle({ title, sub }: { title: string; sub: string }): React.JSX.Element {
  return <div className="mb-4 flex items-start justify-between gap-2"><div className="font-semibold">{title}</div><div className="text-right text-xs text-muted">{sub}</div></div>;
}
function TokenInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }): React.JSX.Element {
  return <label className="mt-4 block"><span className="flex justify-between text-xs"><span>{label}</span><span className="font-mono text-muted">{value.toLocaleString()}</span></span><input type="range" min="0" max="10000000" step="50000" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-[#557761]" /><input type="number" min="0" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} className="mt-1 h-9 w-full rounded-md border border-line bg-white px-2 font-mono text-xs dark:border-[#393a35] dark:bg-[#191a17]" /></label>;
}
