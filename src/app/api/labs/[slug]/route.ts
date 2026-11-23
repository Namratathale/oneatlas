import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;
  try {
    const lab = await prisma.lab.findUnique({
      where: { slug },
      include: { models: { orderBy: { releaseDate: "desc" }, include: { offers: { where: { isAvailable: true }, include: { provider: true } }, benchmarkScores: { include: { benchmark: true } } } } }
    });
    if (lab) return NextResponse.json({
      kind: "lab",
      ...lab,
      models: lab.models.map((model) => ({ ...model, lab: { id: lab.id, slug: lab.slug, name: lab.name, logoBadge: lab.logoBadge } }))
    });
    const provider = await prisma.provider.findUnique({
      where: { slug },
      include: { offers: { where: { isAvailable: true }, orderBy: { inputPricePer1M: "asc" }, include: { model: { include: { lab: true } } } } }
    });
    return provider
      ? NextResponse.json({ kind: "provider", ...provider, models: provider.offers.map((offer) => ({ ...offer.model, offer: { inputPricePer1M: offer.inputPricePer1M, outputPricePer1M: offer.outputPricePer1M, latencyMs: offer.latencyMs, throughputTps: offer.throughputTps } })) })
      : NextResponse.json({ error: "Lab or provider not found." }, { status: 404 });
  } catch (error) {
    console.error("GET /api/labs/[slug] failed:", error);
    return serverError();
  }
}
