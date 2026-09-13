'use client'

// =============================================================================
// Knight Ads — Admin Portal
// Centerpiece of the platform: every parameter configurable without touching code.
// =============================================================================

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Legend,
} from "recharts"

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  badgeClass,
  SETTING_CATEGORIES,
  formatUsd,
} from "@/lib/knight-types"
import type {
  Setting,
  AdvertiserPlan,
  VisitorPlan,
  TreasuryAccount,
  PlatformStats,
  AuditLog,
  SideAd,
  AdminCredentialConfig,
} from "@/lib/knight-types"
import { PlanDiamonds } from "@/components/knight/plan-diamonds"

import {
  Coins,
  ShieldCheck,
  Layers,
  Palette,
  Plug,
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Lock,
  ShieldAlert,
  Wallet,
  Users,
  Eye,
  EyeOff,
  Banknote,
  ScrollText,
  CheckCircle2,
  XCircle,
  Crown,
  Sparkles,
  CircleDollarSign,
  History,
  Activity,
  Gauge,
  Hash,
  Loader2,
  ExternalLink,
  Columns2,
  KeyRound,
  RefreshCw,
  DollarSign,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const ACTOR = "Super Admin"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Coins,
  ShieldCheck,
  Layers,
  Palette,
  Plug,
  Settings: SettingsIcon,
  DollarSign,
}

const BADGE_COLOR_OPTIONS = [
  "amber",
  "gold",
  "sky",
  "violet",
  "rose",
  "emerald",
  "teal",
  "orange",
  "slate",
]

// Side-rail ad background color options (per spec — no "gold")
const SIDE_AD_BG_COLOR_OPTIONS = [
  "amber",
  "sky",
  "violet",
  "rose",
  "emerald",
  "teal",
  "orange",
  "slate",
]

// Map a setting key to a friendly computed preview string when relevant.
function computedPreview(
  key: string,
  raw: string,
): string | null {
  const n = Number(raw)
  switch (key) {
    case "commissionPercent":
      if (Number.isNaN(n)) return null
      return `Equivalente a ${(n / 100 * 10).toFixed(2)} $Kn de comisión por paquete de 10 $Kn`
    case "visitorRewardPercent":
      if (Number.isNaN(n)) return null
      return `Reward por vista para plan de 10 $Kn / 1.000 vistas: ${(n / 100 * 10 / 1000).toFixed(4)} $Kn`
    case "withdrawalFeePercent":
      if (Number.isNaN(n)) return null
      return `Por cada retiro de 100 $Kn se retienen ${(n).toFixed(2)} $Kn`
    case "reviewWindowHours":
      if (Number.isNaN(n)) return null
      return n === 0
        ? "Revisualización desactivada (anti-farming off)"
        : `Un usuario solo puede volver a ver el mismo anuncio cada ${n} h`
    case "visitorPlanDurationDays":
      if (Number.isNaN(n)) return null
      return `Planes Gold/Platinum expirarán tras ${n} días por defecto`
    case "knightPriceUsd":
      if (Number.isNaN(n) || n <= 0) return null
      return `Equivale a ${formatUsd(n)} por $Knight. Un plan de 20 $Kn ≈ ${formatUsd(20 * n)} USD.`
    default:
      return null
  }
}

// Extra static hints for specific pricing keys — supplements whatever help
// the DB already stores. Rendered in SettingRow below the DB help text.
function extraHint(
  key: string,
  value: string,
): string | null {
  switch (key) {
    case "useLivePriceFeed":
      return value === "true"
        ? "Si activo, se consulta el precio real desde Jupiter Price API usando el mint configurado. Si falla, se usa el precio manual."
        : "Desactivado: se usa el precio manual configurado arriba. Actívalo para consultar el precio real desde Jupiter Price API."
    case "knightTokenMint":
      return "Dirección del contrato del token $Knight en Solana (base58). Ej: So11111111111111111111111111111111111111112 (wSOL)."
    case "priceCacheSeconds":
      return "Tiempo de caché del feed de precio para no agotar la API de Jupiter."
    default:
      return null
  }
}

function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// Color palette for treasury chart (must be valid CSS)
const TREASURY_COLORS: Record<string, string> = {
  amber: "#f59e0b",
  gold: "#eab308",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  emerald: "#10b981",
  teal: "#14b8a6",
  orange: "#f97316",
  slate: "#64748b",
}

const AUDIT_ACTION_STYLE: Record<string, string> = {
  UPDATE_CONFIG: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  PLAN_CREATE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  PLAN_UPDATE: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  PLAN_DELETE: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  VISITOR_PLAN_CREATE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  VISITOR_PLAN_UPDATE: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  VISITOR_PLAN_DELETE: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  TREASURY_ADJUST: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  SIDE_AD_CREATE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  SIDE_AD_UPDATE: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  SIDE_AD_DELETE: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  DEFAULT: "border-slate-500/40 bg-slate-500/10 text-slate-300",
}

function actionBadgeClass(action: string): string {
  return AUDIT_ACTION_STYLE[action] ?? AUDIT_ACTION_STYLE.DEFAULT
}

