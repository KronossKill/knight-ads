# G2+G3 — advertiser-updates agent

Task: Plan descriptions inline at the selection point (G2) + re-launch existing ads with a new plan (G3) in the Advertiser Portal.

Target file: `/home/z/my-project/src/components/knight/advertiser-portal.tsx` (ONLY this file).

## Status: COMPLETED

## Plan
- Task G2: Added `Check` icon + `PlanDiamonds` imports. Added `formatKnReward` (es-ES, min 4 / max 6 fractional digits) and `feedPriorityLabel` (>=5 → Privilegiada, >=3 → Mejor, else Estándar) helpers. Factored out a new `PlanRadioCard` component (props: plan, settings, isSelected, idPrefix) that renders name + diamonds + description (text-sm, line-clamp-3) + 4-item feature checklist (vistas prepagadas / segundos / posición feed / reward por vista, computed live from `visitorRewardPercent` setting) + the existing price/views/duration grid. Reused in both PublishDialog step 1 (idPrefix="publish-plan") and RelaunchAdDialog (idPrefix="relaunch-plan") — no ID collisions.
- Task G3: Added new `RelaunchAdDialog` component (props: ad, plans, settings, open, onOpenChange, onRelaunch). useEffect preselects the next-higher tier for finished ads (upsell) or the current plan for active/paused. Header card shows thumbnail + title + status badge + current plan badge. Footer shows new cost ($Kn + USD), Cancelar, and gold-gradient "Relanzar anuncio" button. On submit: 500ms simulated delay → toast.success("Plan adquirido. El anuncio ha sido relanzado con {planName}.") → onRelaunch + close.
- AdsTable updates: new `settings: Setting[]` prop, new `relaunchAd: MockAd | null` state, new `handleRelaunch(adId, planCode)` that mutates the mock row to `{status:'active', planCode, viewsUsed:0}`. Restructured actions cell to a 2-button flex row: keeps Pausar/Reanudar toggle for non-finished ads + adds a "Relanzar" button on EVERY row (gold gradient for finished, amber-tinted outline for others). Removed the dead "—" placeholder for finished ads. Added subtle row tint `bg-slate-500/[0.05]` for finished rows. Existing slate "Finalizado" badge in Estado column serves as the subtle highlight. Paused ads keep their existing "Reanudar" quick-action (no plan purchase needed) which already toasts "Anuncio reanudado. Visible en el feed.".
- Main `AdvertiserPortal` updated to pass `settings={settings}` to `<AdsTable>`.

## Files modified
- `/home/z/my-project/src/components/knight/advertiser-portal.tsx` (only). Final size: 1428 LOC (was 1146, +282 LOC).

## Verification
- `bun run lint` → 0 errors / 0 warnings in advertiser-portal.tsx (only pre-existing unrelated errors in visitor-portal.tsx + page.tsx).
- `bunx tsc --noEmit --skipLibCheck` → no advertiser-portal.tsx errors.
- Dev server: `✓ Compiled in 779ms`, `GET / 200`, no errors in `dev.log`.
- Verified the same `PlanRadioCard` is used in both dialogs (publish + relaunch) — consistent UX.
