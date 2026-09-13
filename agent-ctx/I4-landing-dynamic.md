# Task I4 — Landing: dynamic slogans + top-rated visibility + ReferralCtaSection

**Agent**: landing-dynamic
**Files modified**: `/home/z/my-project/src/components/knight/landing-sections.tsx` (ONLY — strict rule respected)
**Previous agent context**: read `/home/z/my-project/worklog.md` (shared design system, types, API routes, seed defaults).

## What changed (summary)
1. **Imports**: added `Gift`, `Trophy` (lucide-react) + `toast` (sonner).
2. **Module helpers** (after `fmtKnight`):
   - `fmtKnReward(n)` — formats tiny per-view reward values (2-6 fractional digits, es-ES).
   - `MAX_VISITOR_MULTIPLIER_FALLBACK = 2.5` (Platinum, matches seed).
   - `MAX_PLAN_FALLBACK = { priceKnight: 10, viewsIncluded: 2000 }` (Permanente, matches seed).
   - `computeMaxRewardPerView(plans, visitorRewardPercent, maxMultiplier?)` — `((price × rewardPct/100) / views) × maxMultiplier`. Same formula as `visitor-portal.tsx` / `advertiser-portal.tsx`.
3. **HeroSection**: optional `plans?: AdvertiserPlan[]` prop added. Trust badges: kept "100% transparente", replaced the other two with dynamic "Comisión {commissionPercent}%" + "Reward visitantes {visitorRewardPercent}%". Added a new emerald badge next to the price ticker: "Gana hasta {fmtKnReward(maxRewardPerView)} {tokenSymbol} por vista".
4. **WhatIsSection**: signature changed from `_props: Record<string, never>` to `{ settings = [] }: { settings?: Setting[] } = {}` (optional, empty-array default). Feature copy + stats now read `commissionPercent` / `visitorRewardPercent` / `tokenSymbol` / `networkName` dynamically.
5. **SchemesSection**: optional `settings?: Setting[]` added. New advertiser bullet `Comisión de plataforma del ${commissionPercent}% (configurable)`. New visitor bullets: `Gana hasta ${fmtKnReward(maxRewardPerView)} ${tokenSymbol} por vista`, `Multiplicador hasta ×${maxMultiplier} con plan Platinum` (REPLACED the inaccurate old ×2/×4 bullet — seed is ×1.5/×2.5), `Reward de bienvenida: ${fmtKnight(referralReward)} al registrarte via referido`.
6. **HowItWorksSection**: optional settings added. All 5 steps now have `sub: ""` field (uniform shape). Step 4 has `sub: \`Comisión de plataforma ${commissionPercent}% · ${visitorRewardPercent}% se reparte entre visitantes\`` rendered as a small amber sub-line under the copy. Step 5 uses dynamic `withdrawalFeePercent`.
7. **AdvertiserPlansSection**: footer was already dynamic (tiles). Added a small explicit caption `Comisión {commissionPct}% · Reward visitantes {rewardPct}% · configurable` below the tiles.
8. **TopRatedSection**: section bg changed to gradient `from-amber-500/[0.05] via-background to-background` with `border-y border-amber-500/20`. Added a gold aura blur at the top. NEW "⭐ TOP RATED" ribbon (Trophy icon, amber pill, gold glow) at the very top. NEW "Ver todos" outline button (amber-tinted) → `toast.info("Los mejores anuncios del momento")`. Cards: stronger gold-glow hover (`hover:-translate-y-1.5 hover:border-amber-500/70 hover:shadow-[0_0_48px_-10px] hover:shadow-amber-500/50`), bigger image hover scale (1.04), NEW "Top" pill (Trophy icon) always visible in card header next to plan badge. Grid gap bumped gap-5→gap-6, lg:gap-6→lg:gap-7.
9. **CtaBandSection**: optional settings added. Main paragraph uses `{tokenSymbol}` instead of literal "$Knight". NEW paragraph below: `🎁 Gana recompensas de hasta {fmtKnight(referralReward)} solo por registrarte via un enlace de referido.` NEW "Programa de Referidos a 2 niveles activo" pill (Gift icon) above the H2.
10. **NEW `ReferralCtaSection`** export (section 10): `{ settings: Setting[]; onCta?: (role: CtaRole) => void }`. Reads `referralRewardKnight` / `referralLevel1Percent` / `referralLevel2Percent` / `tokenSymbol`. Gradient-border wrapper (gold → violet, 1.5px padding trick, gold glow shadow). Glass-strong inner card with amber aura. Gift icon box (bg-gradient-gold). H3 "🎁 Programa de Referidos a 2 niveles". Dynamic copy with the 3 values highlighted in amber. 3 small pills (Bienvenida / Nivel 1 / Nivel 2). CTA "Quiero mi enlace de referido" → `onCta?.("visitante")` (optional chaining — no-op if no onCta).

