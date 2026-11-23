import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const [labs, providers] = await Promise.all([
      prisma.lab.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { models: true } }, models: { orderBy: { releaseDate: "desc" }, take: 1, select: { slug: true, name: true, releaseDate: true, isOpenWeights: true } } }
      }),
      prisma.provider.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { offers: true } }, offers: { where: { isAvailable: true }, orderBy: { inputPricePer1M: "asc" }, take: 1, select: { inputPricePer1M: true, model: { select: { slug: true, name: true } } } } }
      })
    ]);
    const [lowestPrices, providerModels] = await Promise.all([
      prisma.modelProviderOffer.groupBy({ by: ["providerId"], where: { isAvailable: true }, _min: { inputPricePer1M: true } }),
      prisma.modelProviderOffer.groupBy({ by: ["providerId", "modelId"], where: { isAvailable: true } })
    ]);
    const priceByProvider = new Map(lowestPrices.map((item) => [item.providerId, item._min.inputPricePer1M] as const));
    const countByProvider = new Map<string, number>();
    providerModels.forEach(({ providerId }) => countByProvider.set(providerId, (countByProvider.get(providerId) ?? 0) + 1));
    return NextResponse.json({
      labs: labs.map((lab) => ({ ...lab, modelCount: lab._count.models, featuredModel: lab.models[0] ?? null, _count: undefined, models: undefined })),
      providers: providers.map((provider) => ({ ...provider, modelCount: countByProvider.get(provider.id) ?? 0, lowestPrice: priceByProvider.get(provider.id) ?? null, featuredModel: provider.offers[0]?.model ?? null, _count: undefined, offers: undefined }))
    });
  } catch (error) {
    console.error("GET /api/labs failed:", error);
    return serverError();
  }
}
