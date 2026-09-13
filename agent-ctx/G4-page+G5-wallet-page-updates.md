# Task G4-page + G5-wallet — Real-time ad status polling + on-chain wallet verification wiring

**Agent**: page-updates
**Files modified**: `/home/z/my-project/src/app/page.tsx` (only — strict rule respected)
**Previous agent context**: read `/home/z/my-project/worklog.md` (full 581 LOC) for shared design system, types, API routes, the existing fetch-on-mount pattern, the live $Knight price feed, and the `react-hooks/set-state-in-effect` lint rule precedent.

## Scope clarification (per task instructions)
- The page.tsx does NOT directly handle wallet connection — `VisitorPortal` (`src/components/knight/visitor-portal.tsx`) handles it internally via `isValidSolanaAddress()`. The visitor-portal subagent (round 5) will upgrade that check to call the new `POST /api/wallet/verify` endpoint (already created, returns `{ valid, network, exists, owner, executable, lamports, rpc, reason }` from a real Solana RPC `getAccountInfo` call). The dev log confirms `POST /api/wallet/verify 200` is already being hit by other agents.
- This agent's task is therefore **Task G4-page only**: real-time polling + live status indicator + PortalHeader liveStats badges.

## Work Log

### Task G4-page — Real-time polling + live indicator + PortalHeader liveStats

**New state** (added after the existing `loading` state in `HomeContent`):
```ts
const [allAds, setAllAds] = useState<Ad[]>([])           // for paused/finished counts
const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
const [now, setNow] = useState<number>(Date.now())         // 1s tick for relative time
const prevActiveCountRef = useRef<number | null>(null)    // toast debounce — prev count
const lastToastRef = useRef<number>(0)                     // toast debounce — 30s gate
```

**Initial mount fetch extended** (the existing `useEffect([tick])` block): added a 5th parallel fetch — `GET /api/ads?status=all&limit=200` — so paused/finished counts are populated on first paint. Sets `setAllAds(allR.ads ?? [])`, `prevActiveCountRef.current = initialAds.length` (so the first poll at t=20s has a baseline to compare against), and `setLastRefresh(Date.now())`. Existing `// eslint-disable-next-line react-hooks/set-state-in-effect` comment kept untouched.

**New polling effect** (separate `useEffect([])`):
- 20-second `setInterval`
- Guard: `if (typeof document !== "undefined" && document.visibilityState !== "visible") return` — pauses when tab hidden
- Parallel-fetches 3 endpoints with `Promise.all`:
  1. `/api/ads?status=active&limit=50` → live ad feed (used by Visitor portal)
  2. `/api/stats` → aggregate counts (used by Transparency section)
  3. `/api/ads?status=all&limit=200` → all statuses so PortalHeader can render paused/finished counts
- Updates `setAds`, `setStats`, `setAllAds`, `setLastRefresh(Date.now())`
- **Debounced toast** when the active ad count changes:
  - Compares `prevActiveCountRef.current` (number|null) vs `newActive.length`
  - If `prev !== null && prev !== curr` AND `Date.now() - lastToastRef.current > 30_000` → `toast.success("Feed actualizado en tiempo real", { description: ... })` with two description variants based on whether count went up ("Un nuevo anuncio activo está disponible.") or down ("Un anuncio finalizó su paquete de vistas.")
  - `lastToastRef.current` updated after firing so subsequent changes within 30s are silent
  - Updates `prevActiveCountRef.current = curr` on every poll
- Cleanup: `return () => clearInterval(interval)`
- The `setState` calls are inside the `Promise.all().then(...)` callback — NOT in the effect body — so the `react-hooks/set-state-in-effect` rule does not flag them (confirmed by lint).

**New 1-second tick effect** (`useEffect([])`):
- `setInterval(() => setNow(Date.now()), 1000)` — drives the "hace Xs" relative-time display
- The `setNow` call is inside the interval callback, not the effect body → not flagged by the rule

**`liveStats` object computed on every render** (after `networkName`):
```ts
const liveStats: LiveStats = {
  active: allAds.filter((a) => a.status === "active").length,
  paused: allAds.filter((a) => a.status === "paused").length,
  finished: allAds.filter((a) => a.status === "finished").length,
  lastRefresh,
}
const secondsSinceUpdate = Math.max(0, Math.floor((now - lastRefresh) / 1000))
```
The `LiveStats` type is declared later in the file (module-scope type — hoisted) and matches the spec shape exactly: `{ active, paused, finished, lastRefresh }`.

**Navbar — `LiveIndicator` pill** (desktop only, inserted BEFORE the CTAs / session badge in the existing `<div className="hidden md:flex items-center gap-2">`):
```tsx
<LiveIndicator seconds={secondsSinceUpdate} />
```
The `LiveIndicator` component renders:
- Pill: `rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300`
- Pulsing green dot — `relative flex h-1.5 w-1.5` containing an `animate-ping` outer span and a solid emerald inner span
- "En vivo" in semibold + "·" + "hace Xs" (tabular-nums for stable digit width)
- `title="Feed actualizado en tiempo real cada 20s"` for accessibility

**PortalHeader signature** extended with optional `liveStats?: LiveStats | null`. When provided, renders a `<LiveStatsRow stats={liveStats} />` directly below the subtitle `<p>` (inside the flex-1 column, after the subtitle, before the portal body).

