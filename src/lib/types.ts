export interface LabSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoBadge: string;
}

export interface ProviderSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  avgLatencyMs: number;
}

export interface ModelSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  modelType: string;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  parameters: string;
  isOpenWeights: boolean;
  capabilities: string[];
  modalities: string[];
  lab: LabSummary;
  offers: Array<{
    id: string;
    inputPricePer1M: number;
    outputPricePer1M: number;
    latencyMs: number;
    throughputTps: number;
    provider: ProviderSummary;
  }>;
  benchmarkScores: Array<{ score: number; rank: number; benchmark: { slug: string; name: string; maxScore: number; category: string } }>;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(2))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(0))}K`;
  return String(value);
}

export function formatPrice(value: number): string {
  return value === 0 ? "Free" : `$${value.toFixed(value < 0.1 ? 3 : 2)}`;
}
