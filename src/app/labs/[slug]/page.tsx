"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Boxes, MapPin, Timer } from "lucide-react";
import { formatPrice, formatTokens } from "@/lib/types";

interface ProfileModel {
  id: string;
  slug: string;
  name: string;
  modelType: string;
  contextWindow: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  lab: { slug: string; name: string };
  offers?: Array<{ id: string }>;
  offer?: { inputPricePer1M: number; outputPricePer1M: number; latencyMs: number; throughputTps: number };
}

interface ProfilePayload {
  kind: "lab" | "provider";
  slug: string;
  name: string;
  description: string;
  websiteUrl?: string;
  headquarters?: string;
  foundedYear?: number;
  logoBadge?: string;
  avgLatencyMs?: number;
  uptimePercent?: number;
  supportedRegions?: string[];
  models: ProfileModel[];
}

export default function OrganizationPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    setError("");
    fetch(`/api/labs/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This lab or provider could not be found." : "Unable to load this directory profile.");
        return response.json() as Promise<ProfilePayload>;
      })
      .then(setProfile)
      .catch((cause: unknown) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, [slug]);

  if (error) return <div className="rounded-xl border border-line bg-white p-8 text-center dark:border-[#393a35] dark:bg-[#191a17]"><h1 className="font-semibold">{error}</h1><Link href="/labs" className="mt-4 inline-flex items-center gap-2 text-sm text-accent"><ArrowLeft size={14} />Directory</Link></div>;
  if (!profile) return <div className="animate-pulse"><div className="h-52 rounded-2xl bg-[#eeece6] dark:bg-[#22231e]" /><div className="mt-5 h-80 rounded-2xl bg-[#eeece6] dark:bg-[#22231e]" /></div>;

  const isLab = profile.kind === "lab";
  return <div>
    <Link href="/labs" className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink dark:hover:text-white"><ArrowLeft size={14} />Labs & providers</Link>
    <section className="rounded-2xl border border-line bg-white p-6 dark:border-[#393a35] dark:bg-[#191a17] sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="flex gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-line bg-[#fbfaf7] font-semibold dark:border-[#393a35] dark:bg-[#23241f]">{profile.logoBadge ?? profile.name.slice(0, 2).toUpperCase()}</span><div><div className="text-xs uppercase tracking-[.15em] text-muted">{isLab ? "Research lab" : "Inference provider"}</div><h1 className="mt-1 text-3xl font-semibold tracking-tight">{profile.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{profile.description}</p></div></div>{profile.websiteUrl ? <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex h-fit items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm dark:border-[#393a35]">Website <ArrowUpRight size={14} /></a> : null}</div>
      <div className="mt-6 flex flex-wrap gap-4 border-t border-line pt-4 text-xs text-muted dark:border-[#34342f]">
        <span className="inline-flex items-center gap-1"><Boxes size={14} />{profile.models.length} models</span>
        {profile.headquarters ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{profile.headquarters}</span> : null}
        {profile.foundedYear ? <span>Founded {profile.foundedYear}</span> : null}
        {profile.avgLatencyMs ? <span className="inline-flex items-center gap-1"><Timer size={14} />{profile.avgLatencyMs} ms avg latency</span> : null}
        {profile.uptimePercent ? <span>{profile.uptimePercent}% uptime</span> : null}
        {profile.supportedRegions?.map((region) => <span key={region} className="rounded-full bg-[#f3f1eb] px-2 py-1 dark:bg-[#292a25]">{region}</span>)}
      </div>
    </section>
    <div className="mb-3 mt-8 flex items-end justify-between"><div><h2 className="text-xl font-semibold">Model catalog</h2><p className="mt-1 text-xs text-muted">{isLab ? "Models developed by this organization." : "Models currently available through this provider."}</p></div><span className="font-mono text-xs text-muted">{profile.models.length} results</span></div>
    {profile.models.length === 0 ? <div className="rounded-xl border border-dashed border-line py-14 text-center text-sm text-muted">No models are currently listed.</div> : <div className="overflow-x-auto rounded-xl border border-line bg-white dark:border-[#393a35] dark:bg-[#191a17]"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f4f2ec] text-[10px] uppercase tracking-wider text-muted dark:bg-[#22231e]"><tr>{["Model", "Type", "Context", "Input / 1M", "Output / 1M", "Providers"].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead><tbody>{profile.models.map((model) => <tr key={model.id} className="border-t border-line dark:border-[#34342f]"><td className="px-4 py-3"><Link href={`/models/${model.slug}`} className="font-medium hover:underline">{model.name}</Link><div className="mt-1 text-xs text-muted">{model.lab.name}</div></td><td className="px-4 py-3 text-xs text-muted">{model.modelType}</td><td className="px-4 py-3 font-mono text-xs">{formatTokens(model.contextWindow)}</td><td className="px-4 py-3 font-mono text-xs">{formatPrice(model.offer?.inputPricePer1M ?? model.inputPricePer1M)}</td><td className="px-4 py-3 font-mono text-xs">{formatPrice(model.offer?.outputPricePer1M ?? model.outputPricePer1M)}</td><td className="px-4 py-3 text-xs text-muted">{model.offers?.length ?? 1}</td></tr>)}</tbody></table></div>}
  </div>;
}
