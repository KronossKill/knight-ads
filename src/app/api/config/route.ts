import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withCache, invalidateConfigCaches } from "@/lib/cache";

// GET /api/config — returns all settings, advertiser plans, visitor plans, treasury.
// Cached for 60 seconds (config changes are rare). CDN/browser cache 60s.
export async function GET() {
  const result = await withCache("config:all", 60, async () => {
    const [settings, advertiserPlans, visitorPlans, treasury] = await Promise.all([
      db.setting.findMany({ orderBy: { category: "asc" } }),
      db.advertiserPlan.findMany({ orderBy: { feedPriority: "asc" } }),
      db.visitorPlan.findMany({ orderBy: { feedPriority: "asc" } }),
      db.treasuryAccount.findMany({ orderBy: { code: "asc" } }),
    ]);
    return { settings, advertiserPlans, visitorPlans, treasury };
  });
  const res = NextResponse.json(result.data);
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  res.headers.set("X-Cache", result.cached ? "HIT" : "MISS");
  return res;
}

// PUT /api/config — bulk update settings (key -> value)
// Body: { settings: { [key]: string } }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updates: Record<string, string> = body?.settings ?? {};
  const actor: string = body?.actor ?? "Super Admin";

  const results: { key: string; before: string; after: string }[] = [];
  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing) continue;
    // Validate number ranges
    if (existing.type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) continue;
      if (existing.min != null && num < Number(existing.min)) continue;
      if (existing.max != null && num > Number(existing.max)) continue;
    }
    if (existing.type === "boolean" && value !== "true" && value !== "false") continue;

    if (existing.value !== String(value)) {
      const before = existing.value;
      await db.setting.update({ where: { key }, data: { value: String(value) } });
      results.push({ key, before, after: String(value) });
    }
  }

  // Write audit log + invalidate caches
  if (results.length > 0) {
    await db.auditLog.create({
      data: {
        actor,
        action: "UPDATE_CONFIG",
        entity: "Setting",
        detail: `Configuración global actualizada (${results.length} parámetro/s)`,
        before: JSON.stringify(results.map((r) => ({ [r.key]: r.before }))),
        after: JSON.stringify(results.map((r) => ({ [r.key]: r.after }))),
      },
    });
    invalidateConfigCaches(); // Clear server cache so next GET returns fresh data
  }

  const settings = await db.setting.findMany({ orderBy: { category: "asc" } });
  return NextResponse.json({ ok: true, updated: results.length, settings });
}
