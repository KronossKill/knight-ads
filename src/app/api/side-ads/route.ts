import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/side-ads?position=left|right  (returns only active, ordered)
// GET /api/side-ads?all=1  (admin: returns ALL including inactive)
export async function GET(req: NextRequest) {
  const position = req.nextUrl.searchParams.get("position"); // "left" | "right"
  const all = req.nextUrl.searchParams.get("all") === "1";

  const where: Record<string, unknown> = {};
  if (!all) where.isActive = true;
  if (position === "left" || position === "right") where.position = position;

  const ads = await db.sideAd.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ads });
}

// POST — create new side ad
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { position, title, content, link, imageUrl, bgColor, order, isActive, actor = "Content Moderator" } = body;
  if (!position || !title) {
    return NextResponse.json({ error: "position y title son requeridos" }, { status: 400 });
  }
  if (position !== "left" && position !== "right") {
    return NextResponse.json({ error: "position debe ser 'left' o 'right'" }, { status: 400 });
  }
  const ad = await db.sideAd.create({
    data: {
      position,
      title,
      content: content || "",
      link: link || "#",
      imageUrl: imageUrl || null,
      bgColor: bgColor || "slate",
      order: Number(order) || 0,
      isActive: isActive !== false,
    },
  });
  await db.auditLog.create({
    data: {
      actor,
      action: "SIDE_AD_CREATE",
      entity: "SideAd",
      entityId: ad.id,
      detail: `Anuncio lateral ${position} creado: ${ad.title}`,
      after: JSON.stringify(ad),
    },
  });
  return NextResponse.json({ ad });
}

// PUT — update by id
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, data, actor = "Content Moderator" } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.sideAd.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "anuncio no encontrado" }, { status: 404 });

  const update: Record<string, unknown> = {};
  for (const k of ["position", "title", "content", "link", "imageUrl", "bgColor", "order", "isActive"]) {
    if (k in data) update[k] = data[k];
  }
  if ("order" in update) update.order = Number(update.order);
  if ("isActive" in update) update.isActive = Boolean(update.isActive);

  const ad = await db.sideAd.update({ where: { id }, data: update });
  await db.auditLog.create({
    data: {
      actor,
      action: "SIDE_AD_UPDATE",
      entity: "SideAd",
      entityId: ad.id,
      detail: `Anuncio lateral actualizado: ${ad.title} (${ad.position})`,
      before: JSON.stringify(before),
      after: JSON.stringify(ad),
    },
  });
  return NextResponse.json({ ad });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const actor = req.nextUrl.searchParams.get("actor") ?? "Content Moderator";
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.sideAd.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "anuncio no encontrado" }, { status: 404 });

  await db.sideAd.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      actor,
      action: "SIDE_AD_DELETE",
      entity: "SideAd",
      entityId: id,
      detail: `Anuncio lateral eliminado: ${before.title} (${before.position})`,
      before: JSON.stringify(before),
    },
  });
  return NextResponse.json({ ok: true });
}
