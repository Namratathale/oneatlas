import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const [models, labs, providers, lowest, openWeights, offers] = await Promise.all([
      prisma.aIModel.count(),
      prisma.lab.count(),
      prisma.provider.count(),
      prisma.modelProviderOffer.aggregate({ where: { isAvailable: true }, _min: { inputPricePer1M: true } }),
      prisma.aIModel.count({ where: { isOpenWeights: true } }),
      prisma.modelProviderOffer.count({ where: { isAvailable: true } })
    ]);
    return NextResponse.json({ models, labs, providers, lowestPrice: lowest._min.inputPricePer1M ?? 0, openWeights, offers });
  } catch (error) {
    console.error("GET /api/stats failed:", error);
    return serverError();
  }
}
