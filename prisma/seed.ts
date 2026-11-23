import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const labs = [
  { slug: "openai", name: "OpenAI", description: "Frontier AI research and products.", headquarters: "San Francisco, US", websiteUrl: "https://openai.com", logoBadge: "OAI", foundedYear: 2015 },
  { slug: "anthropic", name: "Anthropic", description: "AI safety company building reliable, interpretable systems.", headquarters: "San Francisco, US", websiteUrl: "https://anthropic.com", logoBadge: "A", foundedYear: 2021 },
  { slug: "google-deepmind", name: "Google DeepMind", description: "AI research lab advancing science and helpful AI.", headquarters: "London, UK", websiteUrl: "https://deepmind.google", logoBadge: "G", foundedYear: 2010 },
  { slug: "meta", name: "Meta", description: "Open research and AI models for people and products.", headquarters: "Menlo Park, US", websiteUrl: "https://ai.meta.com", logoBadge: "M", foundedYear: 2004 },
  { slug: "mistral", name: "Mistral AI", description: "Open and portable frontier models from Europe.", headquarters: "Paris, France", websiteUrl: "https://mistral.ai", logoBadge: "MI", foundedYear: 2023 },
  { slug: "deepseek", name: "DeepSeek", description: "Efficient open models for reasoning and coding.", headquarters: "Hangzhou, China", websiteUrl: "https://deepseek.com", logoBadge: "DS", foundedYear: 2023 },
  { slug: "xai", name: "xAI", description: "Building AI systems to understand the universe.", headquarters: "Palo Alto, US", websiteUrl: "https://x.ai", logoBadge: "x", foundedYear: 2023 },
  { slug: "cohere", name: "Cohere", description: "Enterprise AI models, retrieval, and search.", headquarters: "Toronto, Canada", websiteUrl: "https://cohere.com", logoBadge: "C", foundedYear: 2019 }
];

const providers = [
  { slug: "openrouter", name: "OpenRouter", description: "Unified access to models across providers.", websiteUrl: "https://openrouter.ai", avgLatencyMs: 180, uptimePercent: 99.95, supportedRegions: ["US", "EU", "APAC"] },
  { slug: "together", name: "Together AI", description: "Fast inference for leading open models.", websiteUrl: "https://together.ai", avgLatencyMs: 135, uptimePercent: 99.9, supportedRegions: ["US", "EU"] },
  { slug: "fireworks", name: "Fireworks AI", description: "Production inference and model deployment.", websiteUrl: "https://fireworks.ai", avgLatencyMs: 120, uptimePercent: 99.95, supportedRegions: ["US", "EU", "APAC"] },
  { slug: "groq", name: "Groq", description: "Low-latency inference at high throughput.", websiteUrl: "https://groq.com", avgLatencyMs: 75, uptimePercent: 99.9, supportedRegions: ["US", "EU"] },
  { slug: "aws-bedrock", name: "AWS Bedrock", description: "Managed foundation models on AWS.", websiteUrl: "https://aws.amazon.com/bedrock", avgLatencyMs: 210, uptimePercent: 99.99, supportedRegions: ["US", "EU", "APAC"] },
  { slug: "google-vertex", name: "Google Vertex AI", description: "Managed generative AI on Google Cloud.", websiteUrl: "https://cloud.google.com/vertex-ai", avgLatencyMs: 190, uptimePercent: 99.99, supportedRegions: ["US", "EU", "APAC"] }
];

const benchmarks = [
  { slug: "mmlu-pro", name: "MMLU-Pro", category: "General Knowledge", maxScore: 100, description: "Broad expert-level knowledge and reasoning." },
  { slug: "swe-bench", name: "SWE-bench Verified", category: "Coding", maxScore: 100, description: "Real-world software engineering task completion." },
  { slug: "gpqa-diamond", name: "GPQA Diamond", category: "Math & Reasoning", maxScore: 100, description: "Graduate-level science questions." },
  { slug: "math-500", name: "MATH-500", category: "Math & Reasoning", maxScore: 100, description: "Competition mathematics problem solving." },
  { slug: "mmmu", name: "MMMU", category: "Multimodal", maxScore: 100, description: "Multidisciplinary multimodal understanding." }
];

const familySpecs = [
  { family: "GPT", prefixes: ["4.1", "4o", "o3", "5"], type: "Chat / LLM", capabilities: ["Text", "Function Calling", "JSON Mode", "Code"], modalities: ["Text", "Image"], open: false, base: 0.18 },
  { family: "Claude", prefixes: ["Sonnet 4", "Opus 4", "Haiku 3.5", "Sonnet 3.7"], type: "Chat / LLM", capabilities: ["Text", "Vision", "Function Calling", "Reasoning", "Code"], modalities: ["Text", "Image"], open: false, base: 0.25 },
  { family: "Gemini", prefixes: ["2.5 Pro", "2.5 Flash", "2.0 Flash", "1.5 Pro"], type: "Multimodal", capabilities: ["Text", "Vision", "Audio", "Video", "Function Calling"], modalities: ["Text", "Image", "Audio", "Video"], open: false, base: 0.12 },
  { family: "Llama", prefixes: ["4 Maverick", "4 Scout", "3.3 70B", "3.1 8B"], type: "Chat / LLM", capabilities: ["Text", "Vision", "Function Calling", "Code"], modalities: ["Text", "Image"], open: true, base: 0.08 },
  { family: "Mistral", prefixes: ["Large", "Medium", "Small", "Codestral"], type: "Code", capabilities: ["Text", "Function Calling", "JSON Mode", "Code"], modalities: ["Text"], open: true, base: 0.1 },
  { family: "DeepSeek", prefixes: ["V3", "R1", "Coder V2", "V2.5"], type: "Reasoning", capabilities: ["Text", "Reasoning", "Code", "JSON Mode"], modalities: ["Text"], open: true, base: 0.06 },
  { family: "Grok", prefixes: ["3", "3 Mini", "2", "2 Mini"], type: "Chat / LLM", capabilities: ["Text", "Vision", "Function Calling", "Reasoning"], modalities: ["Text", "Image"], open: false, base: 0.2 },
  { family: "Command", prefixes: ["R+", "A", "R", "Light"], type: "Chat / LLM", capabilities: ["Text", "Function Calling", "JSON Mode"], modalities: ["Text"], open: false, base: 0.09 },
  { family: "Embed", prefixes: ["English v3", "Multilingual v3", "English Light v3", "Multilingual Light v3"], type: "Embedding", capabilities: ["Text"], modalities: ["Text"], open: false, base: 0.02 }
];