// Safe JSON pretty-printer for audit diff display
function prettyJson(s?: string | null): string {
  if (!s) return "—"
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

// ---------------------------------------------------------------------------
// Section header (small inline helper)
// ---------------------------------------------------------------------------

function CategoryHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-primary-foreground shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground">
          {count} parámetro{count === 1 ? "" : "s"} configurable{count === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Setting row — renders the right control per type
// ---------------------------------------------------------------------------

function SettingRow({
  setting,
  value,
  isDirty,
  onChange,
}: {
  setting: Setting
  value: string
  isDirty: boolean
  onChange: (v: string) => void
}) {
  const isLongText = setting.key === "landingHeadline"
  const preview = computedPreview(setting.key, value)
  const hint = extraHint(setting.key, value)

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isDirty
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={`setting-${setting.key}`}
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            {setting.label}
            {isDirty && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
              >
                sin guardar
              </Badge>
            )}
          </Label>
          {setting.help && (
            <p className="text-xs text-muted-foreground mt-1">{setting.help}</p>
          )}
          {hint && (
            <p className="text-xs text-muted-foreground/90 mt-0.5 italic">
              {hint}
            </p>
          )}
          {preview && (
            <p className="text-[11px] text-gradient-solana font-medium mt-1.5">
              {preview}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 md:w-72 md:flex-none">
          {setting.type === "boolean" ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-background/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {value === "true" ? "Activado" : "Desactivado"}
              </span>
              <Switch
                id={`setting-${setting.key}`}
                checked={value === "true"}
                onCheckedChange={(c) => onChange(c ? "true" : "false")}
              />
            </div>
          ) : setting.type === "number" ? (
            <div className="relative">
              <Input
                id={`setting-${setting.key}`}
                type="number"
                value={value}
                min={setting.min ?? undefined}
                max={setting.max ?? undefined}
                step="any"
                onChange={(e) => onChange(e.target.value)}
                className="pr-16"
              />
              {(setting.min || setting.max) && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                  {setting.min && setting.max
                    ? `${setting.min}–${setting.max}`
                    : setting.min
                      ? `≥ ${setting.min}`
                      : `≤ ${setting.max}`}
                </span>
              )}
            </div>
          ) : isLongText ? (
            <Textarea
              id={`setting-${setting.key}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={2}
              className="resize-none"
            />
          ) : (
            <Input
              id={`setting-${setting.key}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Advertiser Plan Dialog (create / edit)
// ---------------------------------------------------------------------------

type AdvertiserPlanForm = {
  code: string
  name: string
  viewsIncluded: number
  priceKnight: number
  viewSeconds: number
  feedPriority: number
  diamondCount: number
  badgeColor: string
  description: string
  isPermanent: boolean
  isActive: boolean
}

function emptyAdvertiserPlanForm(): AdvertiserPlanForm {
  return {
    code: "",
    name: "",
    viewsIncluded: 1000,
    priceKnight: 1,
    viewSeconds: 10,
    feedPriority: 100,
    diamondCount: 1,
    badgeColor: "amber",
    description: "",
    isPermanent: false,
    isActive: true,
  }
}

function AdvertiserPlanDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: "create" | "edit"
  initial?: AdvertiserPlan
  onSaved: () => void
}) {
  const [form, setForm] = useState<AdvertiserPlanForm>(emptyAdvertiserPlanForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setForm({
          code: initial.code,
          name: initial.name,
          viewsIncluded: initial.viewsIncluded,
          priceKnight: initial.priceKnight,
          viewSeconds: initial.viewSeconds,
          feedPriority: initial.feedPriority,
          diamondCount: initial.diamondCount,
          badgeColor: initial.badgeColor,
          description: initial.description,
          isPermanent: initial.isPermanent,
          isActive: initial.isActive,
        })
      } else {
        setForm(emptyAdvertiserPlanForm())
      }
    }
  }, [open, mode, initial])

  const set = <K extends keyof AdvertiserPlanForm>(
    k: K,
    v: AdvertiserPlanForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Código y nombre son obligatorios")
      return
    }
    if (form.viewsIncluded <= 0) {
      toast.error("Las vistas incluidas deben ser > 0")
      return
    }
    // Clamp diamondCount to 1-5
    const clampedDiamonds = Math.max(1, Math.min(5, Math.round(form.diamondCount)))
    const payload = { ...form, diamondCount: clampedDiamonds }
    setSaving(true)
    try {
      const body = { ...payload, actor: ACTOR }
      if (mode === "create") {
        const res = await fetch("/api/plans/advertiser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Error al crear plan")
        toast.success(`Plan "${form.name}" creado correctamente`)
      } else if (initial) {
        const res = await fetch("/api/plans/advertiser", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, data: payload, actor: ACTOR }),
        })
        if (!res.ok) throw new Error("Error al actualizar plan")
        toast.success(`Plan "${form.name}" actualizado`)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error("No se pudo guardar el plan", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-amber-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold flex items-center gap-2">
            <Sparkles className="size-5" />
            {mode === "create" ? "Nuevo Plan de Anunciante" : "Editar Plan de Anunciante"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define un nuevo paquete de vistas para anunciantes."
              : "Modifica los parámetros del plan seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Código" hint="Identificador único en snake_case">
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              disabled={mode === "edit"}
              placeholder="ej: medio"
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ej: Medio"
            />
          </Field>
          <Field label="Vistas incluidas" unit="vistas">
            <Input
              type="number"
              min={1}
              value={form.viewsIncluded}
              onChange={(e) => set("viewsIncluded", Number(e.target.value))}
            />
          </Field>
          <Field label="Precio" unit="$Kn">
            <Input
              type="number"
              min={0}
              step="any"
              value={form.priceKnight}
              onChange={(e) => set("priceKnight", Number(e.target.value))}
            />
          </Field>
          <Field label="Duración de vista" unit="segundos">
            <Input
              type="number"
              min={1}
              value={form.viewSeconds}
              onChange={(e) => set("viewSeconds", Number(e.target.value))}
            />
          </Field>
          <Field label="Prioridad en feed" hint="Mayor = aparece antes">
            <Input
              type="number"
              min={1}
              value={form.feedPriority}
              onChange={(e) => set("feedPriority", Number(e.target.value))}
            />
          </Field>
          <Field label="Diamantes (1-5)" hint="Nivel visual del plan mostrado a usuarios">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={5}
                step={1}
                value={form.diamondCount}
                onChange={(e) => set("diamondCount", Number(e.target.value))}
                className="w-24"
              />
              <PlanDiamonds count={form.diamondCount} size={16} showLabel={false} />
            </div>
          </Field>
          <Field label="Color de insignia">
            <Select
              value={form.badgeColor}
              onValueChange={(v) => set("badgeColor", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BADGE_COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-3 rounded-full border",
                          badgeClass(c),
                        )}
                      />
                      {c}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 w-full">
              <Label className="text-xs">Plan permanente</Label>
              <Switch
                checked={form.isPermanent}
                onCheckedChange={(c) => set("isPermanent", c)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 w-full">
              <Label className="text-xs">Activo</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => set("isActive", c)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descripción comercial del plan"
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button variant="ghost" disabled={saving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "create" ? "Crear plan" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Visitor Plan Dialog (create / edit)
// ---------------------------------------------------------------------------

type VisitorPlanForm = {
  code: string
  name: string
  costKnight: number
  durationDays: number
  multiplier: number
  dailyViewsLimit: number
  feedPriority: number
  badgeColor: string
  description: string
  isDefault: boolean
  isActive: boolean
}

function emptyVisitorPlanForm(): VisitorPlanForm {
  return {
    code: "",
    name: "",
    costKnight: 0,
    durationDays: 15,
    multiplier: 1.0,
    dailyViewsLimit: 0,
    feedPriority: 100,
    badgeColor: "slate",
    description: "",
    isDefault: false,
    isActive: true,
  }
}

function VisitorPlanDialog({
  open,
  onOpenChange,
  mode,
  initial,
  otherPlans,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: "create" | "edit"
  initial?: VisitorPlan
  otherPlans: VisitorPlan[]
  onSaved: () => void
}) {
  const [form, setForm] = useState<VisitorPlanForm>(emptyVisitorPlanForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setForm({
          code: initial.code,
          name: initial.name,
          costKnight: initial.costKnight,
          durationDays: initial.durationDays,
          multiplier: initial.multiplier,
          dailyViewsLimit: initial.dailyViewsLimit,
          feedPriority: initial.feedPriority,
          badgeColor: initial.badgeColor,
          description: initial.description,
          isDefault: initial.isDefault,
          isActive: initial.isActive,
        })
      } else {
        setForm(emptyVisitorPlanForm())
      }
    }
  }, [open, mode, initial])

  const set = <K extends keyof VisitorPlanForm>(
    k: K,
    v: VisitorPlanForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }))

  // Only one plan can be default. We just warn — backend enforces too.
  const otherDefaultExists = otherPlans.some(
    (p) => p.isDefault && (!initial || p.id !== initial.id),
  )

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Código y nombre son obligatorios")
      return
    }
    setSaving(true)
    try {
      const body = { ...form, actor: ACTOR }
      if (mode === "create") {
        const res = await fetch("/api/plans/visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Error al crear plan")
        toast.success(`Plan "${form.name}" creado correctamente`)
      } else if (initial) {
        const res = await fetch("/api/plans/visitor", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, data: form, actor: ACTOR }),
        })
        if (!res.ok) throw new Error("Error al actualizar plan")
        toast.success(`Plan "${form.name}" actualizado`)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error("No se pudo guardar el plan", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-amber-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-solana flex items-center gap-2">
            <Users className="size-5" />
            {mode === "create" ? "Nuevo Plan de Visitante" : "Editar Plan de Visitante"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define un nuevo plan de multiplicador para visitantes."
              : "Modifica los parámetros del plan seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Código" hint="Identificador único en snake_case">
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              disabled={mode === "edit"}
              placeholder="ej: gold"
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ej: Gold"
            />
          </Field>
          <Field label="Coste" unit="$Kn">
            <Input
              type="number"
              min={0}
              step="any"
              value={form.costKnight}
              onChange={(e) => set("costKnight", Number(e.target.value))}
            />
          </Field>
          <Field label="Duración" unit="días (0 = permanente)">
            <Input
              type="number"
              min={0}
              value={form.durationDays}
              onChange={(e) => set("durationDays", Number(e.target.value))}
            />
          </Field>
          <Field label="Multiplicador" unit="×N">
            <Input
              type="number"
              min={1}
              step="0.1"
              value={form.multiplier}
              onChange={(e) => set("multiplier", Number(e.target.value))}
            />
          </Field>
          <Field label="Límite diario de vistas" unit="0 = ilimitado">
            <Input
              type="number"
              min={0}
              value={form.dailyViewsLimit}
              onChange={(e) => set("dailyViewsLimit", Number(e.target.value))}
            />
          </Field>
          <Field label="Prioridad en feed" hint="Mayor = aparece antes">
            <Input
              type="number"
              min={1}
              value={form.feedPriority}
              onChange={(e) => set("feedPriority", Number(e.target.value))}
            />
          </Field>
          <Field label="Color de insignia">
            <Select
              value={form.badgeColor}
              onValueChange={(v) => set("badgeColor", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BADGE_COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-3 rounded-full border",
                          badgeClass(c),
                        )}
                      />
                      {c}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descripción comercial del plan"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 w-full">
              <Label className="text-xs flex items-center gap-1">
                Plan por defecto
                {otherDefaultExists && form.isDefault && (
                  <span className="text-[10px] text-amber-300">
                    (reemplazará al actual)
                  </span>
                )}
              </Label>
              <Switch
                checked={form.isDefault}
                onCheckedChange={(c) => set("isDefault", c)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 w-full">
              <Label className="text-xs">Activo</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => set("isActive", c)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button variant="ghost" disabled={saving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-solana text-white hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "create" ? "Crear plan" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Generic field wrapper (label + optional unit + children)
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  unit,
  children,
}: {
  label: string
  hint?: string
  unit?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-foreground">{label}</Label>
        {unit && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Side-rail Ad Dialog (create / edit) — manages the lateral banner ads
// ---------------------------------------------------------------------------

type SideAdForm = {
  position: "left" | "right"
  title: string
  content: string
  link: string
  imageUrl: string
  bgColor: string
  order: number
  isActive: boolean
}

function emptySideAdForm(): SideAdForm {
  return {
    position: "left",
    title: "",
    content: "",
    link: "#",
    imageUrl: "",
    bgColor: "amber",
    order: 0,
    isActive: true,
  }
}

function SideAdDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: "create" | "edit"
  initial?: SideAd
  onSaved: () => void
}) {
  const [form, setForm] = useState<SideAdForm>(emptySideAdForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setForm({
          position: initial.position,
          title: initial.title,
          content: initial.content,
          link: initial.link,
          imageUrl: initial.imageUrl ?? "",
          bgColor: initial.bgColor,
          order: initial.order,
          isActive: initial.isActive,
        })
      } else {
        setForm(emptySideAdForm())
      }
    }
  }, [open, mode, initial])

  const set = <K extends keyof SideAdForm>(
    k: K,
    v: SideAdForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    setSaving(true)
    try {
      const payload = {
        position: form.position,
        title: form.title.trim(),
        content: form.content,
        link: form.link || "#",
        imageUrl: form.imageUrl.trim() || null,
        bgColor: form.bgColor,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      }
      if (mode === "create") {
        const res = await fetch("/api/side-ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, actor: ACTOR }),
        })
        if (!res.ok) throw new Error("Error al crear anuncio lateral")
        toast.success(`Anuncio lateral "${form.title}" creado`)
      } else if (initial) {
        const res = await fetch("/api/side-ads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, data: payload, actor: ACTOR }),
        })
        if (!res.ok) throw new Error("Error al actualizar anuncio lateral")
        toast.success(`Anuncio lateral "${form.title}" actualizado`)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error("No se pudo guardar el anuncio", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-amber-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold flex items-center gap-2">
            <Columns2 className="size-5" />
            {mode === "create" ? "Nuevo Anuncio Lateral" : "Editar Anuncio Lateral"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Configura un banner para el riel lateral izquierdo o derecho."
              : "Modifica los parámetros del anuncio lateral seleccionado."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Posición" hint="Riel donde se mostrará">
            <Select
              value={form.position}
              onValueChange={(v) => set("position", v as "left" | "right")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Color de fondo" hint="Color del banner en el riel">
            <Select
              value={form.bgColor}
              onValueChange={(v) => set("bgColor", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIDE_AD_BG_COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-3 rounded-full border",
                          badgeClass(c),
                        )}
                      />
                      {c}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Título" hint="Texto destacado del banner">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="ej: Promoción Solana Summer"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Contenido" hint="Cuerpo del anuncio (máx 1-2 líneas)">
              <Textarea
                rows={3}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Descripción breve del producto o promoción"
              />
            </Field>
          </div>
          <Field label="Enlace" hint="URL de destino al hacer clic">
            <Input
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Imagen (URL)" hint="Opcional — imagen del banner">
            <Input
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://.../banner.png"
            />
          </Field>
          <Field label="Orden" hint="Menor = aparece primero">
            <Input
              type="number"
              min={0}
              step={1}
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value))}
              className="w-24"
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 w-full sm:max-w-xs">
            <Label className="text-xs">Activo</Label>
            <Switch
              checked={form.isActive}
              onCheckedChange={(c) => set("isActive", c)}
            />
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button variant="ghost" disabled={saving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-gold text-primary-foreground gap-1.5"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "create" ? "Crear anuncio" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Stats tile (treasury tab)
// ---------------------------------------------------------------------------

function StatTile({
  icon,
  label,
  value,
  sub,
  accent = "gold",
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: "gold" | "solana"
}) {
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
            accent === "gold"
              ? "bg-gradient-gold text-primary-foreground"
              : "bg-gradient-solana text-white",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold text-foreground truncate">
            {value}
          </p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Treasury sub-account card
// ---------------------------------------------------------------------------

function TreasuryCard({
  account,
  onSaved,
}: {
  account: TreasuryAccount
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(String(account.balance))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(String(account.balance))
  }, [account.balance])

  const save = async () => {
    const n = Number(draft)
    if (Number.isNaN(n)) {
      toast.error("Saldo inválido")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/treasury", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, balance: n, actor: ACTOR }),
      })
      if (!res.ok) throw new Error("Error al ajustar saldo")
      toast.success(`${account.code} ajustado a ${n} $Kn`)
      setEditing(false)
      onSaved()
    } catch (e) {
      toast.error("No se pudo ajustar el saldo", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const color = TREASURY_COLORS[account.color] ?? TREASURY_COLORS.slate

  return (
    <Card
      className="glass overflow-hidden"
      style={{ boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold"
              style={{ background: `${color}22`, color }}
            >
              {account.code}
            </span>
            <CardTitle className="text-sm font-semibold">
              {account.name}
            </CardTitle>
          </div>
          <Badge variant="outline" className={badgeClass(account.color)}>
            {account.code}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {account.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color }}
          >
            {formatNumber(account.balance)}
          </span>
          <span className="text-xs text-muted-foreground">$Kn</span>
        </div>

        {editing ? (
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              step="any"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8"
            />
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="bg-gradient-gold text-primary-foreground h-8"
            >
              {saving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Save className="size-3" />
              )}
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setDraft(String(account.balance))
                setEditing(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 h-8"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3" />
            Ajustar saldo
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Login test dialog — simulates the 2-step admin login flow
// ---------------------------------------------------------------------------

type LoginTestStep = "credentials" | "mfa" | "success"

function LoginTestDialog({
  open,
  onOpenChange,
  defaultUsername,
  mfaLabel,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultUsername: string
  mfaLabel: string
}) {
  const [step, setStep] = useState<LoginTestStep>("credentials")
  const [testUser, setTestUser] = useState("")
  const [testPass, setTestPass] = useState("")
  const [testSecret, setTestSecret] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [grantedActor, setGrantedActor] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep("credentials")
      setTestUser(defaultUsername || "")
      setTestPass("")
      setTestSecret("")
      setGrantedActor(null)
    }
  }, [open, defaultUsername])

  const submitCreds = async () => {
    if (!testUser.trim() || !testPass) {
      toast.error("Introduce usuario y contraseña (paso 1)")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "credentials",
          username: testUser.trim(),
          password: testPass,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error("Credenciales incorrectas (paso 1)", {
          description: data?.error ?? undefined,
        })
        return
      }
      if (data.mfaRequired) {
        toast.success("Paso 1 superado. Ahora introduce el código 2FA.")
        setStep("mfa")
      } else {
        toast.success("Login correcto (sin 2FA)")
        setGrantedActor(data.actor ?? testUser.trim())
        setStep("success")
      }
    } catch (e) {
      toast.error("No se pudo verificar", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitMfa = async () => {
    if (!testSecret.trim()) {
      toast.error("Introduce el código 2FA (paso 2)")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "mfa",
          username: testUser.trim(),
          secretCode: testSecret.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error("Código 2FA incorrecto (paso 2)", {
          description: data?.error ?? undefined,
        })
        return
      }
      toast.success(`Login verificado como ${data.actor ?? testUser.trim()}`)
      setGrantedActor(data.actor ?? testUser.trim())
      setStep("success")
    } catch (e) {
      toast.error("No se pudo verificar", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-amber-500/40 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Probar flujo de login (2 pasos)
          </DialogTitle>
          <DialogDescription>
            Simula el acceso real al Centro de Administración. No cierra tu
            sesión actual.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "border-amber-500/40",
              step === "credentials"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-emerald-500/10 text-emerald-300",
            )}
          >
            {step === "credentials" ? "1. Credenciales" : "✓ Credenciales"}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge
            variant="outline"
            className={cn(
              "border-violet-500/40",
              step === "mfa"
                ? "bg-violet-500/15 text-violet-300"
                : step === "success"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {step === "success" ? "✓ 2FA" : "2. Código 2FA"}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge
            variant="outline"
            className={cn(
              "border-emerald-500/40",
              step === "success"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            Acceso
          </Badge>
        </div>

        {step === "credentials" && (
          <div className="flex flex-col gap-3 py-2">
            <Field label="Usuario" hint="Identificador configurado">
              <Input
                value={testUser}
                onChange={(e) => setTestUser(e.target.value)}
                placeholder="admin"
              />
            </Field>
            <Field label="Contraseña" hint="La contraseña configurada">
              <Input
                type="password"
                value={testPass}
                onChange={(e) => setTestPass(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitCreds()
                }}
              />
            </Field>
            <DialogFooter className="gap-2 mt-2">
              <DialogClose asChild>
                <Button variant="ghost" disabled={submitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={submitCreds}
                disabled={submitting}
                className="bg-gradient-gold text-primary-foreground gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                Verificar credenciales
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "mfa" && (
          <div className="flex flex-col gap-3 py-2">
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-xs text-violet-200/90 flex items-start gap-2">
              <ShieldCheck className="size-4 text-violet-300 shrink-0 mt-0.5" />
              <span>
                <strong>{mfaLabel || "Knight Admin MFA"}</strong> — introduce
                el código 2FA configurado.
              </span>
            </div>
            <Field
              label="Código 2FA"
              hint="Letras y números. Sensible a mayúsculas (se normaliza)."
            >
              <Input
                value={testSecret}
                onChange={(e) =>
                  setTestSecret(e.target.value.toUpperCase())
                }
                placeholder="ABCDEFGH"
                className="font-mono uppercase tracking-widest"
                maxLength={12}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitMfa()
                }}
              />
            </Field>
            <DialogFooter className="gap-2 mt-2">
              <DialogClose asChild>
                <Button variant="ghost" disabled={submitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={submitMfa}
                disabled={submitting}
                className="bg-gradient-gold text-primary-foreground gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Verificar 2FA
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40">
              <CheckCircle2 className="size-7 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-200/90">
                Login verificado correctamente
              </p>
              {grantedActor && (
                <p className="text-xs text-muted-foreground mt-1">
                  Acceso concedido como{" "}
                  <span className="font-mono">{grantedActor}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                El flujo de 2 pasos está funcionando. Próximo cierre de sesión,
                usa estos valores para volver a entrar.
              </p>
            </div>
            <DialogClose asChild>
              <Button className="bg-gradient-gold text-primary-foreground gap-1.5">
                <Lock className="size-4" />
                Cerrar
              </Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Credentials tab — admin login + 2FA management
// ---------------------------------------------------------------------------

type AdminCredsForm = {
  username: string
  password: string
  secretCode: string
  mfaLabel: string
}

// Generate a random 8-char alphanumeric code (no ambiguous chars).
function randomSecretCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const arr = new Uint32Array(len)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 0xffffffff)
  }
  let s = ""
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length]
  return s
}

function CredentialsTab() {
  const [form, setForm] = useState<AdminCredsForm>({
    username: "",
    password: "",
    secretCode: "",
    mfaLabel: "Knight Admin MFA",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<AdminCredentialConfig | null>(null)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  const loadCreds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/admin")
      if (!res.ok) throw new Error("Error al cargar credenciales")
      const data: AdminCredentialConfig = await res.json()
      setStatus(data)
      setForm((f) => ({
        ...f,
        username: data.username ?? f.username,
        mfaLabel: data.mfaLabel ?? f.mfaLabel,
        password: "",
        secretCode: "",
      }))
    } catch (e) {
      toast.error("No se pudieron cargar las credenciales", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount (= tab activation; shadcn TabsContent unmounts inactive).
  useEffect(() => {
    void loadCreds()
  }, [loadCreds])

  const set = <K extends keyof AdminCredsForm>(
    k: K,
    v: AdminCredsForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }))

  const generateSecret = () => {
    set("secretCode", randomSecretCode(8))
    setShowSecret(true)
    toast.success("Código 2FA aleatorio generado")
  }

  const save = async () => {
    if (!form.username.trim()) {
      toast.error("El usuario administrador es obligatorio")
      return
    }
    const secret = form.secretCode.trim()
    if (secret && (secret.length < 6 || secret.length > 12)) {
      toast.error("El código 2FA debe tener entre 6 y 12 caracteres")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, string> = {
        username: form.username.trim(),
        mfaLabel: form.mfaLabel.trim() || "Knight Admin MFA",
        actor: ACTOR,
      }
      if (form.password.trim()) body.password = form.password
      if (secret) body.secretCode = secret.toUpperCase()
      const res = await fetch("/api/auth/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Error al guardar credenciales")
      }
      toast.success(
        "Credenciales actualizadas. Próximo login usará estos valores.",
      )
      setForm((f) => ({ ...f, password: "", secretCode: "" }))
      await loadCreds()
    } catch (e) {
      toast.error("No se pudieron guardar las credenciales", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const canTest = !!status?.configured

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass-strong border-amber-500/40 glow-gold">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-amber-400" />
            <CardTitle className="text-gradient-gold">
              Credenciales Admin
            </CardTitle>
          </div>
          <CardDescription>
            Acceso al Centro de Administración. La autenticación es de dos
            pasos: (1) usuario + contraseña, (2) código 2FA de letras y
            números. Configura ambos aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Security warning */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-3">
            <ShieldCheck className="size-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90">
              <strong>Mantén el código 2FA en privado.</strong> Es la segunda
              barrera de acceso: si alguien obtiene tu contraseña, no podrá
              entrar sin este código. Cámbialo periódicamente.
            </p>
          </div>

          {/* Status badges */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando configuración actual…
            </div>
          ) : status ? (
            <div className="flex flex-wrap items-center gap-2">
              {status.configured ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                >
                  <CheckCircle2 className="size-3" />
                  Credenciales configuradas
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-rose-500/40 bg-rose-500/10 text-rose-300"
                >
                  <XCircle className="size-3" />
                  Sin credenciales todavía
                </Badge>
              )}
              {status.hasPassword && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                >
                  <KeyRound className="size-3" />
                  Contraseña establecida
                </Badge>
              )}
              {status.hasSecret && (
                <Badge
                  variant="outline"
                  className="border-violet-500/40 bg-violet-500/10 text-violet-300"
                >
                  <ShieldCheck className="size-3" />
                  2FA establecido
                </Badge>
              )}
              {status.username && (
                <span className="text-xs text-muted-foreground ml-1">
                  Usuario actual:{" "}
                  <span className="font-mono text-foreground">
                    {status.username}
                  </span>
                  {status.mfaLabel
                    ? ` · Etiqueta MFA: ${status.mfaLabel}`
                    : ""}
                </span>
              )}
            </div>
          ) : null}

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Usuario administrador"
              hint="Requerido. Identificador de acceso."
            >
              <Input
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="admin"
              />
            </Field>
            <Field
              label="Etiqueta MFA"
              hint="Texto mostrado en el modal de 2FA del login."
            >
              <Input
                value={form.mfaLabel}
                onChange={(e) => set("mfaLabel", e.target.value)}
                placeholder="Knight Admin MFA"
              />
            </Field>
            <Field
              label="Contraseña"
              hint="Déjala en blanco para mantener la actual."
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={
                    status?.hasPassword
                      ? "•••••••• (establecida)"
                      : "Nueva contraseña"
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            <Field
              label="Código 2FA (letras y números)"
              hint="6-12 caracteres. Se pide en el paso 2 del login."
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={form.secretCode}
                    onChange={(e) =>
                      set("secretCode", e.target.value.toUpperCase())
                    }
                    placeholder={
                      status?.hasSecret
                        ? "•••••••• (establecido)"
                        : "Código 2FA"
                    }
                    className="pr-10 font-mono uppercase tracking-widest"
                    maxLength={12}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showSecret ? "Ocultar código" : "Mostrar código"
                    }
                  >
                    {showSecret ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSecret}
                  className="gap-1.5 shrink-0"
                  aria-label="Generar código aleatorio"
                >
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Generar</span>
                </Button>
              </div>
            </Field>
          </div>

          {/* Login flow preview */}
          <Card className="glass border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="size-4 text-amber-400" />
                Vista previa del flujo de login:
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              <ol className="flex flex-col gap-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-primary-foreground shrink-0">
                    1
                  </span>
                  <span>
                    El admin introduce{" "}
                    <strong className="text-foreground">usuario</strong> y{" "}
                    <strong className="text-foreground">contraseña</strong>. Si
                    son correctos, se solicita el código 2FA.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-primary-foreground shrink-0">
                    2
                  </span>
                  <span>
                    El admin introduce el{" "}
                    <strong className="text-foreground">código 2FA</strong> (
                    {form.mfaLabel || "Knight Admin MFA"}). Si coincide, se
                    concede acceso al Centro de Administración.
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => setLoginDialogOpen(true)}
            className="gap-1.5"
            disabled={!canTest}
            title={
              canTest
                ? "Simula el login de 2 pasos"
                : "Guarda credenciales primero para habilitar el test"
            }
          >
            <ShieldCheck className="size-4" />
            Probar flujo de login
          </Button>
          <Button
            onClick={save}
            disabled={saving || loading}
            className="bg-gradient-gold text-primary-foreground gap-1.5"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar credenciales
          </Button>
        </CardFooter>
      </Card>

      <LoginTestDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        defaultUsername={form.username}
        mfaLabel={form.mfaLabel || "Knight Admin MFA"}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profitability card — top of Tesorería tab
// ---------------------------------------------------------------------------

function ProfitabilityCard({
  commissionPercent,
  visitorRewardPercent,
  maxMultiplier,
}: {
  commissionPercent: number
  visitorRewardPercent: number
  maxMultiplier: number
}) {
  const commission = Number.isFinite(commissionPercent) ? commissionPercent : 0
  const reward = Number.isFinite(visitorRewardPercent)
    ? visitorRewardPercent
    : 0
  const mult = Number.isFinite(maxMultiplier) && maxMultiplier > 0
    ? maxMultiplier
    : 1

  return (
    <Card className="glass border-amber-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-gradient-gold text-base">
          <Gauge className="size-4 text-amber-400" />
          Rentabilidad de la Plataforma
        </CardTitle>
        <CardDescription>
          Cómo se reparte el ingreso por cada paquete vendido y por qué la
          plataforma sigue siendo rentable.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-300"
          >
            Comisión: {commission}%
          </Badge>
          <Badge
            variant="outline"
            className="border-sky-500/40 bg-sky-500/10 text-sky-300"
          >
            Reward: {reward}%
          </Badge>
          <Badge
            variant="outline"
            className="border-violet-500/40 bg-violet-500/10 text-violet-300"
          >
            Multiplicador máx: ×{mult}
          </Badge>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-200/90 flex items-start gap-2">
          <CheckCircle2 className="size-4 text-emerald-300 shrink-0 mt-0.5" />
          <span>
            Con la configuración actual, la plataforma es rentable: cada paquete
            deja un margen neto positivo incluso con el multiplicador máximo
            activo.
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
            <Hash className="size-3 text-amber-400" />
            Fórmula:
          </p>
          <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
            Ingreso = Precio × {commission}% (comisión)
            <span className="mx-2 text-amber-400/70">|</span>
            Costo = Precio × {reward}% × multiplicador
            <span className="mx-2 text-amber-400/70">|</span>
            Margen = Ingreso − Costo
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main AdminPortal component
// ---------------------------------------------------------------------------

export default function AdminPortal() {
  // ---- data state ----
  const [settings, setSettings] = useState<Setting[]>([])
  const [advertiserPlans, setAdvertiserPlans] = useState<AdvertiserPlan[]>([])
  const [visitorPlans, setVisitorPlans] = useState<VisitorPlan[]>([])
  const [treasury, setTreasury] = useState<TreasuryAccount[]>([])
  const [sideAds, setSideAds] = useState<SideAd[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // ---- ui state ----
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState<Map<string, string>>(new Map())
  const [savingSettings, setSavingSettings] = useState(false)
  const [tab, setTab] = useState("config")

  // ---- dialog state (advertiser) ----
  const [advDialogOpen, setAdvDialogOpen] = useState(false)
  const [advDialogMode, setAdvDialogMode] = useState<"create" | "edit">("create")
  const [advEditing, setAdvEditing] = useState<AdvertiserPlan | undefined>()

  // ---- dialog state (visitor) ----
  const [visDialogOpen, setVisDialogOpen] = useState(false)
  const [visDialogMode, setVisDialogMode] = useState<"create" | "edit">("create")
  const [visEditing, setVisEditing] = useState<VisitorPlan | undefined>()

  // ---- dialog state (side-ads) ----
  const [sideAdDialogOpen, setSideAdDialogOpen] = useState(false)
  const [sideAdDialogMode, setSideAdDialogMode] = useState<"create" | "edit">("create")
  const [sideAdEditing, setSideAdEditing] = useState<SideAd | undefined>()

  // ---- fetchers ----
  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/config")
    if (!res.ok) throw new Error("Error al cargar configuración")
    const data = await res.json()
    setSettings(data.settings ?? [])
    setAdvertiserPlans(data.advertiserPlans ?? [])
    setVisitorPlans(data.visitorPlans ?? [])
    setTreasury(data.treasury ?? [])
  }, [])

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats")
    if (!res.ok) return
    const data = await res.json()
    setStats(data as PlatformStats)
  }, [])

  const fetchSideAds = useCallback(async () => {
    const res = await fetch("/api/side-ads?all=1")
    if (!res.ok) return
    const data = await res.json()
    setSideAds(data.ads ?? [])
  }, [])

  const fetchAudit = useCallback(async () => {
    const res = await fetch("/api/audit?limit=50")
    if (!res.ok) return
    const data = await res.json()
    setAuditLogs(data.logs ?? [])
  }, [])

  // ---- initial mount ----
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        await Promise.all([fetchConfig(), fetchStats(), fetchAudit()])
      } catch (e) {
        toast.error("No se pudo cargar el portal", {
          description: e instanceof Error ? e.message : undefined,
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [fetchConfig, fetchStats, fetchAudit])

  // ---- side-ads: fetch on tab activation ----
  useEffect(() => {
    if (tab === "side-ads") {
      void fetchSideAds()
    }
  }, [tab, fetchSideAds])

  // ---- settings helpers ----
  const getSettingValue = useCallback(
    (key: string, fallback: string): string => {
      const inDirty = dirty.get(key)
      if (inDirty !== undefined) return inDirty
      const s = settings.find((x) => x.key === key)
      return s?.value ?? fallback
    },
    [settings, dirty],
  )

  const visitorRewardPercent = Number(
    getSettingValue("visitorRewardPercent", "40"),
  )

  // Profitability dashboard inputs (read from settings + visitor plans).
  const commissionPercent = Number(
    getSettingValue("commissionPercent", "70"),
  )
  const maxVisitorMultiplier = useMemo(() => {
    if (visitorPlans.length === 0) return 1
    return visitorPlans.reduce(
      (max, p) => (p.multiplier > max ? p.multiplier : max),
      1,
    )
  }, [visitorPlans])

  const onChangeSetting = useCallback((key: string, value: string) => {
    setDirty((prev) => {
      const next = new Map(prev)
      const original = settings.find((s) => s.key === key)?.value
      if (original === value) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      return next
    })
  }, [settings])

  const saveSettings = async () => {
    if (dirty.size === 0) {
      toast.info("No hay cambios pendientes")
      return
    }
    setSavingSettings(true)
    try {
      const body = {
        settings: Object.fromEntries(dirty),
        actor: ACTOR,
      }
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Error al guardar configuración")
      const data = await res.json()
      setSettings(data.settings ?? settings)
      setDirty(new Map())
      toast.success(`${dirty.size} parámetro(s) guardado(s) correctamente`)
    } catch (e) {
      toast.error("No se pudo guardar la configuración", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const resetDefaults = () => {
    setDirty(new Map())
    toast.info("Restablecimiento cancelado", {
      description:
        "Para restablecer valores por defecto contacte al Super Admin con acceso a la seed.",
    })
  }

  // ---- advertiser plan mutations ----
  const openCreateAdv = () => {
    setAdvDialogMode("create")
    setAdvEditing(undefined)
    setAdvDialogOpen(true)
  }
  const openEditAdv = (p: AdvertiserPlan) => {
    setAdvDialogMode("edit")
    setAdvEditing(p)
    setAdvDialogOpen(true)
  }
  const deleteAdv = async (p: AdvertiserPlan) => {
    try {
      const res = await fetch(
        `/api/plans/advertiser?id=${p.id}&actor=${encodeURIComponent(ACTOR)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error("Error al eliminar plan")
      toast.success(`Plan "${p.name}" eliminado`)
      await fetchConfig()
    } catch (e) {
      toast.error("No se pudo eliminar el plan", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  // ---- visitor plan mutations ----
  const openCreateVis = () => {
    setVisDialogMode("create")
    setVisEditing(undefined)
    setVisDialogOpen(true)
  }
  const openEditVis = (p: VisitorPlan) => {
    setVisDialogMode("edit")
    setVisEditing(p)
    setVisDialogOpen(true)
  }
  const deleteVis = async (p: VisitorPlan) => {
    try {
      const res = await fetch(
        `/api/plans/visitor?id=${p.id}&actor=${encodeURIComponent(ACTOR)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error("Error al eliminar plan")
      toast.success(`Plan "${p.name}" eliminado`)
      await fetchConfig()
    } catch (e) {
      toast.error("No se pudo eliminar el plan", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  // ---- side-ad mutations ----
  const openCreateSideAd = () => {
    setSideAdDialogMode("create")
    setSideAdEditing(undefined)
    setSideAdDialogOpen(true)
  }
  const openEditSideAd = (a: SideAd) => {
    setSideAdDialogMode("edit")
    setSideAdEditing(a)
    setSideAdDialogOpen(true)
  }
  const deleteSideAd = async (a: SideAd) => {
    try {
      const res = await fetch(
        `/api/side-ads?id=${a.id}&actor=${encodeURIComponent(ACTOR)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error("Error al eliminar anuncio lateral")
      toast.success(`Anuncio lateral "${a.title}" eliminado`)
      await fetchSideAds()
      await fetchAudit()
    } catch (e) {
      toast.error("No se pudo eliminar el anuncio", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }
  const toggleSideAdActive = async (a: SideAd) => {
    const next = !a.isActive
    try {
      const res = await fetch("/api/side-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: a.id,
          data: { isActive: next },
          actor: ACTOR,
        }),
      })
      if (!res.ok) throw new Error("Error al cambiar estado")
      toast.success(
        `Anuncio "${a.title}" ${next ? "activado" : "desactivado"}`,
      )
      await fetchSideAds()
    } catch (e) {
      toast.error("No se pudo actualizar el estado", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  // ---- derived ----
  const groupedSettings = useMemo(() => {
    return Object.entries(SETTING_CATEGORIES).map(([key, meta]) => ({
      key,
      meta,
      items: settings.filter((s) => s.category === key),
    }))
  }, [settings])

  const treasuryTotal = useMemo(
    () => treasury.reduce((s, a) => s + a.balance, 0),
    [treasury],
  )

  const treasuryChartData = useMemo(
    () =>
      treasury.map((a) => ({
        name: `${a.code} · ${a.name}`,
        value: a.balance,
        color: TREASURY_COLORS[a.color] ?? TREASURY_COLORS.slate,
      })),
    [treasury],
  )

  // ---- loading state ----
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-amber-400" />
          <p className="text-sm text-muted-foreground">
            Cargando portal de administración…
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-gradient-gold tracking-tight">
                Portal de Administración
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Centro de control absoluto de la plataforma Knight Ads. Cada
              parámetro es configurable sin tocar código.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-300"
            >
              <ShieldAlert className="size-3" />
              {ACTOR}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            >
              <CheckCircle2 className="size-3" />
              Guardado automático
            </Badge>
            {dirty.size > 0 && (
              <Badge
                variant="outline"
                className="border-rose-500/40 bg-rose-500/10 text-rose-300"
              >
                <XCircle className="size-3" />
                {dirty.size} cambio{dirty.size === 1 ? "" : "s"} sin guardar
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <TabsList className="h-auto flex w-max gap-1 rounded-xl glass p-1">
              <TabsTrigger value="credentials" className="gap-1.5 rounded-lg">
                <Lock className="size-3.5" />
                Credenciales Admin
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-1.5 rounded-lg">
                <SettingsIcon className="size-3.5" />
                Configuración Global
              </TabsTrigger>
              <TabsTrigger value="advertiser" className="gap-1.5 rounded-lg">
                <CircleDollarSign className="size-3.5" />
                Planes de Anunciantes
              </TabsTrigger>
              <TabsTrigger value="visitor" className="gap-1.5 rounded-lg">
                <Users className="size-3.5" />
                Planes de Visitantes
              </TabsTrigger>
              <TabsTrigger value="treasury" className="gap-1.5 rounded-lg">
                <Wallet className="size-3.5" />
                Tesorería
              </TabsTrigger>
              <TabsTrigger value="side-ads" className="gap-1.5 rounded-lg">
                <Columns2 className="size-3.5" />
                Anuncios Laterales
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 rounded-lg">
                <ScrollText className="size-3.5" />
                Auditoría & Transparencia
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============== TAB 0: Credenciales Admin ============== */}
          <TabsContent value="credentials" className="mt-4">
            <CredentialsTab />
          </TabsContent>

          {/* ============== TAB 1: Configuración Global ============== */}
          <TabsContent value="config" className="mt-4">
            <div className="flex flex-col gap-6">
              {groupedSettings.map(({ key, meta, items }) => {
                const Icon = ICONS[meta.icon] ?? SettingsIcon
                return (
                  <Card key={key} className="glass">
                    <CardHeader>
                      <CategoryHeader
                        icon={<Icon className="size-5 text-primary-foreground" />}
                        label={meta.label}
                        count={items.length}
                      />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Sin parámetros en esta categoría.
                        </p>
                      ) : (
                        items.map((s) => (
                          <SettingRow
                            key={s.key}
                            setting={s}
                            value={getSettingValue(s.key, s.value)}
                            isDirty={dirty.has(s.key)}
                            onChange={(v) => onChangeSetting(s.key, v)}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {/* Sticky save bar */}
              <div className="sticky bottom-4 z-20 mt-8">
                <Card className="glass-strong border-amber-500/40 glow-gold shadow-2xl">
                  <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold text-primary-foreground">
                        <Save className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {dirty.size > 0
                            ? `${dirty.size} cambio${dirty.size === 1 ? "" : "s"} pendiente${dirty.size === 1 ? "" : "s"} de guardado`
                            : "Todos los parámetros están sincronizados"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Los cambios se registran en el log inmutable de
                          auditoría.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={resetDefaults}
                        disabled={dirty.size > 0 || savingSettings}
                        className="gap-1.5"
                      >
                        <RotateCcw className="size-4" />
                        Restablecer a valores por defecto
                      </Button>
                      <Button
                        onClick={saveSettings}
                        disabled={dirty.size === 0 || savingSettings}
                        className="bg-gradient-gold text-primary-foreground gap-1.5"
                      >
                        {savingSettings ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============== TAB 2: Planes de Anunciantes ============== */}
          <TabsContent value="advertiser" className="mt-4">
            <Card className="glass">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gradient-gold">
                    <CircleDollarSign className="size-5" />
                    Planes de Anunciantes
                  </CardTitle>
                  <CardDescription>
                    Paquetes de vistas prepagadas. Cada anuncio publicado se
                    asocia 1:1 con un plan.
                  </CardDescription>
                </div>
                <Button
                  onClick={openCreateAdv}
                  className="bg-gradient-gold text-primary-foreground gap-1.5"
                >
                  <Plus className="size-4" />
                  Crear Plan
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Plan</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="text-right">Vistas</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Duración</TableHead>
                        <TableHead className="text-right">Prioridad</TableHead>
                        <TableHead className="text-right">
                          Reward/vista
                        </TableHead>
                        <TableHead>Insignia</TableHead>
                        <TableHead className="text-center">Perm.</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advertiserPlans.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center text-muted-foreground italic"
                          >
                            No hay planes. Crea el primero.
                          </TableCell>
                        </TableRow>
                      ) : (
                        advertiserPlans.map((p) => {
                          const rewardPerView =
                            p.viewsIncluded > 0
                              ? (p.priceKnight *
                                  (visitorRewardPercent / 100)) /
                                p.viewsIncluded
                              : 0
                          return (
                            <TableRow key={p.id} className="group">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {p.code}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <PlanDiamonds count={p.diamondCount} size={14} showLabel={false} />
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(p.viewsIncluded, 0)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(p.priceKnight)}{" "}
                                <span className="text-[10px] text-muted-foreground">
                                  $Kn
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {p.viewSeconds}
                                <span className="text-[10px] text-muted-foreground">
                                  {" "}
                                  s
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {p.feedPriority}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                <span className="text-gradient-solana font-medium">
                                  {formatNumber(rewardPerView, 4)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {" "}
                                  $Kn
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={badgeClass(p.badgeColor)}
                                >
                                  {p.badgeColor}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {p.isPermanent ? (
                                  <CheckCircle2 className="size-4 inline text-emerald-400" />
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {p.isActive ? (
                                  <CheckCircle2 className="size-4 inline text-emerald-400" />
                                ) : (
                                  <XCircle className="size-4 inline text-rose-400" />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => openEditAdv(p)}
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar</TooltipContent>
                                  </Tooltip>
                                  <AlertDialog>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-rose-400 hover:text-rose-300"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>Eliminar</TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent className="glass-strong">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                          <ShieldAlert className="size-5 text-rose-400" />
                                          Eliminar plan
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          ¿Seguro que deseas eliminar el plan{" "}
                                          <strong>{p.name}</strong> ({p.code})?
                                          Esta acción quedará registrada en el
                                          log inmutable de auditoría.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAdv(p)}
                                          className="bg-rose-600 text-white hover:bg-rose-500"
                                        >
                                          Sí, eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="text-[11px] text-muted-foreground border-t border-border pt-3">
                Reward por vista base = precio × {visitorRewardPercent}% / vistas
                incluidas (configurable en “Reward Visitantes (%)”).
              </CardFooter>
            </Card>

            <AdvertiserPlanDialog
              open={advDialogOpen}
              onOpenChange={setAdvDialogOpen}
              mode={advDialogMode}
              initial={advEditing}
              onSaved={fetchConfig}
            />
          </TabsContent>

          {/* ============== TAB 3: Planes de Visitantes ============== */}
          <TabsContent value="visitor" className="mt-4">
            <Card className="glass">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gradient-solana">
                    <Users className="size-5" />
                    Planes de Visitantes
                  </CardTitle>
                  <CardDescription>
                    Multiplicadores de recompensa con duración configurable.
                  </CardDescription>
                </div>
                <Button
                  onClick={openCreateVis}
                  className="bg-gradient-solana text-white gap-1.5"
                >
                  <Plus className="size-4" />
                  Crear Plan
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Coste</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead className="text-center">Mult.</TableHead>
                        <TableHead className="text-right">
                          Límite diario
                        </TableHead>
                        <TableHead className="text-right">Prioridad</TableHead>
                        <TableHead>Insignia</TableHead>
                        <TableHead className="text-center">Def.</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitorPlans.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="text-center text-muted-foreground italic"
                          >
                            No hay planes. Crea el primero.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visitorPlans.map((p) => (
                          <TableRow key={p.id} className="group">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {p.code}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(p.costKnight)}{" "}
                              <span className="text-[10px] text-muted-foreground">
                                $Kn
                              </span>
                            </TableCell>
                            <TableCell>
                              {p.durationDays === 0 ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                >
                                  Permanente
                                </Badge>
                              ) : (
                                <span className="font-mono">
                                  {p.durationDays}{" "}
                                  <span className="text-[10px] text-muted-foreground">
                                    días
                                  </span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="border-violet-500/40 bg-violet-500/10 text-violet-300"
                              >
                                ×{p.multiplier}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {p.dailyViewsLimit === 0
                                ? "∞"
                                : formatNumber(p.dailyViewsLimit, 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {p.feedPriority}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={badgeClass(p.badgeColor)}
                              >
                                {p.badgeColor}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {p.isDefault ? (
                                <CheckCircle2 className="size-4 inline text-amber-400" />
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {p.isActive ? (
                                <CheckCircle2 className="size-4 inline text-emerald-400" />
                              ) : (
                                <XCircle className="size-4 inline text-rose-400" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => openEditVis(p)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <AlertDialog>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-rose-400 hover:text-rose-300"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Eliminar</TooltipContent>
                                  </Tooltip>
                                  <AlertDialogContent className="glass-strong">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <ShieldAlert className="size-5 text-rose-400" />
                                        Eliminar plan
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Seguro que deseas eliminar el plan{" "}
                                        <strong>{p.name}</strong> ({p.code})?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteVis(p)}
                                        className="bg-rose-600 text-white hover:bg-rose-500"
                                      >
                                        Sí, eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="text-[11px] text-muted-foreground border-t border-border pt-3">
                Solo puede haber un plan por defecto. Al marcar uno, el resto se
                desactiva automáticamente.
              </CardFooter>
            </Card>

            <VisitorPlanDialog
              open={visDialogOpen}
              onOpenChange={setVisDialogOpen}
              mode={visDialogMode}
              initial={visEditing}
              otherPlans={visitorPlans}
              onSaved={fetchConfig}
            />
          </TabsContent>

          {/* ============== TAB 4: Tesorería ============== */}
          <TabsContent value="treasury" className="mt-4">
            <div className="flex flex-col gap-6">
              {/* Profitability dashboard */}
              <ProfitabilityCard
                commissionPercent={commissionPercent}
                visitorRewardPercent={visitorRewardPercent}
                maxMultiplier={maxVisitorMultiplier}
              />

              {/* Stats tiles */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile
                  icon={<Activity className="size-5" />}
                  label="Anuncios totales"
                  value={stats ? formatNumber(stats.totalAds, 0) : "—"}
                  sub={stats ? `${stats.activeAds} activos` : undefined}
                  accent="gold"
                />
                <StatTile
                  icon={<Eye className="size-5" />}
                  label="Vistas servidas"
                  value={stats ? formatNumber(stats.totalViewsServed, 0) : "—"}
                  accent="solana"
                />
                <StatTile
                  icon={<Banknote className="size-5" />}
                  label="Recompensas pagadas"
                  value={
                    stats ? `${formatNumber(stats.totalVisitorRewards)} $Kn` : "—"
                  }
                  accent="solana"
                />
                <StatTile
                  icon={<Users className="size-5" />}
                  label="Usuarios"
                  value={stats ? formatNumber(stats.users, 0) : "—"}
                  sub={
                    stats
                      ? `${stats.pendingWithdrawals} retiros pendientes`
                      : undefined
                  }
                  accent="gold"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Big total + donut */}
                <Card className="glass lg:col-span-1 glow-gold">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="size-5 text-amber-400" />
                      Reserva Total
                    </CardTitle>
                    <CardDescription>
                      Suma de las 7 sub-cuentas de la billetera centralizada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gradient-gold tracking-tight">
                        {formatNumber(treasuryTotal)}
                      </span>
                      <span className="text-sm text-muted-foreground">$Kn</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="h-56 w-full">
                      {treasury.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={treasuryChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {treasuryChartData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <RTooltip
                              contentStyle={{
                                background: "rgba(20,22,30,0.95)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                              formatter={(v: number) =>
                                `${formatNumber(v)} $Kn`
                              }
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sub-account grid */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {treasury.map((a) => (
                      <TreasuryCard
                        key={a.id}
                        account={a}
                        onSaved={async () => {
                          await fetchConfig()
                          await fetchStats()
                          await fetchAudit()
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ============== TAB 5: Anuncios Laterales ============== */}
          <TabsContent value="side-ads" className="mt-4">
            <Card className="glass">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gradient-gold">
                    <Columns2 className="size-5" />
                    Anuncios Laterales
                  </CardTitle>
                  <CardDescription>
                    Banners del riel izquierdo/derecho. Se muestran a los
                    visitantes junto al feed principal.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-sky-500/40 bg-sky-500/10 text-sky-300"
                  >
                    Izq: {sideAds.filter((a) => a.position === "left").length}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-violet-500/40 bg-violet-500/10 text-violet-300"
                  >
                    Der: {sideAds.filter((a) => a.position === "right").length}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  >
                    Activos: {sideAds.filter((a) => a.isActive).length}
                  </Badge>
                  <Button
                    onClick={openCreateSideAd}
                    className="bg-gradient-gold text-primary-foreground gap-1.5"
                  >
                    <Plus className="size-4" />
                    Crear Anuncio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Posición</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Enlace</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="text-right">Orden</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sideAds.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground italic"
                          >
                            No hay anuncios laterales. Crea el primero.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sideAds.map((a) => (
                          <TableRow key={a.id} className="group">
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  a.position === "left"
                                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                                    : "border-violet-500/40 bg-violet-500/10 text-violet-300"
                                }
                              >
                                {a.position === "left" ? "Izquierda" : "Derecha"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[200px]">
                                  {a.title}
                                </span>
                                {a.content && (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                    {a.content}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <a
                                href={a.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 max-w-[180px]"
                                title={a.link}
                              >
                                <ExternalLink className="size-3 shrink-0" />
                                <span className="truncate">{a.link}</span>
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={badgeClass(a.bgColor)}
                              >
                                <span className="size-2 rounded-full bg-current" />
                                {a.bgColor}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {a.order}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={a.isActive}
                                onCheckedChange={() => toggleSideAdActive(a)}
                                aria-label={`Activar/desactivar ${a.title}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => openEditSideAd(a)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <AlertDialog>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-rose-400 hover:text-rose-300"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Eliminar</TooltipContent>
                                  </Tooltip>
                                  <AlertDialogContent className="glass-strong">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <ShieldAlert className="size-5 text-rose-400" />
                                        Eliminar anuncio lateral
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Seguro que deseas eliminar el anuncio{" "}
                                        <strong>{a.title}</strong> (
                                        {a.position === "left"
                                          ? "Izquierda"
                                          : "Derecha"}
                                        )? Esta acción quedará registrada en el
                                        log inmutable de auditoría.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSideAd(a)}
                                        className="bg-rose-600 text-white hover:bg-rose-500"
                                      >
                                        Sí, eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="text-[11px] text-muted-foreground border-t border-border pt-3 flex items-center gap-2">
                <Columns2 className="size-3" />
                Los anuncios se ordenan por el campo “Orden” (ascendente). Los
                inactivos no se muestran a los visitantes.
              </CardFooter>
            </Card>

            <SideAdDialog
              open={sideAdDialogOpen}
              onOpenChange={setSideAdDialogOpen}
              mode={sideAdDialogMode}
              initial={sideAdEditing}
              onSaved={async () => {
                await fetchSideAds()
                await fetchAudit()
              }}
            />
          </TabsContent>

          {/* ============== TAB 6: Auditoría & Transparencia ============== */}
          <TabsContent value="audit" className="mt-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gradient-gold">
                      <ScrollText className="size-5" />
                      Registro Inmutable de Auditoría
                    </CardTitle>
                    <CardDescription>
                      Últimos 50 eventos. Cada acción administrativa queda
                      registrada con diff antes/después.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAudit}
                    className="gap-1.5"
                  >
                    <History className="size-4" />
                    Refrescar
                  </Button>
                </div>
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <Lock className="size-4 text-emerald-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-200/90">
                    Este registro es inmutable y forma parte de la Prueba de
                    Reservas pública. Cualquier alteración es detectable
                    on-chain.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[28rem] pr-2">
                  <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-40">Fecha</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Detalle</TableHead>
                          <TableHead className="text-right">Diff</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground italic"
                            >
                              Sin eventos registrados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                {formatDate(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-slate-500/40 bg-slate-500/10 text-slate-300"
                                >
                                  {log.actor}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono text-[10px]",
                                    actionBadgeClass(log.action),
                                  )}
                                >
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.detail}
                                {log.entity && (
                                  <span className="ml-2 text-[10px] text-muted-foreground">
                                    · {log.entity}
                                    {log.entityId
                                      ? `#${log.entityId.slice(-6)}`
                                      : ""}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {(log.before || log.after) ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 gap-1 text-[11px]"
                                      >
                                        <Eye className="size-3" />
                                        ver diff
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="left"
                                      className="max-w-md p-0"
                                    >
                                      <div className="w-80 rounded-lg border border-border bg-popover p-3 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Gauge className="size-3.5 text-amber-400" />
                                          <span className="text-xs font-medium">
                                            Diff del cambio
                                          </span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          <div>
                                            <p className="text-rose-300 mb-1">
                                              ANTES
                                            </p>
                                            <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground max-h-32 overflow-y-auto">
                                              {prettyJson(log.before)}
                                            </pre>
                                          </div>
                                          <div>
                                            <p className="text-emerald-300 mb-1">
                                              DESPUÉS
                                            </p>
                                            <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground max-h-32 overflow-y-auto">
                                              {prettyJson(log.after)}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </ScrollArea>
              </CardContent>
              <CardFooter className="text-[11px] text-muted-foreground border-t border-border pt-3 flex items-center gap-2">
                <Hash className="size-3" />
                {auditLogs.length} evento{auditLogs.length === 1 ? "" : "s"} ·
                Cada entrada queda sellada con timestamp ISO-8601.
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
