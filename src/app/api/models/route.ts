import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { badRequest, parseCsv, parsePositiveNumber, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const sortFields = ["newest", "price_asc", "price_desc", "output_asc", "context_desc", "name_asc"] as const;
type SortField = (typeof sortFields)[number];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const lab = parseCsv(params.get("lab"));
  const provider = parseCsv(params.get("provider"));
  const capability = parseCsv(params.get("capability"));
  const type = params.get("type")?.trim();
  const openWeights = params.get("openWeights");
  const maxPrice = parsePositiveNumber(params.get("maxPrice"));
  const minContext = parsePositiveNumber(params.get("minContext"));
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "24");
  const sortValue = params.get("sort") ?? "newest";
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return badRequest("page must be positive and limit must be between 1 and 100.");
  }
  if (!sortFields.includes(sortValue as SortField)) return badRequest(`sort must be one of: ${sortFields.join(", ")}.`);
  if (openWeights !== null && openWeights !== "true" && openWeights !== "false") return badRequest("openWeights must be true or false.");
  if (params.has("maxPrice") && maxPrice === undefined) return badRequest("maxPrice must be a non-negative number.");
  if (params.has("minContext") && minContext === undefined) return badRequest("minContext must be a non-negative number.");

  const predicates: Prisma.AIModelWhereInput[] = [];
  if (q) predicates.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { lab: { name: { contains: q, mode: "insensitive" } } }] });
  if (lab.length) predicates.push({ lab: { slug: { in: lab } } });
  if (provider.length) predicates.push({ offers: { some: { provider: { slug: { in: provider } }, isAvailable: true } } });
  if (capability.length) predicates.push({ capabilities: { hasSome: capability } });
  if (type) predicates.push({ modelType: type });
  if (openWeights !== null) predicates.push({ isOpenWeights: openWeights === "true" });
  if (maxPrice !== undefined) predicates.push({ inputPricePer1M: { lte: maxPrice } });
  if (minContext !== undefined) predicates.push({ contextWindow: { gte: minContext } });
  const where: Prisma.AIModelWhereInput = predicates.length ? { AND: predicates } : {};
  const orderBy: Prisma.AIModelOrderByWithRelationInput =
    sortValue === "price_asc" ? { inputPricePer1M: "asc" } :
    sortValue === "price_desc" ? { outputPricePer1M: "desc" } :
    sortValue === "output_asc" ? { outputPricePer1M: "asc" } :
    sortValue === "context_desc" ? { contextWindow: "desc" } :
    sortValue === "name_asc" ? { name: "asc" } : { releaseDate: "desc" };
  try {
    const [total, models] = await Promise.all([
      prisma.aIModel.count({ where }),
      prisma.aIModel.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          lab: true,
          offers: { where: { isAvailable: true }, include: { provider: true }, orderBy: { inputPricePer1M: "asc" } },
          benchmarkScores: { include: { benchmark: true }, orderBy: { score: "desc" }, take: 3 }
        }
      })
    ]);
    return NextResponse.json({ models, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/models failed:", error);
    return serverError();
  }
}
