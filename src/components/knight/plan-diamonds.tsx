'use client'

import { Gem } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * PlanDiamonds — renders N filled diamond icons + (5-N) outline diamonds
 * to visually identify the ad plan tier (1-5).
 * Mínimo=1, Medio=2, Alta=3, Superior=4, Permanente=5.
 */
export function PlanDiamonds({
  count,
  size = 14,
  className,
  showLabel = false,
}: {
  count: number
  size?: number
  className?: string
  showLabel?: boolean
}) {
  const filled = Math.max(0, Math.min(5, count))
  return (
    <span className={cn("inline-flex items-center gap-0.5 align-middle", className)} aria-label={`Nivel ${filled} de 5 diamantes`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Gem
          key={i}
          style={{ width: size, height: size }}
          className={i < filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40"}
          strokeWidth={1.8}
        />
      ))}
      {showLabel && <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">Nivel {filled}</span>}
    </span>
  )
}
