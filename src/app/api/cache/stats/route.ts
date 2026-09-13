import { NextResponse } from "next/server";
import { cacheStats, cacheDelete } from "@/lib/cache";

// GET /api/cache/stats — returns in-memory cache hit/miss stats (admin/debug)
export async function GET() {
  return NextResponse.json({
    ...cacheStats(),
    note: "In production, replace with Redis (distributed cache across instances).",
  });
}

// POST /api/cache/stats — manually clear all caches
export async function POST() {
  cacheDelete("");
  return NextResponse.json({ ok: true, message: "All caches cleared", ...cacheStats() });
}
