import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withCache } from "@/lib/cache";

// GET /api/ads?status=active&limit=50 — returns ordered feed (by plan priority, then freshness).
// Cached for 15 seconds (feed changes more often than config). The real-time polling
// in the client updates every 15-20s, so 15s cache TTL keeps it fresh without hammering the DB.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "active";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const cacheKey = `ads:${status}:${limit}`;

  const result = await withCache(cacheKey, 15, async () => {
    const ads = await db.ad.findMany({
      where: status === "all" ? undefined : { status },
      include: { plan: true },
      orderBy: [{ plan: { feedPriority: "desc" } }, { createdAt: "desc" }],
      take: limit,
    });
    return { ads };
  });

  const res = NextResponse.json(result.data);
  res.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
  res.headers.set("X-Cache", result.cached ? "HIT" : "MISS");
  return res;
}
