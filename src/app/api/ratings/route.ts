import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/ratings  body={ adId, userLabel, stars (1-5), comment? }
//   → upsert rating (one per user per ad) → { rating, avgStars, count }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adId, userLabel, stars, comment } = body;
  if (!adId || !userLabel) {
    return NextResponse.json({ error: "adId y userLabel requeridos" }, { status: 400 });
  }
  const s = Math.max(1, Math.min(5, Math.round(Number(stars))));
  if (!Number.isFinite(s)) {
    return NextResponse.json({ error: "stars debe ser 1..5" }, { status: 400 });
  }
  const rating = await db.adRating.upsert({
    where: { adId_userLabel: { adId, userLabel } },
    create: { adId, userLabel, stars: s, comment: comment || null },
    update: { stars: s, comment: comment || null },
  });
  const agg = await db.adRating.aggregate({
    where: { adId },
    _avg: { stars: true },
    _count: { _all: true },
  });
  return NextResponse.json({
    rating,
    avgStars: Number(agg._avg.stars ?? 0).toFixed(2),
    count: agg._count._all,
  });
}

// GET /api/ratings?adId=xxx  → { avgStars, count, ratings: [...] }
// GET /api/ratings  → all ratings with adId included (for admin)
export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get("adId");
  if (adId) {
    const ratings = await db.adRating.findMany({ where: { adId }, orderBy: { createdAt: "desc" } });
    const agg = await db.adRating.aggregate({
      where: { adId },
      _avg: { stars: true },
      _count: { _all: true },
    });
    return NextResponse.json({
      adId,
      avgStars: Number(agg._avg.stars ?? 0).toFixed(2),
      count: agg._count._all,
      ratings,
    });
  }
  const all = await db.adRating.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ ratings: all });
}
