import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/plans/advertiser
export async function GET() {
  const plans = await db.advertiserPlan.findMany({ orderBy: { feedPriority: "asc" } });
  return NextResponse.json({ plans });
}

// POST /api/plans/advertiser — create new plan
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, viewsIncluded, priceKnight, viewSeconds, feedPriority, badgeColor, description, isPermanent, isActive, actor = "Super Admin" } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "code y name son requeridos" }, { status: 400 });
  }

  const plan = await db.advertiserPlan.create({
    data: {
      code: String(code).toLowerCase().replace(/\s+/g, "_"),
      name,
      viewsIncluded: Number(viewsIncluded) || 1000,
      priceKnight: Number(priceKnight) || 0,
      viewSeconds: Number(viewSeconds) || 10,
      feedPriority: Number(feedPriority) || 100,
      badgeColor: badgeColor || "amber",
      description: description || "",
      isPermanent: Boolean(isPermanent),
      isActive: isActive !== false,
    },
  });

  await db.auditLog.create({
    data: {
      actor,
      action: "PLAN_CREATE",
      entity: "AdvertiserPlan",
      entityId: plan.id,
      detail: `Plan anunciante creado: ${plan.name} (${plan.code})`,
      after: JSON.stringify(plan),
    },
  });

  return NextResponse.json({ plan });
}

// PUT /api/plans/advertiser — bulk update by id
// Body: { id, data: {...}, actor? }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, data, actor = "Super Admin" } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.advertiserPlan.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "plan no encontrado" }, { status: 404 });

  const update: Record<string, unknown> = {};
  for (const k of ["name", "viewsIncluded", "priceKnight", "viewSeconds", "feedPriority", "badgeColor", "description", "isPermanent", "isActive"]) {
    if (k in data) update[k] = data[k];
  }
  // Coerce numbers
  for (const k of ["viewsIncluded", "priceKnight", "viewSeconds", "feedPriority"]) {
    if (k in update) update[k] = Number(update[k]);
  }
  if ("isPermanent" in update) update.isPermanent = Boolean(update.isPermanent);
  if ("isActive" in update) update.isActive = Boolean(update.isActive);

  const plan = await db.advertiserPlan.update({ where: { id }, data: update });

  await db.auditLog.create({
    data: {
      actor,
      action: "PLAN_UPDATE",
      entity: "AdvertiserPlan",
      entityId: plan.id,
      detail: `Plan anunciante actualizado: ${plan.name} (${plan.code})`,
      before: JSON.stringify(before),
      after: JSON.stringify(plan),
    },
  });

  return NextResponse.json({ plan });
}

// DELETE /api/plans/advertiser?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const actor = req.nextUrl.searchParams.get("actor") ?? "Super Admin";
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.advertiserPlan.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "plan no encontrado" }, { status: 404 });

  await db.advertiserPlan.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      actor,
      action: "PLAN_DELETE",
      entity: "AdvertiserPlan",
      entityId: id,
      detail: `Plan anunciante eliminado: ${before.name} (${before.code})`,
      before: JSON.stringify(before),
    },
  });

  return NextResponse.json({ ok: true });
}