**`LiveStatsRow`** renders 4 badges in a `mt-3 flex flex-wrap items-center gap-2` row:
1. **Active** — emerald dot + `{active}` (tabular-nums) + "activos"
2. **Paused** — amber dot + `{paused}` + "pausados"
3. **Finished** — slate dot + `{finished}` + "finalizados"
4. **En vivo** — pulsing emerald dot + "En vivo" + "·" + "hace {seconds}s"
   - `seconds` is recomputed at render time via `Math.max(0, Math.floor((Date.now() - stats.lastRefresh) / 1000))` — this is fresh on every render because HomeContent re-renders every 1s via the `now` state, which propagates to PortalHeader (not memoized) and LiveStatsRow.

`liveStats={liveStats}` passed to ALL 4 PortalHeader instances (Anunciante, Visitante, Admin, Transparencia).

## Why PortalHeader re-renders every 1s (for the relative time)
- PortalHeader is a plain function component (NOT `React.memo`)
- It's a child of HomeContent (the parent that holds `now` state)
- When `now` changes every 1s, HomeContent re-renders → React re-renders all children including PortalHeader → PortalHeader re-renders → LiveStatsRow re-renders → its `Date.now()` call gets a fresh value
- The new `liveStats` object reference each render also forces the re-render even though React's default prop comparison is reference equality — but for non-memoized components, this is moot (they always re-render with parent).

## Verification
- `bun run lint` → **0 errors, 3 warnings — all pre-existing** ("Unused eslint-disable directive" on lines 114, 190, 198 — these are the original fetch-on-mount, view-change refetch, and admin-query-param effects that pre-date this task; the `react-hooks/set-state-in-effect` rule is not actually firing in this project's ESLint config, so the existing eslint-disable comments are flagged as unused). No new warnings introduced by my edits.
- `bunx tsc --noEmit --skipLibCheck` → **0 errors in `src/app/page.tsx`**. (All TS errors reported are in pre-existing untouched files: `examples/`, `scripts/`, `skills/`, `src/app/api/price/route.ts`, and one in `visitor-portal.tsx` from a different agent's work that pre-dates this task.)
- Dev server log after edits shows the expected behavior:
  ```
  GET / 200
  GET /api/side-ads?position=left 200
  GET /api/config 200
  GET /api/stats 200
  GET /api/ads?status=all&limit=200 200   ← NEW (initial mount)
  GET /api/ads?status=active&limit=50 200
  GET /api/ads/top-rated?limit=6 200
  GET /api/price 200
  GET /api/side-ads?position=right 200
  ... ~20s later (first poll) ...
  GET /api/ads?status=active&limit=50 200
  GET /api/stats 200
  GET /api/ads?status=all&limit=200 200   ← polling cycle
  ```
  All endpoints returning 200, polling cycle firing as designed.

## Files NOT touched (per task rules)
- `src/components/knight/visitor-portal.tsx` — wallet verification upgrade is the visitor-portal subagent's responsibility (round 5)
- `src/components/knight/admin-portal.tsx`, `landing-sections.tsx`, `side-rail.tsx`, `auth-gate.tsx`, `use-price-feed.ts` — untouched
- `AdminGate` component (defined inside page.tsx) — untouched, kept as-is per the rule
- `AuthGate` (external component) — untouched
- No new files created, no API routes added, no schema changes

## Stage Summary
`src/app/page.tsx` (748 → 891 LOC, +143 LOC) now ships:
1. **Real-time polling** every 20s — refreshes the active ad feed, aggregate stats, and all-statuses counts. Pauses when the tab is hidden (`document.visibilityState !== "visible"`). Restores on visibility without resetting the 20s cadence.
2. **Navbar "En vivo" indicator** (desktop, right side, before the CTAs) — subtle emerald pill with a pulsing green dot, "En vivo · hace Xs" relative-time text, tabular-nums for stable width. Updates every second via a separate 1s tick.
3. **PortalHeader live stats row** — 4 badges (active/paused/finished/En vivo) below the subtitle in every portal (Anunciante, Visitante, Admin, Transparencia). Green dot for active, amber for paused, slate for finished, pulsing emerald for En vivo.
4. **Debounced toast** — when the active ad count changes between polls, a subtle `toast.success("Feed actualizado en tiempo real", { description })` fires. Max 1 toast per 30s. Different description for "new ad appeared" vs "ad finished".
5. Wallet verification wiring (G5-page) — explicitly NOT done here; the visitor-portal subagent owns the `POST /api/wallet/verify` integration. The page.tsx just stays out of the way.

All Spanish copy. shadcn/ui Badge + Lucide icons (existing icon set — no new icons needed; the pulsing dot uses `animate-ping` from Tailwind, no extra dependency). Theme tokens: `bg-emerald-500/10`, `text-emerald-300`, `bg-amber-500/10`, `text-amber-300`, `bg-secondary`, `text-muted-foreground`, `bg-slate-500`, `tabular-nums`. Toasts via `sonner`. Responsive — badges wrap with `flex-wrap`, navbar pill is desktop-only (`hidden md:flex` wrapper inherited from the existing CTAs container).
