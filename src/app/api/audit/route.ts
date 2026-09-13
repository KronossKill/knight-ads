import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/audit — immutable audit log for transparency page
export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ logs });
}
