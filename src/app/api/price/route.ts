import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettingValue } from "@/lib/knight-types";

// In-memory price cache (per process)
let cachedPrice: { value: number; source: string; ts: number } | null = null;

// GET /api/price → { priceUsd, source, tokenSymbol, tokenMint, cachedAge }
export async function GET() {
  const settings = await db.setting.findMany();
  const useLive = getSettingValue<boolean>(settings, "useLivePriceFeed", true);
  const manualPrice = getSettingValue<number>(settings, "knightPriceUsd", 0.05);
  const mint = getSettingValue<string>(settings, "knightTokenMint", "");
  const cacheTtl = getSettingValue<number>(settings, "priceCacheSeconds", 60) * 1000;
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");

  // Return cached if fresh
  if (cachedPrice && Date.now() - cachedPrice.ts < cacheTtl) {
    return NextResponse.json({
      priceUsd: cachedPrice.value,
      source: cachedPrice.source,
      tokenSymbol,
      tokenMint: mint,
      cachedAge: Math.round((Date.now() - cachedPrice.ts) / 1000),
    });
  }

  // Try live feed from Jupiter Price API
  if (useLive && mint && mint.length >= 32) {
    try {
      const url = `https://price.jup.ag/v6/price?ids=${encodeURIComponent(mint)}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const livePrice = data?.data?.[mint]?.price;
        if (typeof livePrice === "number" && livePrice > 0) {
          cachedPrice = { value: livePrice, source: "live-jupiter", ts: Date.now() };
          return NextResponse.json({
            priceUsd: livePrice,
            source: "live-jupiter",
            tokenSymbol,
            tokenMint: mint,
            cachedAge: 0,
          });
        }
      }
    } catch {
      // fall through to manual
    }
  }

  // Fallback to manual configured price
  cachedPrice = { value: manualPrice, source: "manual", ts: Date.now() };
  return NextResponse.json({
    priceUsd: manualPrice,
    source: "manual",
    tokenSymbol,
    tokenMint: mint,
    cachedAge: 0,
  });
}
