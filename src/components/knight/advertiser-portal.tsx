'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Megaphone,
  Wallet,
  ShieldCheck,
  Zap,
  ExternalLink,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Coins,
  ArrowUpRight,
  Clock,
  Film,
  Image as ImageIcon,
  Video,
  RectangleHorizontal,
  Gift,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

import {
  badgeClass,
  getSettingValue,
  formatUsd,
  knightToUsd,
} from '@/lib/knight-types'
import type { AdvertiserPlan, Setting } from '@/lib/knight-types'
import { PlanDiamonds } from '@/components/knight/plan-diamonds'

// ---------------------------------------------------------------------------
// Mock data — hardcoded inside the component (illustrative only)
// ---------------------------------------------------------------------------
const MOCK_WALLET_ADDRESS = '7Kn8G3Hght4F2qX9wzM4pLr5tNbV8dC2sEuY6RkJ1aPQ'
const MOCK_BALANCE_KN = 248.5
const MOCK_TOTAL_SPENT_KN = 62.5

type AdMediaType = 'image' | 'gif' | 'banner' | 'video'

interface MockAd {
  id: string
  title: string
  planCode: string
  status: 'active' | 'paused' | 'finished'
  viewsUsed: number
  ctr: number
  imageUrl?: string
  mediaType?: AdMediaType
}

const MOCK_ADS: MockAd[] = [
  {
    id: 'a1',
    title: 'Solana Summer Hackathon 2026',
    planCode: 'permanente',
    status: 'active',
    viewsUsed: 1342,
    ctr: 8.4,
    imageUrl: 'https://media.tenor.com/4sxSjZ1fXJIAAAAC/solana-crypto.gif',
    mediaType: 'gif',
  },
  {
    id: 'a2',
    title: 'Jupiter Exchange — Swap con 0% slippage',
    planCode: 'superior',
    status: 'active',
    viewsUsed: 980,
    ctr: 6.1,
    imageUrl: 'https://jup.ag/og-image.png',
    mediaType: 'image',
  },
  {
    id: 'a3',
    title: 'Phantom Wallet — Tu llave a Web3',
    planCode: 'alta',
    status: 'paused',
    viewsUsed: 410,
    ctr: 4.7,
    imageUrl: 'https://phantom.app/banner.html',
    mediaType: 'banner',
  },
  {
    id: 'a4',
    title: 'Café Web3 — Tu primer NFT de café',
    planCode: 'minimo',
    status: 'finished',
    viewsUsed: 1000,
    ctr: 3.2,
    imageUrl: 'https://media.tenor.com/cafe-web3.mp4',
    mediaType: 'video',
  },
]

// Maps a mediaType to its badge label (omitted when 'image')
function mediaBadgeLabel(type: AdMediaType | undefined): string | null {
  if (!type || type === 'image') return null
  if (type === 'gif') return 'GIF'
  if (type === 'video') return 'Video'
  if (type === 'banner') return 'Banner'
  return null
}

// Picks the right element for a media URL given its type.
function MediaThumb({
  src,
  mediaType,
  alt = 'Miniatura',
  className = 'h-full w-full object-cover',
}: {
  src: string
  mediaType?: AdMediaType
  alt?: string
  className?: string
}) {
  const type = mediaType ?? 'image'
  if (type === 'video') {
    return <video src={src} autoPlay loop muted playsInline className={className} />
  }
  if (type === 'banner') {
    return <iframe src={src} className={className} title={alt} />
  }
  return <img src={src} alt={alt} className={className} />
}

const VIEWS_CHART_DATA = [
  { day: 'Lun', views: 142 },
  { day: 'Mar', views: 218 },
  { day: 'Mié', views: 96 },
  { day: 'Jue', views: 245 },
  { day: 'Vie', views: 312 },
  { day: 'Sáb', views: 410 },
  { day: 'Dom', views: 388 },
]

const CAPTCHA_TILES = ['🚦', '🌳', '🚦', '🚗', '🏢', '🌳', '🚦', '🚗', '🌳']
const CAPTCHA_CORRECT_INDICES = [0, 2, 6]

