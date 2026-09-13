'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, X, Megaphone, Film, Video, RectangleHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { badgeClass } from "@/lib/knight-types"
import type { SideAd } from "@/lib/knight-types"

/**
 * SideAd is fetched from the API with extra fields (`mediaType`, `width`,
 * `height`) that the DB model carries but the shared TypeScript interface
 * does not declare yet. We extend it locally so the rail can render the
 * right element per ad.
 */
type SideAdMediaType = "image" | "gif" | "banner" | "video"

type SideAdWithMedia = SideAd & {
  mediaType?: SideAdMediaType
  width?: number
  height?: number
}

/**
 * SideRail — renders a vertical column of admin-configured banner ads
 * on the left or right of the main content. Hidden on small screens.
 * Sticky so it stays visible while the main content scrolls.
 */
export function SideRail({
  position,
  ads,
}: {
  position: "left" | "right"
  ads: SideAd[]
}) {
  if (!ads || ads.length === 0) return null
  const sideClass = position === "left" ? "left-2" : "right-2"

  return (
    <aside
      aria-label={`Anuncios laterales (${position})`}
      className={`fixed top-20 bottom-24 ${sideClass} z-20 hidden xl:flex flex-col gap-3 w-[220px] overflow-y-auto pointer-events-none`}
    >
      <div className="pointer-events-auto sticky top-0 flex items-center gap-1.5 mb-1 px-2">
        <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Patrocinado</span>
      </div>
      {ads.map((ad, i) => (
        <SideAdCard key={ad.id} ad={ad as SideAdWithMedia} index={i} />
      ))}
    </aside>
  )
}

function mediaBadgeLabel(type: SideAdMediaType | undefined): string | null {
  if (!type || type === "image") return null
  if (type === "gif") return "GIF"
  if (type === "video") return "Video"
  if (type === "banner") return "Banner"
  return null
}

function SideAdCard({ ad, index }: { ad: SideAdWithMedia; index: number }) {
  const [closed, setClosed] = useState(false)
  if (closed) return null

  // Container aspect ratio: prefer explicit width/height from the ad, fall
  // back to 16/9 ("aspect-video") for images / gifs and a 4/3 box for banners.
  const aspectRatio =
    ad.width && ad.height && ad.height > 0
      ? `${ad.width} / ${ad.height}`
      : ad.mediaType === "banner"
        ? "4 / 3"
        : "16 / 9"

  const badge = mediaBadgeLabel(ad.mediaType)

  return (
    <motion.a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      className={`pointer-events-auto group relative block rounded-xl border border-border/60 bg-card/70 backdrop-blur p-3 hover:border-primary/40 hover:bg-card transition-all shadow-lg overflow-hidden ${badgeClass(ad.bgColor).split(" ").filter((c) => c.startsWith("border")).join(" ")}`}
    >
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setClosed(true) }}
        className="absolute right-1.5 top-1.5 z-10 rounded-md p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-secondary/80 transition-colors"
        aria-label="Cerrar anuncio"
      >
        <X className="h-3 w-3" />
      </button>
      {ad.imageUrl ? (
        <div
          className="relative mb-2 w-full overflow-hidden rounded-md bg-secondary"
          style={{ aspectRatio }}
        >
          {ad.mediaType === "video" ? (
            <video
              src={ad.imageUrl ?? undefined}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : ad.mediaType === "banner" ? (
            <iframe
              src={ad.imageUrl ?? undefined}
              className="h-full w-full border-0"
              title={`Banner — ${ad.title}`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          ) : (
            <img
              src={ad.imageUrl ?? undefined}
              alt={ad.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {badge && (
            <Badge className="absolute right-1 top-1 z-[1] h-4 gap-0.5 px-1 text-[9px] font-bold uppercase tracking-wide border-amber-500/40 bg-amber-500/85 text-amber-950 shadow">
              {ad.mediaType === "video" && <Video className="size-2.5" />}
              {ad.mediaType === "gif" && <Film className="size-2.5" />}
              {ad.mediaType === "banner" && <RectangleHorizontal className="size-2.5" />}
              {badge}
            </Badge>
          )}
        </div>
      ) : (
        <div className={`mb-2 h-1.5 w-10 rounded-full ${badgeClass(ad.bgColor).split(" ")[0]}`} />
      )}
      <div className="flex items-start justify-between gap-1.5 mb-1 pr-4">
        <h4 className="text-xs font-bold leading-tight text-foreground line-clamp-2">{ad.title}</h4>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3 mb-2">{ad.content}</p>
      <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
        <ExternalLink className="h-3 w-3" />
        Visitar
      </div>
    </motion.a>
  )
}

/** Hook helper for fetching side ads (used by the page) */
export function useSideAds() {
  const [left, setLeft] = useState<SideAd[]>([])
  const [right, setRight] = useState<SideAd[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [l, r] = await Promise.all([
        fetch("/api/side-ads?position=left", { cache: "no-store" }).then((x) => x.json()).catch(() => ({ ads: [] })),
        fetch("/api/side-ads?position=right", { cache: "no-store" }).then((x) => x.json()).catch(() => ({ ads: [] })),
      ])
      if (cancelled) return
      setLeft(l.ads ?? [])
      setRight(r.ads ?? [])
    })()
    return () => { cancelled = true }
  }, [])

  return { left, right }
}
