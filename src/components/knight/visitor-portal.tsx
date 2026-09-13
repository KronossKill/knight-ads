'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Eye,
  Wallet,
  ShieldCheck,
  Zap,
  ExternalLink,
  Lock,
  Copy,
  Clock,
  CheckCircle2,
  Filter,
  X,
  Sparkles,
  Coins,
  ArrowUpRight,
  Megaphone,
  TimerOff,
  AlertCircle,
  Loader2,
  Receipt,
  Radio,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Gift,
  Info,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  badgeClass,
  getSettingValue,
  formatUsd,
  knightToUsd,
  isValidSolanaAddress,
} from '@/lib/knight-types'
import type { Ad, AdvertiserPlan, VisitorPlan, Setting, AdWithRatings } from '@/lib/knight-types'
import { StarRating } from '@/components/knight/star-rating'
import { PlanDiamonds } from '@/components/knight/plan-diamonds'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_WALLET_ADDRESS = 'Vis1t0rW4ll3tSol9pLr5tNbV8dC2sEuY6RkJ1aPQ'
const INITIAL_BALANCE_KN = 12.84

const EARNINGS_CHART_DATA = [
  { day: 'Lun', earnings: 0.0018 },
  { day: 'Mar', earnings: 0.0024 },
  { day: 'Mié', earnings: 0.0015 },
  { day: 'Jue', earnings: 0.0031 },
  { day: 'Vie', earnings: 0.0028 },
  { day: 'Sáb', earnings: 0.0042 },
  { day: 'Dom', earnings: 0.0024 },
]

// ---------------------------------------------------------------------------
// Random captcha generator (G7) — each captcha phase produces a fresh
// challenge drawn from CAPTCHA_CHALLENGES: random challenge type, random
// number of correct tiles (2-4), Fisher-Yates shuffled positions, and random
// distractor emojis for the non-target tiles.
// ---------------------------------------------------------------------------
type CaptchaTile = { emoji: string; isTarget: boolean }
type CaptchaChallenge = {
  instruction: string
  targetEmoji: string
  tiles: CaptchaTile[] // length 9
  correctIndices: number[]
}

const CAPTCHA_CHALLENGES: {
  instruction: string
  targetEmoji: string
  distractors: string[]
}[] = [
  {
    instruction: 'Selecciona todos los 🚦 semáforos',
    targetEmoji: '🚦',
    distractors: ['🚗', '🌳', '🏢', '🌉', '🚸'],
  },
  {
    instruction: 'Selecciona todos los 🚗 autos',
    targetEmoji: '🚗',
    distractors: ['🚦', '🌳', '🏢', '🌉', '🚸'],
  },
  {
    instruction: 'Selecciona todos los 🌳 árboles',
    targetEmoji: '🌳',
    distractors: ['🚗', '🚦', '🏢', '🌉', '🚸'],
  },
  {
    instruction: 'Selecciona todos los 🏢 edificios',
    targetEmoji: '🏢',
    distractors: ['🚗', '🌳', '🚦', '🌉', '🚸'],
  },
  {
    instruction: 'Selecciona todos los 🌉 puentes',
    targetEmoji: '🌉',
    distractors: ['🚗', '🌳', '🏢', '🚦', '🚸'],
  },
  {
    instruction: 'Selecciona todos los 🚸 señales de tráfico',
    targetEmoji: '🚸',
    distractors: ['🚗', '🌳', '🏢', '🌉', '🚦'],
  },
]

