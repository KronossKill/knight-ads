'use client'

import { useEffect, useState } from "react"
import type { PriceFeed } from "@/lib/knight-types"

/**
 * usePriceFeed — polls /api/price periodically, returns current $Knight USD price.
 * Refreshes every 60s by default to stay in sync with the live Jupiter feed.
 */
export function usePriceFeed(intervalMs = 60_000) {
  const [price, setPrice] = useState<PriceFeed | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/price", { cache: "no-store" })
        const data = await res.json()
        if (!cancelled && data) {
          setPrice(data as PriceFeed)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
      if (!cancelled) {
        timer = setTimeout(fetchPrice, intervalMs)
      }
    }

    fetchPrice()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [intervalMs])

  return { price, loading }
}
