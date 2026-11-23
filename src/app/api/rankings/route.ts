import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const category = params.get("category") ?? "All";
  const benchmarkSlug = params.get("benchmark") ?? "mmlu-pro";
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "50");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return badRequest("Invalid pagination values.");
  try {
    const benchmark = await prisma.benchmark.findUnique({ where: { slug: benchmarkSlug } });
    if (!benchmark) return NextResponse.json({ error: "Benchmark not found." }, { status: 404 });
    const categoryWhere: { model?: { isOpenWeights: boolean }; benchmark?: { category: { in: string[] } } } =
      category === "Open Weights" ? { model: { isOpenWeights: true } } :
      category === "Reasoning" ? { benchmark: { category: { in: ["Math & Reasoning", "General Knowledge"] } } } :
      category === "Coding" ? { benchmark: { category: { in: ["Coding"] } } } : {};
    if (!["All", "Reasoning", "Coding", "Open Weights"].includes(category)) return badRequest("category must be All, Reasoning, Coding, or Open Weights.");
    const where = {
      benchmarkId: benchmark.id,
      ...categoryWhere
    };
    const [total, scores] = await Promise.all([
      prisma.modelBenchmarkScore.count({ where }),
      prisma.modelBenchmarkScore.findMany({
        where, orderBy: [{ score: "desc" }, { rank: "asc" }], skip: (page - 1) * limit, take: limit,
        include: { model: { include: { lab: true } }, benchmark: true }
      })
    ]);
    return NextResponse.json({
      benchmark,
      entries: scores.map((entry, index) => ({
        ...entry, position: (page - 1) * limit + index + 1,
        percentage: benchmark.maxScore ? Number((entry.score / benchmark.maxScore * 100).toFixed(1)) : 0
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("GET /api/rankings failed:", error);
    return serverError();
  }
}
