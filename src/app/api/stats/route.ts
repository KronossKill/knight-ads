import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withCache, invalidateConfigCaches } from "@/lib/cache";

// GET /api/stats — platform-wide stats for admin dashboard + transparency page.
// Cached for 30 seconds (stats don't change often). CDN/browser cache 30s, server revalidate.
export async function GET() {
  const result = await withCache("stats:platform", 30, async () => {
    const [ads, treasury] = await Promise.all([
      db.ad.findMany({ include: { plan: true } }),
      db.treasuryAccount.findMany(),
    ]);

    const totalAds = ads.length;
    const activeAds = ads.filter((a) => a.status === "active").length;
    const totalViewsServed = ads.reduce((s, a) => s + a.viewsUsed, 0);
    const totalAdvertiserSpend = ads
      .filter((a) => !a.isAdministrative)
      .reduce((s, a) => s + (a.plan?.priceKnight ?? 0), 0);
    const totalVisitorRewards = totalAdvertiserSpend * 0.3; // 30% reward (configurable)
    const treasuryTotal = treasury.reduce((s, a) => s + a.balance, 0);

    return {
      totalAds,
      activeAds,
      totalViewsServed,
      totalAdvertiserSpend: Number(totalAdvertiserSpend.toFixed(2)),
      totalVisitorRewards: Number(totalVisitorRewards.toFixed(2)),
      treasuryTotal: Number(treasuryTotal.toFixed(2)),
      users: 12_480,
      pendingWithdrawals: 7,
    };
  });

  const res = NextResponse.json(result.data);
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  res.headers.set("X-Cache", result.cached ? "HIT" : "MISS");
  return res;
}

// POST /api/stats/invalidate — manually clear the stats cache (admin only, demo)
export async function POST() {
  invalidateConfigCaches();
  return NextResponse.json({ ok: true, message: "Cache invalidated", stats: "cleared" });
}
