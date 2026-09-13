import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withCache } from "@/lib/cache";

// GET /api/ads/top-rated?limit=6
// Returns top-rated ads with an ACTIVE plan, ordered by average stars desc.
// Cached for 60 seconds (ratings change infrequently).
export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 6);
  const cacheKey = `ads:top-rated:${limit}`;

  const result = await withCache(cacheKey, 60, async () => {
    // Fetch ads with status=active, include their plan and ratings
    const ads = await db.ad.findMany({
      where: { status: "active" },
      include: { plan: true, ratings: true },
    });

    // Compute avg stars + count for each, filter those with at least 1 rating
    const withRatings = ads
      .filter((a) => a.ratings.length > 0)
      .map((a) => {
        const stars = a.ratings.map((r) => r.stars);
        const avg = stars.reduce((s, x) => s + x, 0) / stars.length;
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          link: a.link,
          advertiser: a.advertiser,
          imageUrl: a.imageUrl,
          mediaType: a.mediaType,
          isAdministrative: a.isAdministrative,
          viewsUsed: a.viewsUsed,
          plan: a.plan,
          avgStars: Number(avg.toFixed(2)),
          ratingCount: stars.length,
          createdAt: a.createdAt,
        };
      })
      .sort((a, b) => b.avgStars - a.avgStars || b.ratingCount - a.ratingCount)
      .slice(0, limit);

    return { ads: withRatings };
  });

  const res = NextResponse.json(result.data);
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  res.headers.set("X-Cache", result.cached ? "HIT" : "MISS");
  return res;
}

