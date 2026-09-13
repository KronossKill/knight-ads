# Task I5 — Visitor: card redesign + top-rated row + referral dashboard

- **Agent**: visitor-redesign
- **Task ID**: I5
- **File touched**: `src/components/knight/visitor-portal.tsx` (ONLY — per task rules)
- **Date**: 2025-09-11
- **Lint**: `bun run lint` → exit 0, 0 errors, 0 warnings
- **Dev server**: alive; `GET /api/ads/top-rated?limit=6 200` confirmed; page renders

## What changed

### Task A — Compact horizontal AdCard
Rewrote the `AdCard` component (was ~280px tall vertical card → now ~120-140px horizontal card):
- Layout switched to **horizontal**: `flex gap-3 p-3` with a 96px (`size-24`) image on the LEFT and content on the RIGHT.
- Image: rounded-lg, plan badge overlaid bottom-left (`absolute -bottom-1.5 -left-1.5`), "Permanente" badge overlaid top-right when applicable. Fallback Megaphone icon when no imageUrl.
- Content RIGHT column: meta row (PlanDiamonds size=9 + advertiser + relative time, text-[10px] muted) → title (text-sm font-bold line-clamp-1) → content (text-xs muted line-clamp-2) → bottom action row (`mt-auto`).
- **Reward display** kept but compact: inline gold pill (`rounded-full border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px]`) with 💰 emoji + `{netReward.toFixed(6)} $Kn` in `text-gradient-gold tabular-nums`.
- **Plan badge + diamonds** kept but smaller: badge overlaid on image (h-5 text-[10px]); diamonds size=9.
- **"Ver anuncio" button** → compact: `h-7 px-2.5 text-xs` pill labeled "Ver" with Eye icon. External-link kept as a tiny `size-7` ghost icon button to the left of "Ver".
- **Star rating** added (subtle, inline): single Star icon + `{avgStars.toFixed(1)}` + `({ratingCount ?? 0})` in text-[10px] amber — ONLY renders when `avgStars` prop is a positive number (regular feed ads don't pass it, so it stays hidden in the normal feed).
- Added optional props `avgStars?: number` and `ratingCount?: number` to AdCard (regular `Ad` type doesn't have them; only `AdWithRatings` from top-rated API does).
- Hover: `hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5` (subtle lift + gold border).

### Task B — Top-rated horizontal row above the feed
- New `TopRatedCard` component: vertical mini-card ~200px wide (`w-[200px] shrink-0`), `motion.button` with `whileHover={{ y: -3 }}`. Shows: 96px-tall image (h-24 w-full) with overlaid plan badge, title (text-xs font-bold line-clamp-1), `StarRating` (readOnly size=11, shows avg + count), and a bottom row with `💰 {netReward.toFixed(4)} $Kn` + a gold "Ver" pill. Clickable → opens same viewer modal via `onView(ad, plan)`.
- New `TopRatedRow` component: section with heading "⭐ Mejor Valorados" (gold) + subheading "los anuncios con mejores calificaciones" (muted text-[11px]), then a horizontal scrollable flex (`overflow-x-auto [scrollbar-width:thin]`) of TopRatedCards. Returns `null` when `ads.length === 0` (section auto-hides).
- Main component fetches `/api/ads/top-rated?limit=6` once on mount (`cache: 'no-store'`), parses defensively (`Array.isArray(data) ? data : data?.ads ?? []`), stores in `topRatedAds` state. Silent on failure.
- `TopRatedRow` rendered in the main column BETWEEN the feed header (h2 + count badge) and the filter chips, i.e. above the paginated feed. Reuses the same `handleView` handler so top-rated ads open the identical viewer modal flow as regular feed ads.

### Task C — Referral dashboard in sidebar
- New `ReferralData` type: `{ referralLink, level1Count, level2Count, totalEarningsKnight }`.
- New `ReferralDashboardCard` component: glass card with a gold-gradient circle (Gift icon) + "Programa de Referidos" title, and an Info-button triggering a Popover.
  - **Referral link**: full URL (origin + referralLink, computed in a `useMemo` so it's stable) shown in a bordered code box with a Copy icon button (`navigator.clipboard.writeText`). Toast on success/failure. Check-circle swap for 1.5s after copy.
  - **Counts**: 2-col grid — "Nivel 1" / "Nivel 2" with `data.level1Count` / `data.level2Count` in amber tabular-nums.
  - **Total earnings**: emerald-tinted box — "Ganancias por referidos" + `{formatKn(total, 4)} {tokenSymbol}` + `≈ {formatUsd(knightToUsd(total, priceUsd))} USD`.
  - **"¿Cómo funciona?" popover**: Info icon → Popover (click-triggered, accessible on touch) explaining "Recibe {referralReward} {tokenSymbol} por cada amigo que se registre via tu enlace. Gana {level1Percent}% de sus ingresos de por vida + {level2Percent}% del nivel 2." All three values read from settings via `getSettingValue` (referralRewardKnight, referralLevel1Percent, referralLevel2Percent).
  - States: `loading` → spinner + "Cargando…"; `data` present → full card; `data` null after load → "No se pudo cargar tu programa de referidos." fallback.
- New `ReferralDashboardCardPlaceholder` component (rendered when `userEmail` is undefined): compact centered card — gold-gradient circle + "Programa de Referidos" + "Inicia sesión para tu enlace de referido".
- Main component fetches `/api/referrals?email={encodeURIComponent(userEmail)}` once on mount WHEN `userEmail` is provided (`cache: 'no-store'`). Defensive parse — only sets referralData when `data.referralLink` is a string. 404/500 → leaves referralData null → card shows the fallback. `referralLoading` toggles the spinner.
- `ReferralDashboardCard` (or placeholder) rendered in the sidebar IMMEDIATELY AFTER `VisitorWalletCard` and before the G4 live-ads card — i.e. between the wallet card and the plan card as required.

## Imports added
- lucide-react: `Gift`, `Info`, `Star`
- shadcn/ui: `Popover`, `PopoverContent`, `PopoverTrigger` (from `@/components/ui/popover`)
- shared helpers: `PlanDiamonds` (from `@/components/knight/plan-diamonds`)
- types: added `AdWithRatings` to the existing `import type { ... } from '@/lib/knight-types'`

## Verification
- `bun run lint` → exit 0, no output (0 errors, 0 warnings).
- Dev server log confirms `GET /api/ads/top-rated?limit=6 200 in 48ms` (the new fetch fires on mount and succeeds).
- Polling continues cleanly: `GET /api/ads?status=active&limit=50 200`, `GET /api/ads?status=all&limit=200 200`, `GET /api/price 200` every 15s.
- The `/api/referrals?email=...` endpoint currently returns 500 (`TypeError: Cannot read properties of undefined (reading 'findUnique')` at `db.user.findUnique`) — this is a PRE-EXISTING backend issue (the `User` model is not in the Prisma schema / `db` client), NOT caused by my frontend changes and OUTSIDE my task scope (I was told to ONLY edit visitor-portal.tsx). My `ReferralDashboardCard` degrades gracefully: `r.ok` is false → fetch resolves to null → `referralData` stays null → card shows "No se pudo cargar tu programa de referidos." fallback. No uncaught promise rejection.

## Files NOT touched (per task rules)
- No new files created.
- `page.tsx`, `knight-types.ts`, `star-rating.tsx`, `plan-diamonds.tsx`, all API routes, all schemas — untouched.

## Design language
- Premium dark crypto. shadcn/ui (Card, Button, Badge, Popover). Lucide (Gift, Info, Star, Eye, ExternalLink, Copy, CheckCircle2, Loader2, Megaphone). Framer Motion (`motion.button` with `whileHover` for the top-rated cards).
- Theme classes used: `text-gradient-gold`, `glass`, `glass-strong`, `bg-gradient-gold`, `glow-gold` (via shadow tokens), `text-emerald-300`, `text-amber-300`.
- All Spanish copy. Compact cards feel like a feed (Twitter/X-style compact rows). Top-rated row is a horizontal scroller of ~200px mini-cards.