function shuffleInPlace<T>(arr: T[]): T[] {
  // Fisher-Yates — mutates a copy and returns it.
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function generateCaptcha(): CaptchaChallenge {
  const challenge =
    CAPTCHA_CHALLENGES[Math.floor(Math.random() * CAPTCHA_CHALLENGES.length)]
  // Random number of correct tiles between 2 and 4 inclusive.
  const correctCount = Math.floor(Math.random() * 3) + 2
  // Pick `correctCount` distinct target positions out of 9 by shuffling the
  // index list and taking the first N.
  const indices = shuffleInPlace([0, 1, 2, 3, 4, 5, 6, 7, 8])
  const correctIndices = indices.slice(0, correctCount)
  const correctSet = new Set(correctIndices)
  // Build the 9 tiles: target emoji on correct positions, random distractor
  // emoji elsewhere.
  const tiles: CaptchaTile[] = []
  for (let i = 0; i < 9; i++) {
    if (correctSet.has(i)) {
      tiles.push({ emoji: challenge.targetEmoji, isTarget: true })
    } else {
      const distractor =
        challenge.distractors[
          Math.floor(Math.random() * challenge.distractors.length)
        ]
      tiles.push({ emoji: distractor, isTarget: false })
    }
  }
  return {
    instruction: challenge.instruction,
    targetEmoji: challenge.targetEmoji,
    tiles,
    correctIndices,
  }
}

const PLAN_FILTERS: { code: string; label: string }[] = [
  { code: 'todos', label: 'Todos' },
  { code: 'permanente', label: 'Permanente' },
  { code: 'superior', label: 'Superior' },
  { code: 'alta', label: 'Alta' },
  { code: 'medio', label: 'Medio' },
  { code: 'minimo', label: 'Mínimo' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function formatKn(value: number, decimals = 2): string {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function relativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (Number.isNaN(diffMs)) return 'hace un momento'
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'hace unos segundos'
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  const s = totalSec % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ---------------------------------------------------------------------------
// Visitor wallet card
// ---------------------------------------------------------------------------
function VisitorWalletCard({
  settings,
  balance,
  onWalletSet,
}: {
  settings: Setting[]
  balance: number
  onWalletSet: (addr: string) => void
}) {
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)
  const walletValidation = getSettingValue<boolean>(settings, 'walletValidation', true)
  const [withdrawalWallet, setWithdrawalWallet] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  // On-chain Solana wallet verification state
  type VerifyState = { status: 'idle' } | { status: 'checking' } | { status: 'valid'; exists: boolean; reason: string } | { status: 'invalid'; reason: string }
  const [verify, setVerify] = React.useState<VerifyState>({ status: 'idle' })
  const verifyAbort = React.useRef<AbortController | null>(null)

  const trimmedInput = input.trim()
  const formatValid = !walletValidation || (trimmedInput.length > 0 && isValidSolanaAddress(trimmedInput))

  // Trigger on-chain verification when format is valid (debounced)
  React.useEffect(() => {
    if (!walletValidation || trimmedInput.length === 0) {
      setVerify({ status: 'idle' })
      return
    }
    if (!isValidSolanaAddress(trimmedInput)) {
      setVerify({ status: 'invalid', reason: 'Formato no corresponde a Solana. Base58, 32-44 caracteres.' })
      return
    }
    // Format OK → verify on-chain
    if (verifyAbort.current) verifyAbort.current.abort()
    const ctrl = new AbortController()
    verifyAbort.current = ctrl
    setVerify({ status: 'checking' })
    const timer = setTimeout(() => {
      fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmedInput }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          if (ctrl.signal.aborted) return
          if (data.valid) {
            setVerify({ status: 'valid', exists: !!data.exists, reason: data.reason || 'Wallet Solana verificada' })
          } else {
            setVerify({ status: 'invalid', reason: data.reason || 'Wallet no pertenece a Solana' })
          }
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setVerify({ status: 'valid', exists: false, reason: 'Formato válido. No se pudo contactar el RPC de Solana.' })
        })
    }, 600) // debounce 600ms
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [trimmedInput, walletValidation])

  const showWalletError = walletValidation && trimmedInput.length > 0 && (verify.status === 'invalid')
  const showWalletValid = walletValidation && trimmedInput.length > 0 && (verify.status === 'valid')
  const showWalletChecking = walletValidation && trimmedInput.length > 0 && (verify.status === 'checking')
  const confirmDisabled =
    trimmedInput.length === 0 ||
    (walletValidation && verify.status !== 'valid')

  const handleSave = () => {
    const trimmed = input.trim()
    if (walletValidation && verify.status !== 'valid') {
      toast.error(verify.status === 'invalid' ? verify.reason : 'Verifica la wallet antes de continuar')
      return
    }
    setWithdrawalWallet(trimmed)
    onWalletSet(trimmed)
    setDialogOpen(false)
    setInput('')
    setVerify({ status: 'idle' })
    toast.success(
      walletValidation
        ? 'Wallet Solana verificada on-chain y bloqueada'
        : 'Wallet de retiro configurada y bloqueada',
    )
  }

  const handleCopy = async () => {
    if (!withdrawalWallet) return
    try {
      await navigator.clipboard.writeText(withdrawalWallet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Dirección copiada')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <>
      <Card className="glass glow-solana overflow-hidden">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-solana flex size-10 items-center justify-center rounded-full text-white">
              <Wallet className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet Visitante</p>
              <code className="text-sm font-mono text-foreground">
                {truncateAddress(MOCK_WALLET_ADDRESS)}
              </code>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo disponible</p>
            <p className="text-2xl font-bold text-gradient-solana">
              {formatKn(balance)} {tokenSymbol}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ≈ {formatUsd(knightToUsd(balance, priceUsd))} USD
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Wallet de retiro
            </p>
            {withdrawalWallet ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-2.5">
                <code className="truncate text-xs font-mono text-foreground">
                  {truncateAddress(withdrawalWallet)}
                </code>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleCopy}
                    aria-label="Copiar wallet de retiro"
                  >
                    {copied ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 text-xs text-amber-300">
                        <Lock className="size-3" /> bloqueada
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-center">
                      Por seguridad, esta wallet solo puede configurarse una vez.
                      Contacta a soporte para cambios.
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/[0.06]"
                onClick={() => setDialogOpen(true)}
              >
                <Wallet className="size-4" />
                Configurar wallet de retiro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-400" />
              Configurar wallet de retiro
            </DialogTitle>
            <DialogDescription>
              Esta wallet solo se puede configurar <span className="text-amber-300">una vez</span>. Asegúrate
              de introducir una dirección Solana válida que controles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-wallet">Dirección Solana</Label>
            <Input
              id="withdrawal-wallet"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: 7Kn8G3Hght4F2qX9wzM4pLr5tNbV8dC2sEuY6RkJ1aPQ"
              className={[
                'font-mono text-xs',
                showWalletError
                  ? 'border-rose-500/60 focus-visible:ring-rose-500/30'
                  : '',
                showWalletValid
                  ? 'border-emerald-500/60 focus-visible:ring-emerald-500/30'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {showWalletChecking && (
              <p className="flex items-center gap-1.5 text-xs text-sky-400">
                <Loader2 className="size-3.5 animate-spin" />
                Verificando wallet en la red Solana...
              </p>
            )}
            {showWalletError && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="size-3.5" />
                {verify.status === 'invalid' ? verify.reason : 'Wallet inválida'}
              </p>
            )}
            {showWalletValid && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {verify.status === 'valid'
                  ? (verify.exists
                      ? 'Wallet Solana verificada on-chain ✓ (la cuenta existe en mainnet)'
                      : 'Wallet Solana válida (formato + curva ed25519 correctos, cuenta nueva sin saldo)')
                  : 'Wallet válida ✓'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ⚠️ Una vez guardada, la dirección quedará <span className="text-amber-300">bloqueada 🔒</span> por
              seguridad. La verificación confirma que la wallet pertenece a la red Solana (no BTC/ETH).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-gold text-primary-foreground font-semibold"
              onClick={handleSave}
              disabled={confirmDisabled}
            >
              <Lock className="size-4" />
              Bloquear y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Active visitor plan card + upgrade dialog
// ---------------------------------------------------------------------------
function ActiveVisitorPlanCard({
  visitorPlans,
}: {
  visitorPlans: VisitorPlan[]
}) {
  const activePlan =
    visitorPlans.find((p) => p.code === 'gold') ??
    visitorPlans.find((p) => p.isDefault) ??
    visitorPlans[0]

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const mockDaysRemaining = 12
  const pct = activePlan ? Math.round((mockDaysRemaining / Math.max(1, activePlan.durationDays)) * 100) : 0

  if (!activePlan) return null

  return (
    <>
      <Card className="glass border-amber-500/20">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              <p className="text-sm font-medium text-foreground">Plan activo</p>
            </div>
            <Badge className={badgeClass(activePlan.badgeColor)}>
              {activePlan.name}
              <span className="ml-1 font-bold">×{activePlan.multiplier}</span>
            </Badge>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Días restantes</span>
              <span className="font-medium text-foreground">
                {mockDaysRemaining}/{activePlan.durationDays}d
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{activePlan.description}</p>

          <Button
            variant="outline"
            className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/[0.06]"
            onClick={() => setDialogOpen(true)}
          >
            <ArrowUpRight className="size-4" />
            Mejorar plan
          </Button>
        </CardContent>
      </Card>

      <UpgradePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        visitorPlans={visitorPlans}
        activePlanCode={activePlan.code}
      />
    </>
  )
}

function UpgradePlanDialog({
  open,
  onOpenChange,
  visitorPlans,
  activePlanCode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  visitorPlans: VisitorPlan[]
  activePlanCode: string
}) {
  const handleSubscribe = (plan: VisitorPlan) => {
    if (plan.code === activePlanCode) {
      toast.info(`Ya tienes el plan ${plan.name} activo.`)
      return
    }
    if (plan.costKnight === 0) {
      toast.success(`Cambiado al plan ${plan.name}. Multiplicador ×${plan.multiplier}.`)
    } else {
      toast.success(
        `Suscripción al plan ${plan.name} iniciada. Costo: ${formatKn(plan.costKnight)} $Kn · ` +
          `Multiplicador ×${plan.multiplier} por ${plan.durationDays} días.`,
      )
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" />
            Comparar planes de visitante
          </DialogTitle>
          <DialogDescription>
            Multiplicadores con duración configurable. Mejora tus ganancias por vista.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {visitorPlans.map((plan) => {
            const isCurrent = plan.code === activePlanCode
            const isGold = plan.code === 'gold'
            return (
              <div
                key={plan.id}
                className={[
                  'relative flex flex-col rounded-xl border p-4 transition',
                  isCurrent
                    ? 'border-emerald-400/50 bg-emerald-500/[0.05]'
                    : isGold
                      ? 'border-amber-400/70 bg-amber-500/[0.04] glow-gold'
                      : 'border-border bg-card/40 hover:border-amber-500/40',
                ].join(' ')}
              >
                {isGold && !isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground">
                    Recomendado
                  </Badge>
                )}
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={badgeClass(plan.badgeColor)}>{plan.name}</Badge>
                  {isCurrent && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                      Actual
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-gradient-gold">
                  ×{plan.multiplier}
                </p>
                <p className="text-xs text-muted-foreground">multiplicador</p>
                <Separator className="my-3" />
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Costo</dt>
                    <dd className="font-medium text-foreground">
                      {plan.costKnight === 0 ? 'Gratis' : `${formatKn(plan.costKnight)} $Kn`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duración</dt>
                    <dd className="font-medium text-foreground">
                      {plan.durationDays === 0 ? 'Permanente' : `${plan.durationDays} días`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Límite diario</dt>
                    <dd className="font-medium text-foreground">
                      {plan.dailyViewsLimit === 0 ? 'Ilimitado' : plan.dailyViewsLimit}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                <Button
                  className="mt-4 w-full bg-gradient-gold text-primary-foreground font-semibold"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 className="size-4" /> Plan actual
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" /> Suscribirse
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Today's earnings card with line chart
// ---------------------------------------------------------------------------
function TodayEarningsCard({
  todayEarnings,
  priceUsd,
}: {
  todayEarnings: number
  priceUsd: number
}) {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Coins className="size-4 text-emerald-400" />
          Ganancias hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-2xl font-bold text-gradient-solana">
            {formatKn(todayEarnings, 4)} $Kn
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ≈ {formatUsd(knightToUsd(todayEarnings, priceUsd))} USD
          </p>
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={EARNINGS_CHART_DATA} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="knightEarningsLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.62 0.22 160)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 75)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'oklch(0.68 0.02 264)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'oklch(0.68 0.02 264)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => Number(v).toFixed(3)}
              />
              <RechartsTooltip
                cursor={{ stroke: 'oklch(0.78 0.16 75 / 30%)' }}
                contentStyle={{
                  background: 'oklch(0.16 0.02 264)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  borderRadius: '0.5rem',
                  color: 'oklch(0.97 0.012 90)',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [`${formatKn(v, 4)} $Kn`, 'Ganancias']}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="url(#knightEarningsLine)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'oklch(0.78 0.16 75)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Últimos 7 días</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Ad card
// ---------------------------------------------------------------------------
function AdCard({
  ad,
  plan,
  onView,
  visitorMultiplier,
  visitorPlanName,
  visitorRewardPercent,
  priceUsd,
  avgStars,
  ratingCount,
}: {
  ad: Ad
  plan: AdvertiserPlan
  onView: (ad: Ad, plan: AdvertiserPlan) => void
  visitorMultiplier: number
  visitorPlanName?: string
  visitorRewardPercent: number
  priceUsd: number
  avgStars?: number
  ratingCount?: number
}) {
  // G1: compute the visitor's net reward for this ad and show it BEFORE the
  // user clicks "Ver". baseReward = (price × visitorRewardPercent/100)
  // / viewsIncluded, then multiplied by the active visitor plan's multiplier.
  const baseReward =
    (plan.priceKnight * (visitorRewardPercent / 100)) / plan.viewsIncluded
  const netReward = baseReward * visitorMultiplier
  const isPaidPlan = visitorMultiplier > 1

  return (
    <Card className="glass transition-all hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5">
      <CardContent className="flex gap-3 p-3">
        {/* Image — LEFT, ~96px square with plan badge overlaid */}
        <div className="relative shrink-0">
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="size-24 rounded-lg border border-border/60 object-cover"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <Megaphone className="size-6 text-muted-foreground/60" aria-hidden />
            </div>
          )}
          <Badge
            className={`absolute -bottom-1.5 -left-1.5 h-5 px-1.5 text-[10px] ${badgeClass(plan.badgeColor)}`}
          >
            {plan.name}
          </Badge>
          {plan.isPermanent && (
            <Badge
              variant="outline"
              className="absolute -right-1.5 -top-1.5 h-5 border-amber-500/40 bg-background/80 px-1.5 text-[9px] text-amber-300 backdrop-blur"
            >
              Permanente
            </Badge>
          )}
        </div>

        {/* Content — RIGHT */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Meta row: diamonds + advertiser + relative time */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <PlanDiamonds count={plan.diamondCount} size={9} />
            <span aria-hidden>·</span>
            <span className="truncate">{ad.advertiser}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{relativeTime(ad.createdAt)}</span>
          </div>

          {/* Title — prominent, single line */}
          <h3 className="line-clamp-1 text-sm font-bold text-foreground">
            {ad.title}
          </h3>

          {/* Content — muted, 2 lines max */}
          <p className="line-clamp-2 text-xs text-muted-foreground">{ad.content}</p>

          {/* Bottom action row — reward pill, optional stars, Ver button */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {/* Reward — compact gold pill */}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px]">
                <span aria-hidden>💰</span>
                <span className="font-mono font-bold text-gradient-gold tabular-nums">
                  {netReward.toFixed(6)} $Kn
                </span>
              </span>
              {/* Star rating — only if avgStars available (AdWithRatings) */}
              {typeof avgStars === 'number' && avgStars > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-300">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold tabular-nums">{avgStars.toFixed(1)}</span>
                  <span className="text-muted-foreground">({ratingCount ?? 0})</span>
                </span>
              )}
              {isPaidPlan && visitorPlanName && (
                <Badge
                  variant="outline"
                  className="h-4 border-amber-500/40 bg-amber-500/10 px-1 text-[9px] text-amber-300"
                >
                  ×{visitorMultiplier}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {ad.link && ad.link !== '#' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(ad.link, '_blank', 'noopener,noreferrer')
                  }}
                  aria-label="Abrir enlace externo"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
              <Button
                className="h-7 bg-gradient-gold px-2.5 text-xs font-semibold text-primary-foreground"
                size="sm"
                onClick={() => onView(ad, plan)}
              >
                <Eye className="size-3.5" />
                Ver
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// I5 — Top-rated compact card (for the horizontal "Mejor Valorados" row)
// ---------------------------------------------------------------------------
function TopRatedCard({
  ad,
  plan,
  onView,
  visitorMultiplier,
  visitorRewardPercent,
}: {
  ad: AdWithRatings
  plan: AdvertiserPlan
  onView: (ad: Ad, plan: AdvertiserPlan) => void
  visitorMultiplier: number
  visitorRewardPercent: number
}) {
  const baseReward =
    (plan.priceKnight * (visitorRewardPercent / 100)) / plan.viewsIncluded
  const netReward = baseReward * visitorMultiplier

  return (
    <motion.button
      type="button"
      onClick={() => onView(ad, plan)}
      whileHover={{ y: -3 }}
      className="group relative flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-card/40 text-left transition-colors hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10"
      aria-label={`Ver anuncio: ${ad.title}`}
    >
      {/* Image with overlaid plan badge */}
      <div className="relative h-24 w-full overflow-hidden bg-muted/40">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Megaphone className="size-6 text-muted-foreground/60" aria-hidden />
          </div>
        )}
        <Badge
          className={`absolute left-1.5 top-1.5 h-4 px-1 text-[9px] ${badgeClass(plan.badgeColor)}`}
        >
          {plan.name}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        <h4 className="line-clamp-1 text-xs font-bold text-foreground">{ad.title}</h4>

        <StarRating value={ad.avgStars} count={ad.ratingCount} readOnly size={11} />

        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-gradient-gold tabular-nums">
            <span aria-hidden>💰</span>
            {netReward.toFixed(4)} $Kn
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Eye className="size-3" />
            Ver
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// I5 — Top-rated horizontal scroll row (rendered above the paginated feed)
// ---------------------------------------------------------------------------
function TopRatedRow({
  ads,
  visitorMultiplier,
  visitorRewardPercent,
  onView,
}: {
  ads: AdWithRatings[]
  visitorMultiplier: number
  visitorRewardPercent: number
  onView: (ad: Ad, plan: AdvertiserPlan) => void
}) {
  if (ads.length === 0) return null

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden>⭐</span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gradient-gold">Mejor Valorados</h3>
          <p className="text-[11px] text-muted-foreground">
            los anuncios con mejores calificaciones
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {ads.map((ad) => {
          if (!ad.plan) return null
          return (
            <TopRatedCard
              key={ad.id}
              ad={ad}
              plan={ad.plan}
              onView={onView}
              visitorMultiplier={visitorMultiplier}
              visitorRewardPercent={visitorRewardPercent}
            />
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// I5 — Referral dashboard card (sidebar)
// ---------------------------------------------------------------------------
type ReferralData = {
  referralLink: string
  level1Count: number
  level2Count: number
  totalEarningsKnight: number
}

function ReferralDashboardCard({
  settings,
  data,
  loading,
}: {
  settings: Setting[]
  data: ReferralData | null
  loading: boolean
}) {
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)
  const referralReward = getSettingValue<number>(settings, 'referralRewardKnight', 100)
  const level1Percent = getSettingValue<number>(settings, 'referralLevel1Percent', 5)
  const level2Percent = getSettingValue<number>(settings, 'referralLevel2Percent', 2)

  const [copied, setCopied] = React.useState(false)

  const fullLink = React.useMemo(() => {
    if (!data?.referralLink) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return data.referralLink.startsWith('http')
      ? data.referralLink
      : origin + data.referralLink
  }, [data?.referralLink])

  const handleCopy = async () => {
    if (!fullLink) return
    try {
      await navigator.clipboard.writeText(fullLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Enlace de referido copiado')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <Card className="glass border-amber-500/20">
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground">
              <Gift className="size-3.5" />
            </div>
            <p className="text-sm font-medium text-foreground">Programa de Referidos</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-amber-500/10 hover:text-amber-300"
                aria-label="¿Cómo funciona?"
              >
                <Info className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs glass-strong" side="bottom" align="end">
              <p className="font-semibold text-foreground">¿Cómo funciona?</p>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">
                Recibe{' '}
                <span className="font-semibold text-amber-300">
                  {referralReward} {tokenSymbol}
                </span>{' '}
                por cada amigo que se registre via tu enlace. Gana{' '}
                <span className="font-semibold text-amber-300">{level1Percent}%</span> de sus
                ingresos de por vida +{' '}
                <span className="font-semibold text-amber-300">{level2Percent}%</span> del nivel 2.
              </p>
            </PopoverContent>
          </Popover>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Cargando…
          </div>
        ) : data ? (
          <>
            {/* Referral link + copy button */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/40 p-2">
              <code className="min-w-0 flex-1 truncate text-[10px] font-mono text-foreground">
                {fullLink}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-amber-300 hover:bg-amber-500/10"
                onClick={handleCopy}
                aria-label="Copiar enlace de referido"
              >
                {copied ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>

            {/* Level counts */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.05] py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Nivel 1
                </p>
                <p className="text-lg font-bold text-amber-300 tabular-nums">
                  {data.level1Count}
                </p>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.05] py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Nivel 2
                </p>
                <p className="text-lg font-bold text-amber-300 tabular-nums">
                  {data.level2Count}
                </p>
              </div>
            </div>

            {/* Total earnings */}
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Ganancias por referidos
              </p>
              <p className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
                {formatKn(data.totalEarningsKnight, 4)} {tokenSymbol}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ≈ {formatUsd(knightToUsd(data.totalEarningsKnight, priceUsd))} USD
              </p>
            </div>
          </>
        ) : (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No se pudo cargar tu programa de referidos.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ReferralDashboardCardPlaceholder() {
  return (
    <Card className="glass border-amber-500/20">
      <CardContent className="space-y-2 py-5 text-center">
        <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground">
          <Gift className="size-4" />
        </div>
        <p className="text-sm font-medium text-foreground">Programa de Referidos</p>
        <p className="text-xs text-muted-foreground">
          Inicia sesión para tu enlace de referido
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Payment breakdown card — financial receipt styling
// ---------------------------------------------------------------------------
function PaymentBreakdownCard({
  plan,
  multiplier,
  visitorPlanName,
  priceUsd,
  visitorRewardPercent,
  balance,
}: {
  plan: AdvertiserPlan
  multiplier: number
  visitorPlanName?: string
  priceUsd: number
  visitorRewardPercent: number
  balance: number
}) {
  const baseReward =
    (plan.priceKnight * (visitorRewardPercent / 100)) / plan.viewsIncluded
  const netReward = baseReward * multiplier
  const isPaidPlan = multiplier > 1
  const fmtKn = (v: number) => formatKn(v, 4)

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-card/40">
      <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.05] px-4 py-2.5">
        <Receipt className="size-4 text-amber-400" />
        <p className="text-sm font-semibold text-foreground">💰 Desglose de pago</p>
      </div>
      <dl className="divide-y divide-border/40 px-4 text-xs">
        <div className="flex items-center justify-between py-2">
          <dt className="text-muted-foreground">Pago base por vista</dt>
          <dd className="font-mono font-medium text-foreground tabular-nums">
            {fmtKn(baseReward)} $Kn · {formatUsd(knightToUsd(baseReward, priceUsd))} USD
          </dd>
        </div>
        {isPaidPlan ? (
          <>
            <div className="flex items-center justify-between py-2">
              <dt className="text-muted-foreground">Tu multiplicador</dt>
              <dd className="font-medium text-amber-300">
                ×{multiplier}
                {visitorPlanName ? (
                  <>
                    {' '}
                    <span className="text-muted-foreground">({visitorPlanName})</span>
                  </>
                ) : null}
              </dd>
            </div>
            <div className="flex items-center justify-between bg-amber-500/[0.05] py-2.5">
              <dt className="font-semibold text-foreground">Pago con multiplicador</dt>
              <dd className="font-mono font-bold text-amber-300 tabular-nums">
                {fmtKn(netReward)} $Kn · {formatUsd(knightToUsd(netReward, priceUsd))} USD
              </dd>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between bg-amber-500/[0.05] py-2.5">
            <dt className="font-semibold text-foreground">Pago final</dt>
            <dd className="font-mono font-bold text-amber-300 tabular-nums">
              {fmtKn(netReward)} $Kn · {formatUsd(knightToUsd(netReward, priceUsd))} USD
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between py-2">
          <dt className="text-muted-foreground">Saldo bruto acumulado</dt>
          <dd className="font-mono font-medium text-foreground tabular-nums">
            {fmtKn(balance)} $Kn · {formatUsd(knightToUsd(balance, priceUsd))} USD
          </dd>
        </div>
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Viewer modal — the golden path
// ---------------------------------------------------------------------------
type ViewerPhase = 'view' | 'captcha' | 'success' | 'invalidated' | 'locked'

function ViewerModal({
  ad,
  plan,
  open,
  onOpenChange,
  reward,
  visitorMultiplier,
  visitorPlanName,
  reviewWindowHours,
  captchaTimeoutSeconds,
  lastViewedAt,
  onComplete,
  priceUsd,
  visitorRewardPercent,
  currentBalance,
  userLabel,
}: {
  ad: Ad | null
  plan: AdvertiserPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  reward: number
  visitorMultiplier: number
  visitorPlanName?: string
  reviewWindowHours: number
  captchaTimeoutSeconds: number
  lastViewedAt: number | null
  onComplete: () => void
  priceUsd: number
  visitorRewardPercent: number
  currentBalance: number
  userLabel?: string
}) {
  const [phase, setPhase] = React.useState<ViewerPhase>('view')
  const [secondsLeft, setSecondsLeft] = React.useState(0)
  const [selectedTiles, setSelectedTiles] = React.useState<Set<number>>(new Set())
  const [captchaVerified, setCaptchaVerified] = React.useState(false)
  const [lockedRemaining, setLockedRemaining] = React.useState(0)
  // Captcha timeout: a timestamp (ms) at which the captcha is considered expired,
  // plus the remaining seconds shown in the UI (updated every 250ms).
  const [captchaDeadline, setCaptchaDeadline] = React.useState<number | null>(null)
  const [captchaRemaining, setCaptchaRemaining] = React.useState(0)
  // G7 — Random captcha challenge for the current attempt. Regenerated every
  // time the user enters the captcha phase (handleContinueToCaptcha). null
  // while the modal is in any other phase.
  const [captchaChallenge, setCaptchaChallenge] = React.useState<CaptchaChallenge | null>(null)
  // Star rating state for the success phase (one submission per ad).
  const [ratingValue, setRatingValue] = React.useState(0)
  const [ratingLocked, setRatingLocked] = React.useState(false)
  const [ratingLoading, setRatingLoading] = React.useState(false)

  // Reset state when target ad changes
  React.useEffect(() => {
    if (!open || !ad) return
    setSelectedTiles(new Set())
    setCaptchaVerified(false)
    setCaptchaDeadline(null)
    setCaptchaRemaining(0)
    setCaptchaChallenge(null)
    setRatingValue(0)
    setRatingLocked(false)
    setRatingLoading(false)
    if (lastViewedAt && reviewWindowHours > 0) {
      const lockUntil = lastViewedAt + reviewWindowHours * 3600 * 1000
      const remaining = lockUntil - Date.now()
      if (remaining > 0) {
        setPhase('locked')
        setLockedRemaining(remaining)
        return
      }
    }
    setPhase('view')
    setSecondsLeft(plan?.viewSeconds ?? 0)
  }, [open, ad?.id, plan?.viewSeconds, lastViewedAt, reviewWindowHours])

  // Countdown timer for view phase
  React.useEffect(() => {
    if (!open || phase !== 'view') return
    if (secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, phase, secondsLeft])

  // Countdown for locked state
  React.useEffect(() => {
    if (!open || phase !== 'locked') return
    const id = window.setInterval(() => {
      const lockUntil = (lastViewedAt ?? 0) + reviewWindowHours * 3600 * 1000
      const remaining = lockUntil - Date.now()
      setLockedRemaining(remaining)
      if (remaining <= 0) {
        setPhase('view')
        setSecondsLeft(plan?.viewSeconds ?? 0)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, phase, lastViewedAt, reviewWindowHours, plan?.viewSeconds])

  // Captcha timeout countdown — ticks every 250ms while in the captcha phase.
  // When the deadline is reached and the user hasn't verified, the view is
  // invalidated (no reward credited, ad NOT marked as viewed so the user can
  // retry later within the same anti-farming window).
  React.useEffect(() => {
    if (!open || phase !== 'captcha' || !captchaDeadline) return
    const tick = () => {
      const remainingMs = captchaDeadline - Date.now()
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
      setCaptchaRemaining(remaining)
      if (remainingMs <= 0 && !captchaVerified) {
        setCaptchaDeadline(null)
        setPhase('invalidated')
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [open, phase, captchaDeadline, captchaVerified])

  // G7 — captcha is valid when the user has selected exactly the
  // correctIndices (no extras, none missing). Falls back to "select all 0"
  // only when challenge hasn't been generated yet (defensive — should never
  // happen in the captcha phase because handleContinueToCaptcha seeds it).
  const correctIndices = captchaChallenge?.correctIndices ?? []
  const captchaValid =
    selectedTiles.size === correctIndices.length &&
    correctIndices.every((i) => selectedTiles.has(i))

  const toggleTile = (idx: number) => {
    setSelectedTiles((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setCaptchaVerified(false)
  }

  const handleContinueToCaptcha = () => {
    // G7: regenerate a fresh random captcha every time the user enters the
    // captcha phase. Each ad view gets a different challenge.
    setCaptchaChallenge(generateCaptcha())
    setSelectedTiles(new Set())
    setCaptchaVerified(false)
    setCaptchaDeadline(Date.now() + captchaTimeoutSeconds * 1000)
    setCaptchaRemaining(captchaTimeoutSeconds)
    setPhase('captcha')
  }
  const handleVerifyCaptcha = () => {
    if (!captchaValid) return
    setCaptchaVerified(true)
    // Stop the timeout — the user verified in time.
    setCaptchaDeadline(null)
    setTimeout(() => setPhase('success'), 400)
  }

  const handleComplete = () => {
    // Behavior 2: auto-open the ad link in a new tab when claiming the reward.
    // Must run synchronously in the click handler so popup blockers allow it.
    const link = ad?.link?.trim()
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer')
      toast.success('¡Reward reclamado! Abrimos el anuncio en una nueva pestaña.')
    } else {
      toast.success('Reward reclamado')
    }
    onComplete()
    onOpenChange(false)
  }

  const handleClose = (next: boolean) => {
    if (!next) onOpenChange(false)
  }

  // Submit star rating to /api/ratings and lock the control to the chosen value.
  const handleRate = async (stars: number) => {
    if (!ad || !userLabel || ratingLocked || ratingLoading) return
    setRatingLoading(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, userLabel, stars }),
      })
      if (!res.ok) throw new Error('rating request failed')
      setRatingValue(stars)
      setRatingLocked(true)
      toast.success('¡Gracias por tu calificación!')
    } catch {
      toast.error('No se pudo guardar tu calificación. Intenta nuevamente.')
    } finally {
      setRatingLoading(false)
    }
  }

  if (!ad || !plan) return null

  const totalSeconds = plan.viewSeconds
  const elapsedPct = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="glass-strong border-amber-500/30 p-0 sm:max-w-3xl glow-gold"
        showCloseButton
      >
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="size-5 text-amber-400" />
            Visualizando anuncio
          </DialogTitle>
          <DialogDescription>
            Completa todos los pasos para reclamar tu reward en $Knight.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            {/* LOCKED phase — anti-farming */}
            {phase === 'locked' && (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center justify-center gap-4 py-10 text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
                  <Lock className="size-8 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Anuncio en ventana de revisión</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Debes esperar <span className="font-semibold text-amber-300">
                      {formatRemaining(lockedRemaining)}
                    </span>{' '}
                    antes de volver a ver este anuncio.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Anti-farming: ventana de {reviewWindowHours}h por anuncio
                </div>
              </motion.div>
            )}

            {/* VIEW phase — countdown */}
            {phase === 'view' && (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-5"
              >
                <div className="flex items-start gap-4">
                  {ad.imageUrl && (
                    <div className="hidden shrink-0 overflow-hidden rounded-lg border border-border/60 sm:block">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="size-24 object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={badgeClass(plan.badgeColor)}>{plan.name}</Badge>
                      <span>{ad.advertiser}</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{ad.title}</h3>
                    <p className="text-sm text-muted-foreground">{ad.content}</p>
                    {ad.link && ad.link !== '#' && (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:text-sky-200"
                      >
                        <ExternalLink className="size-3.5" />
                        Visitar enlace
                      </a>
                    )}
                  </div>
                </div>

                <PaymentBreakdownCard
                  plan={plan}
                  multiplier={visitorMultiplier}
                  visitorPlanName={visitorPlanName}
                  priceUsd={priceUsd}
                  visitorRewardPercent={visitorRewardPercent}
                  balance={currentBalance}
                />

                <Separator />

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5 text-center">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Tiempo mínimo de visualización
                  </p>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={secondsLeft}
                      initial={{ opacity: 0, scale: 0.8, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="text-6xl font-bold text-gradient-gold tabular-nums"
                    >
                      {secondsLeft}
                    </motion.div>
                  </AnimatePresence>
                  <p className="mt-1 text-xs text-muted-foreground">segundos restantes</p>
                  <Progress value={elapsedPct} className="mt-4 h-2" />
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  ⏳ Mantén esta ventana abierta. El botón se habilitará al llegar a 0.
                </p>
              </motion.div>
            )}

            {/* CAPTCHA phase */}
            {phase === 'captcha' && (
              <motion.div
                key="captcha"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="rounded-lg border border-border bg-card/40 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge className={badgeClass(plan.badgeColor)}>{plan.name}</Badge>
                    <span>{ad.title}</span>
                  </div>
                </div>

                <Separator />

                {/* Captcha timeout countdown */}
                <div
                  className={[
                    'rounded-lg border p-3 transition-colors',
                    captchaRemaining <= 3
                      ? 'border-rose-500/60 bg-rose-500/10'
                      : 'border-amber-500/30 bg-amber-500/[0.05]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={[
                        'flex items-center gap-1.5 font-medium',
                        captchaRemaining <= 3 ? 'text-rose-300' : 'text-amber-300',
                      ].join(' ')}
                    >
                      <Clock className="size-4" />
                      Tiempo para verificar
                    </span>
                    <span
                      className={[
                        'text-2xl font-bold tabular-nums',
                        captchaRemaining <= 3 ? 'text-rose-300' : 'text-gradient-gold',
                      ].join(' ')}
                    >
                      {captchaRemaining}s
                    </span>
                  </div>
                  <Progress
                    value={
                      captchaTimeoutSeconds > 0
                        ? (captchaRemaining / captchaTimeoutSeconds) * 100
                        : 0
                    }
                    className="mt-2 h-1.5"
                  />
                  {captchaRemaining <= 3 && (
                    <p className="mt-1.5 text-center text-xs font-medium text-rose-300">
                      ⏱️ ¡Rápido! La vista se invalidará pronto.
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">
                    {captchaChallenge?.instruction ??
                      'Selecciona las imágenes solicitadas'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(captchaChallenge?.tiles ?? []).map((tile, idx) => {
                      const isSelected = selectedTiles.has(idx)
                      const isCorrect = tile.isTarget
                      const showFeedback = captchaVerified
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleTile(idx)}
                          className={[
                            'flex aspect-square items-center justify-center rounded-md border text-4xl transition',
                            showFeedback && isCorrect && isSelected
                              ? 'border-emerald-400/80 bg-emerald-500/15'
                              : showFeedback && !isCorrect && isSelected
                                ? 'border-rose-400/80 bg-rose-500/15'
                                : isSelected
                                  ? 'border-amber-400/80 bg-amber-500/15'
                                  : 'border-border bg-muted/40 hover:border-amber-500/40 hover:bg-amber-500/[0.05]',
                          ].join(' ')}
                          aria-label={`Casilla ${idx + 1}: ${tile.emoji}`}
                        >
                          {tile.emoji}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {selectedTiles.size}/{correctIndices.length} seleccionadas
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-border"
                      disabled={!captchaValid || captchaVerified}
                      onClick={handleVerifyCaptcha}
                    >
                      {captchaVerified ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-400" /> Verificado
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4" /> Verificar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS phase */}
            {phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center gap-4 py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40"
                >
                  <CheckCircle2 className="size-12 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-lg font-bold text-foreground">¡Vista completada!</p>
                  <p className="mt-2 text-4xl font-bold text-gradient-gold">
                    +{formatKn(reward, 4)} $Kn
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ≈ {formatUsd(knightToUsd(reward, priceUsd))} USD · Multiplicador ×{visitorMultiplier}
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <PaymentBreakdownCard
                    plan={plan}
                    multiplier={visitorMultiplier}
                    visitorPlanName={visitorPlanName}
                    priceUsd={priceUsd}
                    visitorRewardPercent={visitorRewardPercent}
                    balance={currentBalance + reward}
                  />
                </div>

                {userLabel && (
                  <div className="w-full max-w-md space-y-2 rounded-xl border border-border/60 bg-card/30 p-4">
                    <p className="text-sm font-medium text-foreground">
                      Califica este anuncio:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <StarRating
                        value={ratingValue}
                        readOnly={ratingLocked}
                        size={28}
                        onRate={(s) => void handleRate(s)}
                      />
                    </div>
                    {ratingLocked && (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> ¡Gracias por tu calificación!
                      </p>
                    )}
                    {ratingLoading && !ratingLocked && (
                      <p className="text-center text-xs text-muted-foreground">Guardando…</p>
                    )}
                  </div>
                )}

                <Button
                  className="bg-gradient-gold text-primary-foreground font-semibold px-8"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="size-4" />
                  Reclamar y cerrar
                </Button>
              </motion.div>
            )}

            {/* INVALIDATED phase — captcha timeout */}
            {phase === 'invalidated' && (
              <motion.div
                key="invalidated"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center justify-center gap-4 py-10 text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/40">
                  <TimerOff className="size-8 text-rose-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-300">Vista invalidada</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    ⏱️ Tiempo agotado. La vista ha sido invalidada. No se acredita
                    recompensa.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Puedes intentar nuevamente este anuncio más tarde.
                </div>
                <Button
                  variant="outline"
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/[0.06]"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {phase === 'view' && (
          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button
              className="ml-auto bg-gradient-gold text-primary-foreground font-semibold"
              disabled={secondsLeft > 0}
              onClick={handleContinueToCaptcha}
            >
              {secondsLeft > 0 ? (
                <>
                  <Clock className="size-4" /> Espera {secondsLeft}s
                </>
              ) : (
                <>
                  Continuar <ArrowUpRight className="size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function VisitorPortal({
  ads,
  visitorPlans,
  settings,
  userEmail,
}: {
  ads: Ad[]
  visitorPlans: VisitorPlan[]
  settings: Setting[]
  userEmail?: string
}) {
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const reviewWindowHours = getSettingValue<number>(settings, 'reviewWindowHours', 24)
  const visitorRewardPercent = getSettingValue<number>(settings, 'visitorRewardPercent', 40)
  const captchaTimeoutSeconds = getSettingValue<number>(settings, 'captchaTimeoutSeconds', 10)
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)

  const activeVisitorPlan =
    visitorPlans.find((p) => p.code === 'gold') ??
    visitorPlans.find((p) => p.isDefault) ??
    visitorPlans[0]
  const visitorMultiplier = activeVisitorPlan?.multiplier ?? 1
  const visitorPlanName = activeVisitorPlan?.name

  const [balance, setBalance] = React.useState(INITIAL_BALANCE_KN)
  const [todayEarnings, setTodayEarnings] = React.useState(0.0024)
  const [viewsToday, setViewsToday] = React.useState(3)
  const [viewedAds, setViewedAds] = React.useState<Record<string, number>>({})
  const [filter, setFilter] = React.useState<string>('todos')

  const [viewerOpen, setViewerOpen] = React.useState(false)
  const [currentAd, setCurrentAd] = React.useState<Ad | null>(null)
  const [currentPlan, setCurrentPlan] = React.useState<AdvertiserPlan | null>(null)

  // ---- G6 — pagination state (10 ads per page) -----------------------------
  const PAGE_SIZE = 10
  const [currentPage, setCurrentPage] = React.useState(1)
  const feedRef = React.useRef<HTMLDivElement | null>(null)

  // ---- G4-visitor — real-time polling state --------------------------------
  // `liveAds` is the polled active-ad feed (initialized from the server-
  // rendered `ads` prop so first paint is instant). `allAds` is polled from
  // /api/ads?status=all to derive active/paused/finished counts for the
  // sidebar "En vivo" card. `lastUpdated` drives the "hace Xs" label, and
  // `now` ticks every second so that label stays fresh.
  const [liveAds, setLiveAds] = React.useState<Ad[]>(ads)
  const [allAds, setAllAds] = React.useState<Ad[]>(ads)
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null)
  const [now, setNow] = React.useState(() => Date.now())
  const lastToastAtRef = React.useRef<number>(0)
  const prevLiveIdsRef = React.useRef<string>('')

  // ---- I5 — Top-rated ads + referral dashboard -----------------------------
  const [topRatedAds, setTopRatedAds] = React.useState<AdWithRatings[]>([])
  const [referralData, setReferralData] = React.useState<ReferralData | null>(null)
  const [referralLoading, setReferralLoading] = React.useState(false)

  const pollFeed = React.useCallback(async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch('/api/ads?status=active&limit=50', { cache: 'no-store' }),
        fetch('/api/ads?status=all&limit=200', { cache: 'no-store' }),
      ])
      if (activeRes.ok) {
        const data = await activeRes.json()
        const nextAds: Ad[] = Array.isArray(data) ? data : (data?.ads ?? [])
        setLiveAds(nextAds)
        // Debounced toast when the set of active ads actually changes.
        const nextIds = nextAds
          .map((a) => a.id)
          .sort()
          .join(',')
        if (prevLiveIdsRef.current && prevLiveIdsRef.current !== nextIds) {
          const t = Date.now()
          if (t - lastToastAtRef.current > 30_000) {
            lastToastAtRef.current = t
            toast.success('Feed actualizado', {
              description: 'Hay anuncios activos nuevos disponibles.',
            })
          }
        }
        prevLiveIdsRef.current = nextIds
      }
      if (allRes.ok) {
        const data = await allRes.json()
        const nextAll: Ad[] = Array.isArray(data) ? data : (data?.ads ?? [])
        setAllAds(nextAll)
      }
      setLastUpdated(Date.now())
    } catch {
      // Silent polling failure — keep the last known state and try again next tick.
    }
  }, [])

  // 15s polling interval — the parent already supplied the initial `ads`,
  // so we don't fire immediately on mount, only on each 15s tick afterwards.
  React.useEffect(() => {
    const id = window.setInterval(pollFeed, 15_000)
    return () => window.clearInterval(id)
  }, [pollFeed])

  // 1s ticker so "hace Xs" relative time stays fresh without rerendering the
  // whole feed (only the small sidebar card depends on `now`).
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // I5 — fetch top-rated ads (best avgStars) once on mount. Silent on failure
  // (the section just stays hidden when the array is empty).
  React.useEffect(() => {
    let cancelled = false
    fetch('/api/ads/top-rated?limit=6', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const next: AdWithRatings[] = Array.isArray(data) ? data : (data?.ads ?? [])
        setTopRatedAds(next)
      })
      .catch(() => {
        // silent — keep empty state, section hides itself
      })
    return () => {
      cancelled = true
    }
  }, [])

  // I5 — fetch the referral dashboard for the signed-in visitor. Only fires
  // when `userEmail` is provided by the parent. 404 (user not found) just
  // leaves referralData null so the card shows its fallback copy.
  React.useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    setReferralLoading(true)
    fetch(`/api/referrals?email=${encodeURIComponent(userEmail)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data && typeof data.referralLink === 'string') {
          setReferralData({
            referralLink: data.referralLink,
            level1Count: Number(data.level1Count ?? 0),
            level2Count: Number(data.level2Count ?? 0),
            totalEarningsKnight: Number(data.totalEarningsKnight ?? 0),
          })
        }
      })
      .catch(() => {
        // silent — card shows its "no se pudo cargar" fallback
      })
      .finally(() => {
        if (!cancelled) setReferralLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userEmail])

  // Active / paused / finished counts derived from the all-status poll.
  const liveCounts = React.useMemo(() => {
    let active = 0
    let paused = 0
    let finished = 0
    for (const a of allAds) {
      const s = String(a.status).toLowerCase()
      if (s === 'active') active++
      else if (s === 'paused') paused++
      else if (s === 'finished') finished++
    }
    return { active, paused, finished }
  }, [allAds])

  // Sort ads by plan.feedPriority desc (defensive — API already orders)
  const sortedAds = React.useMemo(() => {
    return [...liveAds].sort((a, b) => {
      const pa = a.plan?.feedPriority ?? 0
      const pb = b.plan?.feedPriority ?? 0
      if (pb !== pa) return pb - pa
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [liveAds])

  const filteredAds = React.useMemo(() => {
    if (filter === 'todos') return sortedAds
    return sortedAds.filter((a) => a.plan?.code === filter)
  }, [sortedAds, filter])

  // ---- G6 — derived pagination values -------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / PAGE_SIZE))
  // Defensive: if the filter or live feed shrank below the current page's
  // range, walk the page back so the UI never points at an empty page.
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [currentPage, totalPages])
  // Filter changes reset to page 1 (per spec).
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter])
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const paginatedAds = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredAds.slice(start, start + PAGE_SIZE)
  }, [filteredAds, safePage])
  const startIdx = filteredAds.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(safePage * PAGE_SIZE, filteredAds.length)

  // Visible page-number list with ellipsis on either side for big feeds.
  const pageRange: (number | 'ellipsis')[] = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const out: (number | 'ellipsis')[] = [1]
    if (safePage > 3) out.push('ellipsis')
    const from = Math.max(2, safePage - 1)
    const to = Math.min(totalPages - 1, safePage + 1)
    for (let i = from; i <= to; i++) out.push(i)
    if (safePage < totalPages - 2) out.push('ellipsis')
    out.push(totalPages)
    return out
  }, [safePage, totalPages])

  const handlePageChange = (next: number) => {
    const target = Math.min(Math.max(1, next), totalPages)
    setCurrentPage(target)
    // Smooth-scroll to the top of the feed so the user sees fresh ads.
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleView = (ad: Ad, plan: AdvertiserPlan) => {
    setCurrentAd(ad)
    setCurrentPlan(plan)
    setViewerOpen(true)
  }

  const handleComplete = () => {
    if (!currentAd || !currentPlan) return
    const reward =
      (currentPlan.priceKnight * (visitorRewardPercent / 100)) /
      currentPlan.viewsIncluded *
      visitorMultiplier
    setBalance((b) => b + reward)
    setTodayEarnings((e) => e + reward)
    setViewsToday((v) => v + 1)
    setViewedAds((prev) => ({ ...prev, [currentAd.id]: Date.now() }))
    // Toast + new-tab opening are handled inside ViewerModal.handleComplete
    // so the message can adapt to whether the ad link is openable
    // (`#` or empty → no new tab).
  }

  const rewardPreview = currentPlan
    ? (currentPlan.priceKnight * (visitorRewardPercent / 100)) /
      currentPlan.viewsIncluded *
      visitorMultiplier
    : 0

  const lastUpdatedSeconds = lastUpdated
    ? Math.max(0, Math.floor((now - lastUpdated) / 1000))
    : null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <VisitorWalletCard
          settings={settings}
          balance={balance}
          onWalletSet={() => {}}
        />

        {/* I5 — Referral dashboard (between wallet and plan card) */}
        {userEmail ? (
          <ReferralDashboardCard
            settings={settings}
            data={referralData}
            loading={referralLoading}
          />
        ) : (
          <ReferralDashboardCardPlaceholder />
        )}

        {/* G4-visitor — Real-time active-ads card with live indicator */}
        <Card className="glass border-emerald-500/20">
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-emerald-400" />
                <p className="text-sm font-medium text-foreground">
                  Anuncios activos en tiempo real
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                En vivo
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Activos
                </p>
                <p className="text-lg font-bold text-emerald-300 tabular-nums">
                  {liveCounts.active}
                </p>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.05] py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pausados
                </p>
                <p className="text-lg font-bold text-amber-300 tabular-nums">
                  {liveCounts.paused}
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/40 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Finalizados
                </p>
                <p className="text-lg font-bold text-muted-foreground tabular-nums">
                  {liveCounts.finished}
                </p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="size-3" />
              {lastUpdatedSeconds === null
                ? 'Esperando primera actualización…'
                : `Última actualización: hace ${lastUpdatedSeconds}s`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/20">
          <CardContent className="space-y-2 py-5">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-amber-400" />
              <p className="text-sm font-medium text-foreground">Vistas hoy</p>
            </div>
            <p className="text-3xl font-bold text-gradient-gold">{viewsToday}</p>
            <p className="text-xs text-muted-foreground">
              {activeVisitorPlan?.dailyViewsLimit === 0
                ? 'Sin límite diario en tu plan'
                : `Límite: ${activeVisitorPlan?.dailyViewsLimit ?? 0} por día`}
            </p>
          </CardContent>
        </Card>

        <ActiveVisitorPlanCard visitorPlans={visitorPlans} />
        <TodayEarningsCard todayEarnings={todayEarnings} priceUsd={priceUsd} />
      </aside>

      {/* Main */}
      <main className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient-gold">Feed de Anuncios</h2>
            <p className="text-sm text-muted-foreground">
              Gana {tokenSymbol} por cada vista verificada · Multiplicador ×{visitorMultiplier}
            </p>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-300">
            <Megaphone className="size-3.5" />
            {filteredAds.length} disponibles
          </Badge>
        </div>

        {/* I5 — Top-rated horizontal row (featured, above the paginated feed) */}
        <TopRatedRow
          ads={topRatedAds}
          visitorMultiplier={visitorMultiplier}
          visitorRewardPercent={visitorRewardPercent}
          onView={handleView}
        />

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          {PLAN_FILTERS.map((f) => {
            const isActive = filter === f.code
            return (
              <button
                key={f.code}
                type="button"
                onClick={() => setFilter(f.code)}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  isActive
                    ? 'border-amber-400/70 bg-amber-500/15 text-amber-300'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-amber-500/40 hover:text-foreground',
                ].join(' ')}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Ads feed — paginated, 10 per page (G6) */}
        <div ref={feedRef} className="scroll-mt-4">
          <div className="space-y-4 pb-4">
            {paginatedAds.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <X className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay anuncios que coincidan con este filtro.
                  </p>
                </CardContent>
              </Card>
            ) : (
              paginatedAds.map((ad) => {
                if (!ad.plan) return null
                return (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    plan={ad.plan}
                    onView={handleView}
                    visitorMultiplier={visitorMultiplier}
                    visitorPlanName={visitorPlanName}
                    visitorRewardPercent={visitorRewardPercent}
                    priceUsd={priceUsd}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* G6 — Pagination controls + range text */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/[0.06]"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              {pageRange.map((p, i) =>
                p === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1.5 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safePage ? 'default' : 'outline'}
                    size="sm"
                    className={
                      p === safePage
                        ? 'h-8 w-8 bg-gradient-gold p-0 text-primary-foreground font-semibold'
                        : 'h-8 w-8 border-border p-0 text-muted-foreground hover:text-foreground'
                    }
                    onClick={() => handlePageChange(p)}
                    aria-label={`Ir a página ${p}`}
                    aria-current={p === safePage ? 'page' : undefined}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/[0.06]"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mostrando {startIdx}–{endIdx} de {filteredAds.length} anuncios
            </p>
          </div>
        )}

        <ViewerModal
          ad={currentAd}
          plan={currentPlan}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          reward={rewardPreview}
          visitorMultiplier={visitorMultiplier}
          visitorPlanName={visitorPlanName}
          reviewWindowHours={reviewWindowHours}
          captchaTimeoutSeconds={captchaTimeoutSeconds}
          lastViewedAt={currentAd ? viewedAds[currentAd.id] ?? null : null}
          onComplete={handleComplete}
          priceUsd={priceUsd}
          visitorRewardPercent={visitorRewardPercent}
          currentBalance={balance}
          userLabel={userEmail}
        />
      </main>
    </div>
  )
}