const STATUS_META: Record<MockAd['status'], { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  paused: { label: 'Pausado', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  finished: { label: 'Finalizado', className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function formatKn(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Formats tiny per-view reward values with up to 6 fractional digits (e.g. 0.0004).
function formatKnReward(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

// Maps a plan's feedPriority (1-5) to a human label used in the feature checklist.
function feedPriorityLabel(priority: number): string {
  if (priority >= 5) return 'Privilegiada'
  if (priority >= 3) return 'Mejor'
  return 'Estándar'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WalletCard({ settings }: { settings: Setting[] }) {
  const [copied, setCopied] = React.useState(false)
  const jupiterEnabled = getSettingValue<boolean>(settings, 'jupiterEnabled', true)
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_WALLET_ADDRESS)
      setCopied(true)
      toast.success('Dirección copiada al portapapeles')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('No se pudo copiar la dirección')
    }
  }

  return (
    <Card className="glass glow-gold overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-gold flex size-10 items-center justify-center rounded-full text-primary-foreground">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet Anunciante</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-foreground">
                {truncateAddress(MOCK_WALLET_ADDRESS)}
              </code>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleCopy}
                    aria-label="Copiar dirección"
                  >
                    {copied ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar dirección completa</TooltipContent>
              </UITooltip>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo disponible</p>
          <p className="text-2xl font-bold text-gradient-gold">
            {formatKn(MOCK_BALANCE_KN)} {tokenSymbol}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ≈ {formatUsd(knightToUsd(MOCK_BALANCE_KN, priceUsd))} USD · 1 {tokenSymbol} ≈ {formatUsd(priceUsd)}
          </p>
        </div>

        {jupiterEnabled && (
          <Button
            asChild
            className="w-full bg-gradient-solana text-white font-semibold shadow-lg hover:opacity-90"
          >
            <a href="https://jup.ag" target="_blank" rel="noopener noreferrer">
              <Zap className="size-4" />
              Comprar {tokenSymbol} vía Jupiter (1 $Kn ≈ {formatUsd(priceUsd)})
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function QuickStatsCard({ plans, ads }: { plans: AdvertiserPlan[]; ads: MockAd[] }) {
  const activeAds = ads.filter((a) => a.status === 'active')
  const vistasCompradas = ads.reduce((acc, a) => {
    const p = plans.find((x) => x.code === a.planCode)
    return acc + (p?.viewsIncluded ?? 0)
  }, 0)
  const vistasRestantes = ads.reduce((acc, a) => {
    const p = plans.find((x) => x.code === a.planCode)
    if (!p) return acc
    return acc + Math.max(0, p.viewsIncluded - a.viewsUsed)
  }, 0)

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="size-4 text-amber-400" />
          Resumen rápido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-amber-500/5 p-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="size-4 text-amber-400" />
            Anuncios activos
          </span>
          <span className="font-bold text-foreground">{activeAds.length}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 p-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="size-4 text-emerald-400" />
            Total gastado
          </span>
          <span className="font-bold text-foreground">{formatKn(MOCK_TOTAL_SPENT_KN)} $Kn</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-sky-500/5 p-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-sky-400" />
            Vistas compradas
          </span>
          <span className="font-bold text-foreground">{vistasCompradas.toLocaleString('es-ES')}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-violet-500/5 p-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 text-violet-400" />
            Vistas restantes
          </span>
          <span className="font-bold text-foreground">{vistasRestantes.toLocaleString('es-ES')}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function AdsTable({
  plans,
  settings,
  ads,
  setAds,
}: {
  plans: AdvertiserPlan[]
  settings: Setting[]
  ads: MockAd[]
  setAds: React.Dispatch<React.SetStateAction<MockAd[]>>
}) {
  const [relaunchAd, setRelaunchAd] = React.useState<MockAd | null>(null)

  const togglePause = (id: string) => {
    setAds((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const next = a.status === 'active' ? 'paused' : a.status === 'paused' ? 'active' : a.status
        if (next === 'paused') toast.success('Anuncio pausado. No se mostrará en el feed.')
        else if (next === 'active') toast.success('Anuncio reanudado. Visible en el feed.')
        return { ...a, status: next as MockAd['status'] }
      }),
    )
  }

  // Relaunch: apply the newly purchased plan to the mock ad, reset views and
  // flip status back to 'active' so it re-enters the feed.
  const handleRelaunch = (adId: string, planCode: string) => {
    setAds((prev) =>
      prev.map((a) =>
        a.id === adId ? { ...a, status: 'active', planCode, viewsUsed: 0 } : a,
      ),
    )
    setRelaunchAd(null)
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Megaphone className="size-5 text-amber-400" />
            Mis Anuncios
          </span>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {ads.length} totales
          </Badge>
        </CardTitle>
        <CardDescription>Gestiona tus campañas publicitarias activas e históricas.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-6">Miniatura</TableHead>
                <TableHead>Anuncio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="min-w-[160px]">Vistas</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => {
                const plan = plans.find((p) => p.code === ad.planCode)
                if (!plan) return null
                const total = plan.viewsIncluded
                const used = ad.viewsUsed
                const pct = Math.min(100, Math.round((used / total) * 100))
                const statusMeta = STATUS_META[ad.status]
                const isFinished = ad.status === 'finished'
                return (
                  <TableRow
                    key={ad.id}
                    className={[
                      'border-border/40 transition-colors',
                      isFinished ? 'bg-slate-500/[0.05]' : '',
                    ].join(' ')}
                  >
                    <TableCell className="py-2 pl-6">
                      <div className="relative size-14 overflow-hidden rounded border border-border/60 bg-secondary/60">
                        {ad.imageUrl ? (
                          <MediaThumb
                            src={ad.imageUrl}
                            mediaType={ad.mediaType}
                            alt={`Miniatura — ${ad.title}`}
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground/40">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                        {mediaBadgeLabel(ad.mediaType) && (
                          <Badge
                            className="absolute right-0.5 top-0.5 h-4 gap-0.5 px-1 text-[9px] font-bold uppercase tracking-wide border-amber-500/40 bg-amber-500/85 text-amber-950"
                          >
                            {ad.mediaType === 'video' && <Video className="size-2.5" />}
                            {ad.mediaType === 'gif' && <Film className="size-2.5" />}
                            {ad.mediaType === 'banner' && <RectangleHorizontal className="size-2.5" />}
                            {mediaBadgeLabel(ad.mediaType)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] py-2">
                      <p className="truncate text-xs font-medium text-foreground" title={ad.title}>
                        {ad.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{plan.viewSeconds}s por vista</p>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`${badgeClass(plan.badgeColor)} text-[10px]`}>{plan.name}</Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={`${statusMeta.className} text-[10px]`}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="space-y-1">
                        <Progress value={pct} className="h-1" />
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {used.toLocaleString('es-ES')} / {total.toLocaleString('es-ES')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums text-foreground">
                      {ad.ctr.toFixed(1)}%
                    </TableCell>
                    <TableCell className="py-2 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isFinished && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-border text-xs"
                            onClick={() => togglePause(ad.id)}
                          >
                            {ad.status === 'paused' ? (
                              <>
                                <RefreshCw className="size-3" /> Reanudar
                              </>
                            ) : (
                              <>
                                <RefreshCw className="size-3" /> Pausar
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isFinished ? 'default' : 'outline'}
                          className={[
                            'h-7 gap-1 text-xs font-semibold',
                            isFinished
                              ? 'bg-gradient-gold text-primary-foreground shadow-md hover:opacity-90'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20',
                          ].join(' ')}
                          onClick={() => setRelaunchAd(ad)}
                          aria-label={`Relanzar anuncio: ${ad.title}`}
                        >
                          <RefreshCw className="size-3" /> Relanzar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Relaunch dialog — buy a new plan for an existing ad */}
      <RelaunchAdDialog
        ad={relaunchAd}
        plans={plans}
        settings={settings}
        open={!!relaunchAd}
        onOpenChange={(o) => !o && setRelaunchAd(null)}
        onRelaunch={handleRelaunch}
      />
    </Card>
  )
}

function MetricsChart() {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="size-4 text-amber-400" />
          Métricas — últimas 7 días
        </CardTitle>
        <CardDescription>Vistas servidas por día en todos tus anuncios activos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={VIEWS_CHART_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="knightBarGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.16 75)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="oklch(0.65 0.20 40)" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'oklch(0.68 0.02 264)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'oklch(0.68 0.02 264)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <RechartsTooltip
                cursor={{ fill: 'oklch(0.78 0.16 75 / 8%)' }}
                contentStyle={{
                  background: 'oklch(0.16 0.02 264)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  borderRadius: '0.5rem',
                  color: 'oklch(0.97 0.012 90)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="views" fill="url(#knightBarGold)" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Reusable plan radio card — used in PublishDialog step 1 AND RelaunchAdDialog
// Renders plan name + diamonds, prominent description (line-clamp-3), a 4-item
// feature checklist derived from plan data, and the price/views/duration grid.
// ---------------------------------------------------------------------------

function PlanRadioCard({
  plan,
  settings,
  isSelected,
  idPrefix = 'plan',
}: {
  plan: AdvertiserPlan
  settings: Setting[]
  isSelected: boolean
  idPrefix?: string
}) {
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)
  const visitorRewardPercent = getSettingValue<number>(settings, 'visitorRewardPercent', 30)

  // Per-view visitor reward = priceKnight × visitorRewardPercent% / viewsIncluded.
  // Reads visitorRewardPercent from settings so it stays in sync with the admin's
  // global economic config.
  const perViewReward = plan.viewsIncluded > 0
    ? (plan.priceKnight * (visitorRewardPercent / 100)) / plan.viewsIncluded
    : 0

  const features = [
    `${plan.viewsIncluded.toLocaleString('es-ES')} vistas prepagadas`,
    `${plan.viewSeconds}s de visualización garantizada`,
    `Posición en feed: ${feedPriorityLabel(plan.feedPriority)}`,
    `Reward por vista: ${formatKnReward(perViewReward)} ${tokenSymbol}`,
  ]

  const radioId = `${idPrefix}-${plan.code}`

  return (
    <Label
      htmlFor={radioId}
      className={[
        'group relative cursor-pointer rounded-xl border p-4 transition',
        isSelected
          ? 'border-amber-400/80 bg-amber-500/5 glow-gold'
          : 'border-border bg-card/40 hover:border-amber-500/40 hover:bg-amber-500/[0.03]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={badgeClass(plan.badgeColor)}>{plan.name}</Badge>
            <PlanDiamonds count={plan.diamondCount} size={14} />
            {plan.isPermanent && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                Permanente
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {plan.description}
          </p>
        </div>
        <RadioGroupItem id={radioId} value={plan.code} className="mt-1 shrink-0" />
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="size-3 shrink-0 text-emerald-400" aria-hidden />
            <span className="truncate">{f}</span>
          </li>
        ))}
      </ul>

      <Separator className="my-3" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Precio</p>
          <p className="text-sm font-bold text-gradient-gold">
            {formatKn(plan.priceKnight)} {tokenSymbol}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            ≈ {formatUsd(knightToUsd(plan.priceKnight, priceUsd))} USD
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vistas</p>
          <p className="text-sm font-semibold text-foreground">
            {plan.viewsIncluded.toLocaleString('es-ES')}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duración</p>
          <p className="text-sm font-semibold text-foreground">{plan.viewSeconds}s</p>
        </div>
      </div>
    </Label>
  )
}

// ---------------------------------------------------------------------------
// Publish Dialog — multi-step form
// ---------------------------------------------------------------------------

function PublishDialog({
  plans,
  settings,
  open,
  onOpenChange,
}: {
  plans: AdvertiserPlan[]
  settings: Setting[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedPlanCode, setSelectedPlanCode] = React.useState<string>(plans[0]?.code ?? '')
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [link, setLink] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [mediaType, setMediaType] = React.useState<AdMediaType>('image')
  const [notARobot, setNotARobot] = React.useState(false)
  const [selectedTiles, setSelectedTiles] = React.useState<Set<number>>(new Set())
  const [captchaVerified, setCaptchaVerified] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)
  const visitorRewardPercent = getSettingValue<number>(settings, 'visitorRewardPercent', 40)
  const commissionPercent = getSettingValue<number>(settings, 'commissionPercent', 60)
  const selectedPlan = plans.find((p) => p.code === selectedPlanCode)
  const totalCost = selectedPlan?.priceKnight ?? 0
  const totalCostUsd = knightToUsd(totalCost, priceUsd)
  const visitorsShare = (totalCost * visitorRewardPercent) / 100
  const platformShare = (totalCost * commissionPercent) / 100

  const reset = () => {
    setStep(1)
    setTitle('')
    setContent('')
    setLink('')
    setImageUrl('')
    setMediaType('image')
    setNotARobot(false)
    setSelectedTiles(new Set())
    setCaptchaVerified(false)
    setSubmitting(false)
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      reset()
    }
    onOpenChange(next)
  }

  const captchaValid =
    selectedTiles.size === CAPTCHA_CORRECT_INDICES.length &&
    CAPTCHA_CORRECT_INDICES.every((i) => selectedTiles.has(i))

  const step1Valid = !!selectedPlanCode
  const step2Valid = title.trim().length >= 3 && content.trim().length >= 10 && link.trim().length > 0
  const step3Valid = notARobot && captchaValid

  const toggleTile = (idx: number) => {
    setSelectedTiles((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setCaptchaVerified(false)
  }

  const handleSubmit = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      toast.success('Anuncio enviado a moderación. Será visible tras aprobación.')
      reset()
      onOpenChange(false)
    }, 600)
  }

  const stepLabels = ['Plan', 'Contenido', 'Verificación']

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="glass-strong border-amber-500/20 p-0 sm:max-w-2xl glow-gold">
        <DialogHeader className="space-y-3 border-b border-border/60 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="size-5 text-amber-400" />
            Publicar nuevo anuncio
          </DialogTitle>
          <DialogDescription>
            Sigue los 3 pasos para lanzar tu campaña. Revisión manual antes de visible en el feed.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-1">
            {stepLabels.map((label, idx) => {
              const n = (idx + 1) as 1 | 2 | 3
              const isActive = step === n
              const isComplete = step > n
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={[
                      'flex size-6 items-center justify-center rounded-full text-xs font-bold transition',
                      isComplete
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : isActive
                          ? 'bg-gradient-gold text-primary-foreground'
                          : 'bg-muted text-muted-foreground border border-border',
                    ].join(' ')}
                  >
                    {isComplete ? <CheckCircle2 className="size-3.5" /> : n}
                  </div>
                  <span
                    className={[
                      'text-xs font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <div className="h-px flex-1 bg-border/60" />
                  )}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <p className="mb-3 text-sm text-muted-foreground">
                  Elige el plan que mejor se adapte a tu campaña. Cada plan es 1:1 con tu anuncio.
                </p>
                <RadioGroup
                  value={selectedPlanCode}
                  onValueChange={setSelectedPlanCode}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {plans.map((plan) => (
                    <PlanRadioCard
                      key={plan.id}
                      plan={plan}
                      settings={settings}
                      isSelected={plan.code === selectedPlanCode}
                      idPrefix="publish-plan"
                    />
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="ad-title">Título del anuncio *</Label>
                  <Input
                    id="ad-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Lanzamiento exclusivo NFT colección Caballeros"
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">{title.length}/80 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-content">Contenido *</Label>
                  <Textarea
                    id="ad-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe tu oferta en 1-3 frases concisas."
                    rows={4}
                    maxLength={280}
                  />
                  <p className="text-xs text-muted-foreground">{content.length}/280 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-link">Enlace de destino *</Label>
                  <Input
                    id="ad-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://tuproyecto.com"
                    type="url"
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-amber-400" />
                    <Label className="text-sm font-medium text-foreground">Medio visual</Label>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                      Opcional
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="space-y-1.5">
                      <Label htmlFor="ad-media-type" className="text-xs text-muted-foreground">
                        Tipo de medio
                      </Label>
                      <Select
                        value={mediaType}
                        onValueChange={(v: string) => setMediaType(v as AdMediaType)}
                      >
                        <SelectTrigger id="ad-media-type" className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">
                            <span className="flex items-center gap-2">
                              <ImageIcon className="size-3.5" /> Imagen
                            </span>
                          </SelectItem>
                          <SelectItem value="gif">
                            <span className="flex items-center gap-2">
                              <Film className="size-3.5" /> GIF animado
                            </span>
                          </SelectItem>
                          <SelectItem value="banner">
                            <span className="flex items-center gap-2">
                              <RectangleHorizontal className="size-3.5" /> Banner HTML5
                            </span>
                          </SelectItem>
                          <SelectItem value="video">
                            <span className="flex items-center gap-2">
                              <Video className="size-3.5" /> Video (.mp4)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ad-image" className="text-xs text-muted-foreground">
                        URL del medio visual
                      </Label>
                      <Input
                        id="ad-image"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder={
                          mediaType === 'banner'
                            ? 'https://tuproyecto.com/banner.html'
                            : mediaType === 'video'
                              ? 'https://tuproyecto.com/clip.mp4'
                              : mediaType === 'gif'
                                ? 'https://tuproyecto.com/banner.gif'
                                : 'https://tuproyecto.com/banner.png'
                        }
                        type="url"
                      />
                    </div>
                  </div>
                  {mediaType === 'banner' && (
                    <p className="text-xs text-amber-300/80">
                      Proporciona URL de un banner HTML5 iframe (HTML/SVG/Canvas cargable enmarcado).
                    </p>
                  )}
                  {imageUrl.trim() ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-secondary/40">
                      <MediaThumb
                        src={imageUrl.trim()}
                        mediaType={mediaType}
                        alt="Vista previa del medio visual"
                        className="h-full w-full object-cover"
                      />
                      {mediaBadgeLabel(mediaType) && (
                        <Badge className="absolute right-1 top-1 h-5 gap-0.5 px-1.5 text-[10px] font-bold uppercase tracking-wide border-amber-500/40 bg-amber-500/85 text-amber-950">
                          {mediaType === 'video' && <Video className="size-3" />}
                          {mediaType === 'gif' && <Film className="size-3" />}
                          {mediaType === 'banner' && <RectangleHorizontal className="size-3" />}
                          {mediaBadgeLabel(mediaType)}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border/60 text-muted-foreground/60">
                      <div className="flex flex-col items-center gap-1.5">
                        <ImageIcon className="size-6" />
                        <span className="text-xs">Vista previa del medio visual</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Verificación anti-bot obligatoria. Selecciona todas las casillas con semáforos 🚦.
                  </p>

                  <div className="space-y-3 rounded-lg border border-border bg-card/40 p-3">
                    <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-amber-500/[0.04]">
                      <Checkbox
                        checked={notARobot}
                        onCheckedChange={(v) => setNotARobot(v === true)}
                      />
                      <span className="text-sm font-medium">No soy un robot</span>
                      <ShieldCheck
                        className={[
                          'ml-auto size-4',
                          notARobot ? 'text-emerald-400' : 'text-muted-foreground',
                        ].join(' ')}
                      />
                    </label>

                    <Separator />

                    <div>
                      <p className="mb-2 text-xs font-medium text-foreground">
                        Selecciona todas las imágenes con <span className="text-amber-300">semáforos</span>:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {CAPTCHA_TILES.map((emoji, idx) => {
                          const isSelected = selectedTiles.has(idx)
                          const isCorrect = CAPTCHA_CORRECT_INDICES.includes(idx)
                          const showFeedback = captchaVerified
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleTile(idx)}
                              className={[
                                'flex aspect-square items-center justify-center rounded-md border text-3xl transition',
                                showFeedback && isCorrect && isSelected
                                  ? 'border-emerald-400/80 bg-emerald-500/15'
                                  : showFeedback && !isCorrect && isSelected
                                    ? 'border-rose-400/80 bg-rose-500/15'
                                    : isSelected
                                      ? 'border-amber-400/80 bg-amber-500/15'
                                      : 'border-border bg-muted/40 hover:border-amber-500/40 hover:bg-amber-500/[0.05]',
                              ].join(' ')}
                              aria-label={`Casilla ${idx + 1}: ${emoji}`}
                            >
                              {emoji}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {selectedTiles.size} seleccionadas · {CAPTCHA_CORRECT_INDICES.length} correctas
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-border text-xs"
                          disabled={!captchaValid || captchaVerified}
                          onClick={() => {
                            setCaptchaVerified(true)
                            if (captchaValid) toast.success('Captcha verificado correctamente.')
                          }}
                        >
                          {captchaVerified ? (
                            <>
                              <CheckCircle2 className="size-3.5 text-emerald-400" /> Verificado
                            </>
                          ) : (
                            'Verificar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Resumen del pago</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan seleccionado</span>
                      <span className="font-medium text-foreground">{selectedPlan?.name ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vistas incluidas</span>
                      <span className="font-medium text-foreground">
                        {selectedPlan?.viewsIncluded.toLocaleString('es-ES') ?? 0}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="size-3.5 text-emerald-400" /> Reward visitantes ({visitorRewardPercent}%)
                      </span>
                      <span className="text-right">
                        <span className="block font-bold text-emerald-300">
                          {formatKn(visitorsShare)} {tokenSymbol}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          ≈ {formatUsd(knightToUsd(visitorsShare, priceUsd))} USD
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <ShieldCheck className="size-3.5 text-amber-400" /> Comisión plataforma ({commissionPercent}%)
                      </span>
                      <span className="text-right">
                        <span className="block font-bold text-amber-300">
                          {formatKn(platformShare)} {tokenSymbol}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          ≈ {formatUsd(knightToUsd(platformShare, priceUsd))} USD
                        </span>
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-foreground">Total a pagar</span>
                      <span className="text-right">
                        <span className="block text-lg font-bold text-gradient-gold">
                          {formatKn(totalCost)} {tokenSymbol}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          ≈ {formatUsd(totalCostUsd)} USD
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => (step === 1 ? handleClose(false) : setStep((s) => (s - 1) as 1 | 2 | 3))}
            >
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </Button>
            {step < 3 ? (
              <Button
                className="bg-gradient-gold text-primary-foreground font-semibold"
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              >
                Continuar
                <ArrowUpRight className="size-4" />
              </Button>
            ) : (
              <Button
                className="bg-gradient-gold text-primary-foreground font-semibold"
                disabled={!step3Valid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Publicar anuncio
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Relaunch Ad Dialog — buy a new plan for an existing ad (Task G3)
// ---------------------------------------------------------------------------

function RelaunchAdDialog({
  ad,
  plans,
  settings,
  open,
  onOpenChange,
  onRelaunch,
}: {
  ad: MockAd | null
  plans: AdvertiserPlan[]
  settings: Setting[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRelaunch: (adId: string, planCode: string) => void
}) {
  const [selectedPlanCode, setSelectedPlanCode] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')
  const priceUsd = getSettingValue<number>(settings, 'knightPriceUsd', 0.05)

  // When the dialog opens (or the target ad changes), preselect a sensible plan:
  // - For finished ads: suggest the next-higher tier to upsell (fall back to current / first).
  // - For active/paused ads: keep the current plan as the starting selection.
  React.useEffect(() => {
    if (open && ad) {
      const currentIdx = plans.findIndex((p) => p.code === ad.planCode)
      const fallback = plans[currentIdx] ?? plans[0]
      const nextPlan = ad.status === 'finished'
        ? (plans[currentIdx + 1] ?? fallback)
        : fallback
      setSelectedPlanCode(nextPlan?.code ?? plans[0]?.code ?? '')
      setSubmitting(false)
    }
  }, [open, ad, plans])

  if (!ad) return null

  const selectedPlan = plans.find((p) => p.code === selectedPlanCode)
  const currentPlan = plans.find((p) => p.code === ad.planCode)
  const totalCost = selectedPlan?.priceKnight ?? 0
  const totalCostUsd = knightToUsd(totalCost, priceUsd)

  const handleSubmit = () => {
    if (!selectedPlan) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      toast.success(`Plan adquirido. El anuncio ha sido relanzado con ${selectedPlan.name}.`)
      onRelaunch(ad.id, selectedPlan.code)
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-amber-500/20 p-0 sm:max-w-2xl glow-gold">
        <DialogHeader className="space-y-3 border-b border-border/60 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="size-5 text-amber-400" />
            Relanzar Anuncio
          </DialogTitle>
          <DialogDescription>
            Compra un nuevo plan para reactivar tu anuncio y volver a aparecer en el feed.
          </DialogDescription>
        </DialogHeader>

        {/* Ad header — what's being relanzado */}
        <div className="mx-6 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border/60 bg-secondary/60">
              {ad.imageUrl ? (
                <MediaThumb
                  src={ad.imageUrl}
                  mediaType={ad.mediaType}
                  alt={`Miniatura — ${ad.title}`}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground/40">
                  <ImageIcon className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground" title={ad.title}>
                {ad.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_META[ad.status].className}>
                  {STATUS_META[ad.status].label}
                </Badge>
                {currentPlan ? (
                  <Badge className={badgeClass(currentPlan.badgeColor)}>
                    Plan actual: {currentPlan.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Plan actual: —
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan selection (reuses PlanRadioCard with description + checklist) */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Elige el nuevo plan para tu anuncio. Cada plan es 1:1 con el anuncio.
          </p>
          <RadioGroup
            value={selectedPlanCode}
            onValueChange={setSelectedPlanCode}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {plans.map((plan) => (
              <PlanRadioCard
                key={plan.id}
                plan={plan}
                settings={settings}
                isSelected={plan.code === selectedPlanCode}
                idPrefix="relaunch-plan"
              />
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Nuevo costo
              </p>
              <p className="text-lg font-bold text-gradient-gold">
                {formatKn(totalCost)} {tokenSymbol}
              </p>
              <p className="text-xs text-muted-foreground">≈ {formatUsd(totalCostUsd)} USD</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-gold text-primary-foreground font-semibold"
                disabled={!selectedPlan || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Procesando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Relanzar anuncio
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Referral link card — sidebar share widget
// ---------------------------------------------------------------------------

function ReferralCard({
  settings,
  userEmail,
}: {
  settings: Setting[]
  userEmail?: string
}) {
  const level1Percent = getSettingValue<number>(settings, 'referralLevel1Percent', 5)
  const referralRewardKnight = getSettingValue<number>(settings, 'referralRewardKnight', 100)
  const referralEnabled = getSettingValue<boolean>(settings, 'referralEnabled', true)
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')

  // Demo referral code generated client-side. When a real userEmail is
  // provided we fetch the user's actual code from /api/referrals and use it.
  const [refCode] = React.useState(
    () => 'KN' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  )
  const [link, setLink] = React.useState(`https://knight-ads.demo/?ref=${refCode}`)
  const [loading, setLoading] = React.useState(!!userEmail)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    fetch(`/api/referrals?email=${encodeURIComponent(userEmail)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const code = data.user?.referralCode ?? refCode
        setLink(`https://knight-ads.demo/?ref=${code}`)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userEmail, refCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Enlace de referido copiado al portapapeles')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  if (!referralEnabled) return null

  return (
    <Card className="glass border-amber-500/20">
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-amber-400" />
          <p className="text-sm font-medium text-foreground">Tu enlace de referido</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Comparte tu enlace y gana{' '}
          <span className="font-semibold text-amber-300">{level1Percent}%</span> de los
          ingresos de tus referidos de por vida.
        </p>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-1.5">
          <code className="min-w-0 flex-1 truncate px-1.5 text-xs text-foreground">
            {loading ? 'Cargando…' : link}
          </code>
          <UITooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={handleCopy}
                aria-label="Copiar enlace"
                disabled={loading}
              >
                {copied ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar enlace de referido</TooltipContent>
          </UITooltip>
        </div>
        <p className="text-[10px] text-muted-foreground">
          🎁 Cada nuevo referido recibe {referralRewardKnight} {tokenSymbol} de bienvenida.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdvertiserPortal({
  plans,
  settings,
  userEmail,
}: {
  plans: AdvertiserPlan[]
  settings: Setting[]
  userEmail?: string
}) {
  const [publishOpen, setPublishOpen] = React.useState(false)
  const tokenSymbol = getSettingValue<string>(settings, 'tokenSymbol', '$Knight')

  // Single source of truth for the advertiser's ads — lifted up so the
  // sidebar quick stats AND the table stay in sync. Pause / relaunch mutate
  // this state and the counts recompute reactively (no hardcoded counters
  // that can drift out of sync with the actual table rows).
  const [ads, setAds] = React.useState<MockAd[]>(MOCK_ADS)
  const activeCount = ads.filter((a) => a.status === 'active').length
  const pausedCount = ads.filter((a) => a.status === 'paused').length
  const finishedCount = ads.filter((a) => a.status === 'finished').length

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
        <WalletCard settings={settings} />

        <Card className="glass border-amber-500/20">
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-amber-400" />
              <p className="text-sm font-medium text-foreground">Mis anuncios</p>
            </div>
            <p className="text-3xl font-bold text-gradient-gold">
              {activeCount}{' '}
              <span className="text-base font-medium text-muted-foreground">activos</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-500/5 p-2 text-center">
                <span className="mx-auto mb-1 block size-1.5 rounded-full bg-emerald-400" />
                <p className="text-lg font-bold text-emerald-300">{activeCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Activos
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/5 p-2 text-center">
                <span className="mx-auto mb-1 block size-1.5 rounded-full bg-amber-400" />
                <p className="text-lg font-bold text-amber-300">{pausedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pausados
                </p>
              </div>
              <div className="rounded-lg bg-slate-500/5 p-2 text-center">
                <span className="mx-auto mb-1 block size-1.5 rounded-full bg-slate-400" />
                <p className="text-lg font-bold text-slate-300">{finishedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Finaliz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReferralCard settings={settings} userEmail={userEmail} />

        <QuickStatsCard plans={plans} ads={ads} />
      </aside>

      {/* Main */}
      <main className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient-gold">Mis Anuncios</h2>
            <p className="text-sm text-muted-foreground">
              Panel del anunciante · Saldo: {formatKn(MOCK_BALANCE_KN)} {tokenSymbol}
            </p>
          </div>
          <Button
            className="bg-gradient-gold text-primary-foreground font-semibold shadow-lg hover:opacity-90"
            onClick={() => setPublishOpen(true)}
          >
            <Plus className="size-4" />
            Publicar nuevo anuncio
          </Button>
        </div>

        <AdsTable plans={plans} settings={settings} ads={ads} setAds={setAds} />
        <MetricsChart />

        <PublishDialog
          plans={plans}
          settings={settings}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      </main>
    </div>
  )
}
