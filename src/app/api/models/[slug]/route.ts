import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;
  try {
    const model = await prisma.aIModel.findUnique({
      where: { slug },
      include: {
        lab: true,
        offers: { include: { provider: true }, orderBy: [{ inputPricePer1M: "asc" }, { latencyMs: "asc" }] },
        benchmarkScores: { include: { benchmark: true }, orderBy: { score: "desc" } }
      }
    });
    return model ? NextResponse.json(model) : NextResponse.json({ error: "Model not found." }, { status: 404 });
  } catch (error) {
    console.error("GET /api/models/[slug] failed:", error);
    return serverError();
  }
}
