import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const slugs = [...new Set((request.nextUrl.searchParams.get("slugs") ?? "").split(",").map((slug) => slug.trim()).filter(Boolean))];
  if (slugs.length < 2 || slugs.length > 4) return badRequest("Provide between 2 and 4 distinct model slugs.");
  try {
    const models = await prisma.aIModel.findMany({
      where: { slug: { in: slugs } },
      include: {
        lab: true,
        offers: { include: { provider: true }, orderBy: { inputPricePer1M: "asc" } },
        benchmarkScores: { include: { benchmark: true }, orderBy: { score: "desc" } }
      }
    });
    const order = new Map(slugs.map((slug, index) => [slug, index] as const));
    models.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
    if (models.length !== slugs.length) return NextResponse.json({ error: "One or more model slugs were not found.", found: models.map((model) => model.slug) }, { status: 404 });
    return NextResponse.json({ models });
  } catch (error) {
    console.error("GET /api/models/compare failed:", error);
    return serverError();
  }
}
