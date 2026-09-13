# F4 — admin-credentials-pricing agent

Task: Add "Credenciales Admin" tab (7th, first position) + pricing settings rendering + profitability dashboard in Tesorería.

Target file: `/home/z/my-project/src/components/knight/admin-portal.tsx` (ONLY this file).

## Status: COMPLETED

## Plan
- Task A: Add `CredentialsTab` + `LoginTestDialog` components and a new TabsTrigger/TabsContent "credentials" placed FIRST (before Configuración Global).
- Task B: Add `DollarSign` to ICONS map + extend `computedPreview` for `knightPriceUsd` + add `extraHint` helper for `useLivePriceFeed` / `knightTokenMint` / `priceCacheSeconds` (rendered in `SettingRow`).
- Task C: Add `ProfitabilityCard` rendered as the first card of the Tesorería tab. Reads `commissionPercent`, `visitorRewardPercent` from settings + max visitor plan multiplier.

## API contracts (verified working after prisma client regen + dev server restart)
- `GET /api/auth/admin` → `200 {"configured":true,"username":"admin","mfaLabel":"Knight Admin MFA","hasPassword":true,"hasSecret":true}`
- `PUT /api/auth/admin` body `{ username, password?, secretCode?, mfaLabel?, actor }` → `200 {"ok":true,"username":"admin","mfaLabel":"Knight Admin MFA"}`
- `POST /api/auth/admin` body `{ step:"credentials", username, password }` → `{"ok":true,"mfaRequired":true,"mfaLabel","username"}` or `401 {"error":"Credenciales incorrectas"}`
- `POST /api/auth/admin` body `{ step:"mfa", username, secretCode }` → `{"ok":true,"actor":"Super Admin","username":"admin"}` or `401 {"error":"Código 2FA incorrecto"}`

## Files modified
- `/home/z/my-project/src/components/knight/admin-portal.tsx` (only)
- Indirect: `bun run db:push` regenerated the Prisma client (no source change) to include the `AdminCredential` model — this was needed because the live dev server had a stale client before F4. No source files other than admin-portal.tsx were edited.

## Verification
- `bun run lint` → 0 errors, 0 warnings.
- `bunx tsc --noEmit --skipLibCheck` → no errors in admin-portal.tsx (only pre-existing unrelated errors elsewhere).
- Dev server stable (PID 14854 after restart). All API routes return 200.
- Full 2-step login verified via curl (admin / knight2026 → KN7X9M2P → "Super Admin" actor granted).

## Final tab order in AdminPortal
1. **Credenciales Admin** (NEW, Lock icon, first position)
2. Configuración Global (now renders `pricing` category with DollarSign icon + USD preview + Jupiter hint)
3. Planes de Anunciantes
4. Planes de Visitantes
5. Tesorería (now starts with ProfitabilityCard showing commission/reward/multiplier + formula)
6. Anuncios Laterales
7. Auditoría & Transparencia
