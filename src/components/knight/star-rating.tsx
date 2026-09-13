'use client'

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * StarRating — displays and optionally captures a 1-5 star rating.
 * readOnly → just shows avg stars (supports fractional fill via half-star).
 * interactive → user clicks to set their rating; calls onRate(stars).
 */
export function StarRating({
  value,
  count,
  readOnly = true,
  size = 16,
  onRate,
  className,
}: {
  value: number // 0..5 (can be fractional for readOnly)
  count?: number
  readOnly?: boolean
  size?: number
  onRate?: (stars: number) => void
  className?: string
}) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(display)
          const half = !filled && i - 0.5 <= display
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled && "fill-amber-400 text-amber-400",
                half && "fill-amber-400/50 text-amber-400",
                !filled && !half && "fill-transparent text-muted-foreground/40",
                !readOnly && "cursor-pointer hover:fill-amber-300 hover:text-amber-300"
              )}
              strokeWidth={1.8}
              onClick={readOnly ? undefined : () => onRate?.(i)}
              onMouseEnter={readOnly ? undefined : () => setHover(i)}
              onMouseLeave={readOnly ? undefined : () => setHover(0)}
            />
          )
        })}
      </div>
      {typeof count === "number" && (
        <span className="text-[11px] text-muted-foreground ml-0.5">
          {value.toFixed(1)} <span className="text-muted-foreground/60">({count})</span>
        </span>
      )}
    </div>
  )
}