const slugsByFamily: Record<string, string> = {
  GPT: "openai", Claude: "anthropic", Gemini: "google-deepmind", Llama: "meta",
  Mistral: "mistral", DeepSeek: "deepseek", Grok: "xai", Command: "cohere", Embed: "cohere"
};
const baseContext = [32768, 65536, 128000, 200000, 1000000];

async function main(): Promise<void> {
  await prisma.modelBenchmarkScore.deleteMany();
  await prisma.modelProviderOffer.deleteMany();
  await prisma.aIModel.deleteMany();
  await prisma.benchmark.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.lab.deleteMany();

  const labRows = await Promise.all(labs.map((lab) => prisma.lab.create({ data: lab })));
  const providerRows = await Promise.all(providers.map((provider) => prisma.provider.create({ data: provider })));
  const benchmarkRows = await Promise.all(benchmarks.map((benchmark) => prisma.benchmark.create({ data: benchmark })));
  const labIds = new Map(labRows.map((lab) => [lab.slug, lab.id] as const));

  const modelData: Array<{
    slug: string; name: string; labId: string; description: string; modelType: string;
    releaseDate: Date; contextWindow: number; maxOutputTokens: number;
    inputPricePer1M: number; outputPricePer1M: number; parameters: string;
    isOpenWeights: boolean; capabilities: string[]; modalities: string[];
  }> = [];
  for (let familyIndex = 0; familyIndex < familySpecs.length; familyIndex += 1) {
    const spec = familySpecs[familyIndex];
    for (let variant = 0; variant < 20; variant += 1) {
      const version = spec.prefixes[variant % spec.prefixes.length];
      const suffix = variant >= spec.prefixes.length ? ` ${Math.floor(variant / spec.prefixes.length) + 1}` : "";
      const name = `${spec.family} ${version}${suffix}`;
      const slug = `${spec.family.toLowerCase()}-${version.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${suffix ? `-${suffix.trim()}` : ""}`;
      const contextWindow = baseContext[(variant + familyIndex) % baseContext.length];
      const inputPrice = Number((spec.base * (1 + (variant % 5) * 0.35)).toFixed(3));
      modelData.push({
        slug, name, labId: labIds.get(slugsByFamily[spec.family])!, description: `${name} is a ${spec.type.toLowerCase()} model from ${spec.family}, designed for practical production workloads.`,
        modelType: spec.type, releaseDate: new Date(Date.UTC(2023 + Math.floor(variant / 8), variant % 12, 1 + (variant * 3) % 27)),
        contextWindow, maxOutputTokens: Math.min(128000, Math.floor(contextWindow / 4)),
        inputPricePer1M: inputPrice, outputPricePer1M: Number((inputPrice * (2 + (variant % 3) * 0.5)).toFixed(3)),
        parameters: spec.open ? `${8 + ((variant * 7) % 65)}B` : "MoE / Undisclosed",
        isOpenWeights: spec.open, capabilities: [...new Set(spec.capabilities)], modalities: [...new Set(spec.modalities)]
      });
    }
  }

  const createdModels = await prisma.aIModel.createManyAndReturn({ data: modelData });
  const offerData: Array<{ modelId: string; providerId: string; inputPricePer1M: number; outputPricePer1M: number; latencyMs: number; throughputTps: number; isAvailable: boolean }> = [];
  const scoreData: Array<{ modelId: string; benchmarkId: string; score: number; rank: number }> = [];
  for (const [index, model] of createdModels.entries()) {
    const offerCount = 1 + (index % 3);
    for (let offset = 0; offset < offerCount; offset += 1) {
      const provider = providerRows[(index + offset * 2) % providerRows.length];
      const multiplier = 0.85 + ((index + offset) % 5) * 0.1;
      offerData.push({
        modelId: model.id, providerId: provider.id,
        inputPricePer1M: Number((model.inputPricePer1M * multiplier).toFixed(3)),
        outputPricePer1M: Number((model.outputPricePer1M * multiplier).toFixed(3)),
        latencyMs: provider.avgLatencyMs + ((index * 13 + offset * 17) % 90),
        throughputTps: 35 + ((index * 23 + offset * 31) % 450), isAvailable: true
      });
    }
    for (const [benchIndex, benchmark] of benchmarkRows.entries()) {
      if ((index + benchIndex) % 3 !== 0) {
        scoreData.push({
          modelId: model.id, benchmarkId: benchmark.id,
          score: Number((45 + ((index * 11 + benchIndex * 17) % 54)).toFixed(1)),
          rank: index + 1
        });
      }
    }
  }
  await prisma.modelProviderOffer.createMany({ data: offerData });
  await prisma.modelBenchmarkScore.createMany({ data: scoreData });
  console.log(`Seeded ${createdModels.length} models, ${labRows.length} labs, ${providerRows.length} providers.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
