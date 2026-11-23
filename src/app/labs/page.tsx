"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Boxes, Building2, Globe2 } from "lucide-react";

interface DirectoryResponse {
  labs: Array<{ id: string; slug: string; name: string; description: string; logoBadge: string; modelCount: number; featuredModel: { name: string; releaseDate: string; slug: string } | null }>;
  providers: Array<{ id: string; slug: string; name: string; description: string; websiteUrl: string; avgLatencyMs: number; modelCount: number; lowestPrice: number | null; featuredModel: { name: string; slug: string } | null }>;
}

export default function LabsPage(): React.JSX.Element {
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [tab, setTab] = useState<"labs" | "providers">("labs");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/labs").then(async (response) => {
      if (!response.ok) throw new Error("Unable to load organization directory.");
      return response.json() as Promise<DirectoryResponse>;
    }).then(setDirectory).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load directory."));
  }, []);

  const entries = tab === "labs" ? directory?.labs ?? [] : directory?.providers ?? [];
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs uppercase tracking-[.15em] text-muted">Ecosystem directory</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">{tab === "labs" ? "AI research labs" : "Inference providers"}</h1><p className="mt-2 max-w-2xl text-sm text-muted">{tab === "labs" ? "The companies and research groups behind the models in our catalog." : "The APIs, clouds, and gateways that serve models—with pricing and coverage at a glance."}</p></div><div className="flex rounded-lg border border-line bg-white p-1 dark:border-[#393a35] dark:bg-[#191a17]"><button onClick={() => setTab("labs")} className={`rounded-md px-3 py-2 text-xs ${tab === "labs" ? "bg-[#f0eee7] font-medium dark:bg-[#292a25]" : "text-muted"}`}>AI labs</button><button onClick={() => setTab("providers")} className={`rounded-md px-3 py-2 text-xs ${tab === "providers" ? "bg-[#f0eee7] font-medium dark:bg-[#292a25]" : "text-muted"}`}>Providers</button></div></div>
    <div className="mt-4 flex gap-2 text-xs text-muted"><span className="font-mono text-ink dark:text-white">{entries.length}</span>{tab === "labs" ? "labs" : "providers"}{tab === "labs" ? <span>· {directory?.labs.reduce((sum, lab) => sum + lab.modelCount, 0) ?? "—"} catalog models</span> : null}</div>
    {error ? <p role="alert" className="mt-6 text-sm text-red-700">{error}</p> : null}
    {!directory && !error ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-[#eeece6] dark:bg-[#22231e]" />)}</div> : null}
    {entries.length === 0 && directory && !error ? <div className="mt-6 rounded-xl border border-dashed border-line py-14 text-center text-sm text-muted">No directory entries yet. Run the database seed to load the catalog.</div> : null}
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => {
      const isLab = tab === "labs";
      const latest = isLab ? (entry as DirectoryResponse["labs"][number]).featuredModel : (entry as DirectoryResponse["providers"][number]).featuredModel;
      const lab = isLab ? entry as DirectoryResponse["labs"][number] : null;
      const provider = isLab ? null : entry as DirectoryResponse["providers"][number];
      return <article key={entry.id} className="rounded-xl border border-line bg-white p-5 transition hover:border-[#cfc9bc] hover:shadow-sm dark:border-[#393a35] dark:bg-[#191a17]">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-[#fbfaf7] dark:border-[#393a35] dark:bg-[#23241f]">{isLab ? <span className="text-xs font-semibold">{lab?.logoBadge}</span> : <Globe2 size={18} className="text-muted" />}</span><div className="min-w-0 flex-1"><h2 className="font-semibold">{entry.name}</h2><p className="mt-1 text-xs text-muted">{entry.modelCount} {isLab ? "models" : "model listings"}{provider ? ` · ${provider.avgLatencyMs} ms avg` : ""}</p></div></div>
        <p className="mt-4 min-h-10 text-xs leading-5 text-muted">{entry.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs dark:border-[#34342f]"><span className="flex items-center gap-1 text-muted">{isLab ? <Building2 size={13} /> : <Boxes size={13} />}{provider ? `From $${(provider.lowestPrice ?? 0).toFixed(2)} / 1M` : latest?.name ?? "Model catalog"}</span><Link href={`/labs/${entry.slug}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">View models <ArrowUpRight size={13} /></Link></div>
      </article>;
    })}</div>
  </div>;
}