## Settings keys used (all from seed.ts)
- `commissionPercent` (default 70) — HeroSection, WhatIsSection, SchemesSection, HowItWorksSection, AdvertiserPlansSection (already used).
- `visitorRewardPercent` (default 30) — same sections.
- `referralRewardKnight` (default 100) — SchemesSection, CtaBandSection, ReferralCtaSection.
- `referralLevel1Percent` (default 5) — ReferralCtaSection.
- `referralLevel2Percent` (default 2) — ReferralCtaSection.
- `withdrawalFeePercent` (default 10) — HowItWorksSection step 5.
- `tokenSymbol` (default "$Knight") — most sections (replaces literal "$Knight").
- `networkName` (default "Solana") — WhatIsSection feature title/copy.
- `knightPriceUsd` (default 0.05) — HeroSection price ticker (already used).
- `brandName`, `landingHeadline` — HeroSection (already used).

## IMPORTANT — page.tsx wiring needed (for the next agent)
The dynamic economic values will ONLY reflect admin changes if `page.tsx` passes `settings={settings}` to these sections. Current page.tsx call sites (NOT modified by me):
- `<HeroSection settings={settings} onCta={goCta} />` — already receives settings ✓ (OPTIONAL: add `plans={advertiserPlans}` so the max-reward badge computes from the real max plan instead of the Permanente fallback).
- `<WhatIsSection />` — **change to `<WhatIsSection settings={settings} />`**.
- `<SchemesSection onCta={goCta} />` — **change to `<SchemesSection settings={settings} onCta={goCta} />`**.
- `<HowItWorksSection />` — **change to `<HowItWorksSection settings={settings} />`**.
- `<AdvertiserPlansSection plans={advertiserPlans} settings={settings} onSubscribe={...} />` — already receives settings ✓.
- `<TopRatedSection ads={topRatedAds} priceUsd={priceUsd} />` — no settings needed (visual-only).
- `<CtaBandSection onCta={goCta} />` — **change to `<CtaBandSection settings={settings} onCta={goCta} />`**.
- **NEW**: `ReferralCtaSection` needs to be imported from `@/components/knight/landing-sections` and rendered — suggested: `<ReferralCtaSection settings={settings} onCta={goCta} />` between TopRatedSection and CtaBandSection (or right after SchemesSection to surface the referral program early).

All sections accept their new props as OPTIONAL with sensible fallbacks that match the seed — so even without page.tsx changes, the landing page renders correctly with the seed defaults. Dynamic update-on-admin-change activates the moment page.tsx passes `settings`.

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings.
- `bunx tsc --noEmit --skipLibCheck` → 0 errors in `src/components/knight/landing-sections.tsx`. (Initial run flagged 2 TS2322 errors at lines 119-120 because `MAX_PLAN_FALLBACK` was declared `as const` — fixed by explicitly typing as `{ priceKnight: number; viewsIncluded: number }`.) All other tsc errors are in pre-existing untouched files (examples/, scripts/, skills/, api routes).
- dev.log → `✓ Compiled` after edits, all `/api/*` routes still 200, polling continues cleanly.
