import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/plans/visitor
export async function GET() {
  const plans = await db.visitorPlan.findMany({ orderBy: { feedPriority: "asc" } });
  return NextResponse.json({ plans });
}

// POST — create
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, costKnight, durationDays, multiplier, dailyViewsLimit, feedPriority, badgeColor, description, isDefault, isActive, actor = "Super Admin" } = body;
  if (!code || !name) return NextResponse.json({ error: "code y name requeridos" }, { status: 400 });

  // If marking as default, unset others first
  if (isDefault) {
    await db.visitorPlan.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const plan = await db.visitorPlan.create({
    data: {
      code: String(code).toLowerCase().replace(/\s+/g, "_"),
      name,
      costKnight: Number(costKnight) || 0,
      durationDays: Number(durationDays) ?? 15,
      multiplier: Number(multiplier) || 1.0,
      dailyViewsLimit: Number(dailyViewsLimit) || 0,
      feedPriority: Number(feedPriority) || 100,
      badgeColor: badgeColor || "slate",
      description: description || "",
      isDefault: Boolean(isDefault),
      isActive: isActive !== false,
    },
  });

  await db.auditLog.create({
    data: {
      actor,
      action: "VISITOR_PLAN_CREATE",
      entity: "VisitorPlan",
      entityId: plan.id,
      detail: `Plan visitante creado: ${plan.name} (${plan.code})`,
      after: JSON.stringify(plan),
    },
  });

  return NextResponse.json({ plan });
}

// PUT — update by id
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, data, actor = "Super Admin" } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.visitorPlan.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "plan no encontrado" }, { status: 404 });

  if (data.isDefault) {
    await db.visitorPlan.updateMany({ where: { isDefault: true, NOT: { id } }, data: { isDefault: false } });
  }

  const update: Record<string, unknown> = {};
  for (const k of ["name", "costKnight", "durationDays", "multiplier", "dailyViewsLimit", "feedPriority", "badgeColor", "description", "isDefault", "isActive"]) {
    if (k in data) update[k] = data[k];
  }
  for (const k of ["costKnight", "durationDays", "multiplier", "dailyViewsLimit", "feedPriority"]) {
    if (k in update) update[k] = Number(update[k]);
  }
  if ("isDefault" in update) update.isDefault = Boolean(update.isDefault);
  if ("isActive" in update) update.isActive = Boolean(update.isActive);

  const plan = await db.visitorPlan.update({ where: { id }, data: update });

  await db.auditLog.create({
    data: {
      actor,
      action: "VISITOR_PLAN_UPDATE",
      entity: "VisitorPlan",
      entityId: plan.id,
      detail: `Plan visitante actualizado: ${plan.name} (${plan.code})`,
      before: JSON.stringify(before),
      after: JSON.stringify(plan),
    },
  });

  return NextResponse.json({ plan });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const actor = req.nextUrl.searchParams.get("actor") ?? "Super Admin";
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.visitorPlan.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "plan no encontrado" }, { status: 404 });

  await db.visitorPlan.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      actor,
      action: "VISITOR_PLAN_DELETE",
      entity: "VisitorPlan",
      entityId: id,
      detail: `Plan visitante eliminado: ${before.name} (${before.code})`,
      before: JSON.stringify(before),
    },
  });

  return NextResponse.json({ ok: true });
}
