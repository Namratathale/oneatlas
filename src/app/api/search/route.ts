import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return badRequest("Search query must contain at least 2 characters.");
  try {
    const [models, labs, providers] = await Promise.all([
      prisma.aIModel.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }, take: 6, orderBy: { releaseDate: "desc" }, select: { slug: true, name: true, modelType: true, lab: { select: { name: true, slug: true } } } }),
      prisma.lab.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }, take: 4, select: { slug: true, name: true, description: true } }),
      prisma.provider.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }, take: 4, select: { slug: true, name: true, description: true } })
    ]);
    return NextResponse.json({ models, labs, providers });
  } catch (error) {
    console.error("GET /api/search failed:", error);
    return serverError();
  }
}
