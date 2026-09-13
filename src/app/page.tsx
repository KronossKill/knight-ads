'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Megaphone,
  Eye,
  EyeOff,
  Settings2,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Github,
  Twitter,
  Send,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Coins,
  Globe,
  Lock,
  LogOut,
  KeyRound,
  Fingerprint,
  User,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import {
  HeroSection,
  WhatIsSection,
  SchemesSection,
  HowItWorksSection,
  AdvertiserPlansSection,
  TopRatedSection,
  ReferralCtaSection,
  TransparencySection,
  FaqSection,
  CtaBandSection,
} from "@/components/knight/landing-sections"
import AdvertiserPortal from "@/components/knight/advertiser-portal"
import VisitorPortal from "@/components/knight/visitor-portal"
import AdminPortal from "@/components/knight/admin-portal"
import { SideRail, useSideAds } from "@/components/knight/side-rail"
import { AuthGate, type AuthUser } from "@/components/knight/auth-gate"
import { usePriceFeed } from "@/components/knight/use-price-feed"
import { ArchitectureSection } from "@/components/knight/architecture-section"

import type {
  AdvertiserPlan,
  VisitorPlan,
  TreasuryAccount,
  Ad,
  Setting,
  PlatformStats,
  AdWithRatings,
} from "@/lib/knight-types"
import { getSettingValue } from "@/lib/knight-types"

type View = "inicio" | "anunciante" | "visitante" | "admin" | "transparencia"
type CtaRole = "anunciante" | "visitante"

function HomeContent() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>("inicio")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Auth state — any portal operation requires login
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authGate, setAuthGate] = useState<{ open: boolean; role: CtaRole }>({ open: false, role: "visitante" })

  // Hidden admin access gate
  const [adminGateOpen, setAdminGateOpen] = useState(false)
  const copyrightClickTimes = useRef<number[]>([])

  // Config / data
  const [settings, setSettings] = useState<Setting[]>([])
  const [advertiserPlans, setAdvertiserPlans] = useState<AdvertiserPlan[]>([])
  const [visitorPlans, setVisitorPlans] = useState<VisitorPlan[]>([])
  const [treasury, setTreasury] = useState<TreasuryAccount[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Real-time polling state — live ad feed + status counts (paused/finished)
  const [allAds, setAllAds] = useState<Ad[]>([])
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [now, setNow] = useState<number>(Date.now())
  const prevActiveCountRef = useRef<number | null>(null)
  const lastToastRef = useRef<number>(0)

  // Side-rail ads (admin-configured)
  const { left: leftAds, right: rightAds } = useSideAds()

  // Live $Knight USD price feed (Jupiter API + manual fallback)
  const { price: priceFeed, loading: priceLoading } = usePriceFeed()
  const priceUsd = priceFeed?.priceUsd ?? 0.05

  // Top-rated ads (best-rated with active plan)
  const [topRatedAds, setTopRatedAds] = useState<AdWithRatings[]>([])

  // Cache stats (for the Architecture section in Transparencia)
  const [cacheStats, setCacheStats] = useState<{ hits: number; misses: number; hitRate: string; entries: number } | undefined>(undefined)
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [cfg, adsR, statsR, topR, allR, cacheR] = await Promise.all([
        fetch("/api/config", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/ads?status=active&limit=50", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/ads/top-rated?limit=6", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ ads: [] })),
        fetch("/api/ads?status=all&limit=200", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ ads: [] })),
        fetch("/api/cache/stats", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ])
      if (cancelled) return
      setSettings(cfg.settings ?? [])
      setAdvertiserPlans(cfg.advertiserPlans ?? [])
      setVisitorPlans(cfg.visitorPlans ?? [])
      setTreasury(cfg.treasury ?? [])
      const initialAds: Ad[] = adsR.ads ?? []
      setAds(initialAds)
      setStats(statsR)
      setTopRatedAds(topR.ads ?? [])
      setAllAds(allR.ads ?? [])
      if (cacheR && typeof cacheR.hits === "number") setCacheStats(cacheR)
      prevActiveCountRef.current = initialAds.length
      setLastRefresh(Date.now())
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [tick])

  // Real-time polling — every 20s (only while the tab is visible) refresh:
  //   • /api/ads?status=active  → live ad feed (Visitor portal)
  //   • /api/stats              → aggregate counts (Transparency section)
  //   • /api/ads?status=all     → all statuses so PortalHeader can show
  //                              paused / finished counts in real time.
  // Toasts when the active ad count changes — debounced (max 1 toast / 30s).
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      Promise.all([
        fetch("/api/ads?status=active&limit=50", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/ads?status=all&limit=200", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ ads: [] })),
      ]).then(([activeR, statsR, allR]) => {
        const newActive: Ad[] = activeR.ads ?? []
        setAds(newActive)
        setStats(statsR ?? null)
        setAllAds(allR.ads ?? [])
        setLastRefresh(Date.now())
        // Subtle toast when the active ad count changes (debounced — max 1 / 30s)
        const prev = prevActiveCountRef.current
        const curr = newActive.length
        if (prev !== null && prev !== curr) {
          const t = Date.now()
          if (t - lastToastRef.current > 30_000) {
            lastToastRef.current = t
            toast.success("Feed actualizado en tiempo real", {
              description: prev < curr
                ? "Un nuevo anuncio activo está disponible."
                : "Un anuncio finalizó su paquete de vistas.",
            })
          }
        }
        prevActiveCountRef.current = curr
      })
    }, 20_000)
    return () => clearInterval(interval)
  }, [])

  // 1-second tick — drives the "hace Xs" relative time display in the navbar
  // and inside PortalHeader's live stats badges.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Refetch data when entering portals that mutate
  useEffect(() => {
    if (view === "admin" || view === "anunciante" || view === "visitante") {
      refetch()
    }
  }, [view, refetch])

  // Hidden admin access via ?admin=1 query param
  useEffect(() => {
    if (searchParams.get("admin") === "1") {
      setAdminGateOpen(true)
    }
  }, [searchParams])

  // Footer easter-egg: 3 rapid clicks on copyright unlocks admin gate (handled in onClick, no effect needed)
  const handleCopyrightClick = useCallback(() => {
    const now = Date.now()
    copyrightClickTimes.current = [...copyrightClickTimes.current.filter((t) => now - t < 1500), now]
    if (copyrightClickTimes.current.length >= 3) {
      copyrightClickTimes.current = []
      setAdminGateOpen(true)
      toast.info("Acceso administrativo detectado", { description: "Introduce la frase de paso para continuar." })
    }
  }, [])

  const brandName = getSettingValue<string>(settings, "brandName", "Knight Ads")
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight")
  const networkName = getSettingValue<string>(settings, "networkName", "Solana")

  // Live status counts (computed from the all-statuses fetch)
  const liveStats: LiveStats = {
    active: allAds.filter((a) => a.status === "active").length,
    paused: allAds.filter((a) => a.status === "paused").length,
    finished: allAds.filter((a) => a.status === "finished").length,
    lastRefresh,
  }
  const secondsSinceUpdate = Math.max(0, Math.floor((now - lastRefresh) / 1000))

  // Centralized action: navigate to a portal.
  // If already authenticated (in any role), allow free role switching
  // without re-registration. Only show the auth gate when NOT logged in.
  const requestPortalAccess = useCallback((role: CtaRole) => {
    if (authUser) {
      // Already logged in → switch role freely (one account, both roles, separate balances)
      if (authUser.role !== role) {
        setAuthUser({ ...authUser, role })
      }
      setView(role)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    // Not authed → show gate
    setAuthGate({ open: true, role })
  }, [authUser])

  const onAuthed = useCallback((user: AuthUser) => {
    setAuthUser(user)
    setAuthGate({ open: false, role: user.role })
    setView(user.role)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const logout = useCallback(() => {
    setAuthUser(null)
    setView("inicio")
    toast.success("Sesión cerrada correctamente")
  }, [])

  const goCta = useCallback((role: CtaRole) => {
    requestPortalAccess(role)
  }, [requestPortalAccess])

  // Nav links (admin HIDDEN — accessed via ?admin=1 or footer easter egg)
  const navLinks: { label: string; target: View; icon: React.ReactNode }[] = [
    { label: "Inicio", target: "inicio", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Anunciante", target: "anunciante", icon: <Megaphone className="h-4 w-4" /> },
    { label: "Visitante", target: "visitante", icon: <Eye className="h-4 w-4" /> },
    { label: "Transparencia", target: "transparencia", icon: <ShieldCheck className="h-4 w-4" /> },
  ]

  const scrollToSection = (id: string) => {
    setView("inicio")
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)
    setMobileNavOpen(false)
  }

  const showSideRails = true // always show side-rail ads on all views (maximize ad visibility)

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 glass-strong">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Brand */}
          <button
            onClick={() => { setView("inicio"); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            className="flex items-center gap-2.5 group"
          >
            <img src="/knight-logo.png" alt={`${brandName} logo`} className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]" />
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">{brandName}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tokenSymbol} · {networkName}</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <button
                key={l.target}
                onClick={() => {
                  if (l.target === "anunciante" || l.target === "visitante") {
                    requestPortalAccess(l.target as CtaRole)
                  } else {
                    setView(l.target)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === l.target
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {l.icon}
                {l.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs / session indicator */}
          <div className="hidden md:flex items-center gap-2">
            <LiveIndicator seconds={secondsSinceUpdate} />
            {authUser ? (
              <>
                <Badge variant="outline" className="gap-1.5 border-primary/30">
                  <Fingerprint className="h-3 w-3 text-primary" />
                  <span className="capitalize">{authUser.role}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs">{authUser.email}</span>
                </Badge>
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground gap-1.5">
                  <LogOut className="h-4 w-4" /> Salir
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => requestPortalAccess("visitante")} className="text-muted-foreground hover:text-foreground">
                  Iniciar sesión
                </Button>
                <Button size="sm" onClick={() => requestPortalAccess("anunciante")} className="bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                  Registrarse
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile nav trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] glass-strong">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img src="/knight-logo.png" alt="logo" className="h-8 w-8 object-contain" />
                  <span className="font-bold text-lg">{brandName}</span>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
                </SheetClose>
              </div>
              {authUser && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">Conectado como</p>
                  <p className="text-sm font-medium">{authUser.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize gap-1"><Fingerprint className="h-3 w-3" /> {authUser.role}</Badge>
                </div>
              )}
              <nav className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <SheetClose asChild key={l.target}>
                    <button
                      onClick={() => {
                        setMobileNavOpen(false)
                        if (l.target === "anunciante" || l.target === "visitante") {
                          requestPortalAccess(l.target as CtaRole)
                        } else {
                          setView(l.target)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                        view === l.target ? "bg-primary/15 text-primary" : "hover:bg-secondary"
                      }`}
                    >
                      {l.icon}
                      {l.label}
                    </button>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2">
                {authUser ? (
                  <Button variant="outline" onClick={() => { logout(); setMobileNavOpen(false) }} className="gap-1.5"><LogOut className="h-4 w-4" /> Cerrar sesión</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { requestPortalAccess("visitante"); setMobileNavOpen(false) }}>Iniciar sesión</Button>
                    <Button onClick={() => { requestPortalAccess("anunciante"); setMobileNavOpen(false) }} className="bg-gradient-gold text-primary-foreground">Registrarse</Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ===== Side rails (admin-configured banner ads, xl+ only) ===== */}
      {showSideRails && <SideRail position="left" ads={leftAds} />}
      {showSideRails && <SideRail position="right" ads={rightAds} />}

      {/* ===== Main (with bottom padding for fixed footer) ===== */}
      <main className={`flex-1 relative ${showSideRails ? "xl:mx-[230px]" : ""} pb-20`}>
        {loading ? <PageSkeleton /> : (
          <AnimatePresence mode="wait">
            {view === "inicio" && (
              <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <LandingSubnav onJump={scrollToSection} />
                <HeroSection settings={settings} onCta={goCta} />
                <WhatIsSection settings={settings} />
                <SchemesSection settings={settings} onCta={goCta} />
                <HowItWorksSection settings={settings} />
                <TopRatedSection ads={topRatedAds} priceUsd={priceUsd} />
                <AdvertiserPlansSection plans={advertiserPlans} settings={settings} onSubscribe={() => goCta("anunciante")} />
                <ReferralCtaSection settings={settings} onCta={goCta} />
                <CtaBandSection settings={settings} onCta={goCta} />
              </motion.div>
            )}
            {view === "anunciante" && (
              <motion.div key="anunciante" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <PortalHeader
                  title="Portal del Anunciante"
                  subtitle="Compra paquetes de vistas, publica anuncios y gestiona tus campañas en la red Solana."
                  icon={<Megaphone className="h-5 w-5" />}
                  onBack={() => setView("inicio")}
                  user={authUser}
                  liveStats={liveStats}
                />
                <AdvertiserPortal plans={advertiserPlans} settings={settings} />
              </motion.div>
            )}
            {view === "visitante" && (
              <motion.div key="visitante" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <PortalHeader
                  title="Portal del Visitante"
                  subtitle="Visualiza anuncios, resuelve captcha y gana recompensas en $Knight."
                  icon={<Eye className="h-5 w-5" />}
                  onBack={() => setView("inicio")}
                  user={authUser}
                  liveStats={liveStats}
                />
                <VisitorPortal ads={ads} visitorPlans={visitorPlans} settings={settings} userEmail={authUser?.email} />
              </motion.div>
            )}
            {view === "admin" && (
              <motion.div key="admin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <PortalHeader
                  title="Centro de Administración"
                  subtitle="Configura todos los parámetros económicos, de seguridad y de marca sin tocar una sola línea de código."
                  icon={<Settings2 className="h-5 w-5" />}
                  onBack={() => setView("inicio")}
                  badge="OAuth2 · MFA"
                  liveStats={liveStats}
                />
                <AdminPortal />
              </motion.div>
            )}
            {view === "transparencia" && (
              <motion.div key="transparencia" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <PortalHeader
                  title="Prueba de Reservas & Auditoría"
                  subtitle="Registro inmutable de todas las acciones administrativas y saldos de la wallet del sistema."
                  icon={<ShieldCheck className="h-5 w-5" />}
                  onBack={() => setView("inicio")}
                  liveStats={liveStats}
                />
                {stats && <TransparencySection stats={stats} treasury={treasury} />}
                <ArchitectureSection cacheStats={cacheStats} />
                <FaqSection />
                <CtaBandSection onCta={goCta} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* ===== Fixed footer (always at bottom, never scrolls) ===== */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass-strong">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Left: brand + copyright (clickable easter egg) */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img src="/knight-logo.png" alt="logo" className="h-7 w-7 object-contain shrink-0" />
              <button
                onClick={handleCopyrightClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate cursor-pointer select-none"
                title="© 2026 Knight Ads"
              >
                © 2026 {brandName} · v2.4
              </button>
            </div>

            {/* Center: quick links (hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => setView("inicio")} className="hover:text-foreground transition-colors">Plataforma</button>
              <span className="text-border">·</span>
              <button onClick={() => requestPortalAccess("anunciante")} className="hover:text-foreground transition-colors">Anunciante</button>
              <span className="text-border">·</span>
              <button onClick={() => requestPortalAccess("visitante")} className="hover:text-foreground transition-colors">Visitante</button>
              <span className="text-border">·</span>
              <button onClick={() => setView("transparencia")} className="hover:text-foreground transition-colors">Transparencia</button>
              <span className="text-border">·</span>
              <button onClick={() => toast.info("Términos y condiciones")} className="hover:text-foreground transition-colors">Términos</button>
              <span className="text-border">·</span>
              <button onClick={() => toast.info("Política de privacidad")} className="hover:text-foreground transition-colors">Privacidad</button>
            </nav>

            {/* Right: socials + status */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 hidden sm:inline-flex"><a href="#" aria-label="Twitter"><Twitter className="h-3.5 w-3.5" /></a></Button>
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 hidden sm:inline-flex"><a href="#" aria-label="Github"><Github className="h-3.5 w-3.5" /></a></Button>
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 hidden sm:inline-flex"><a href="#" aria-label="Telegram"><Send className="h-3.5 w-3.5" /></a></Button>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground pl-2 border-l border-border/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operacional
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== Auth gate (registration required for portals) ===== */}
      <AuthGate
        open={authGate.open}
        requiredRole={authGate.role}
        onAuth={onAuthed}
        onClose={() => setAuthGate({ open: false, role: authGate.role })}
      />

      {/* ===== Hidden admin access gate (password) ===== */}
      <AdminGate
        open={adminGateOpen}
        onSuccess={() => { setAdminGateOpen(false); setView("admin"); window.scrollTo({ top: 0, behavior: "smooth" }) }}
        onClose={() => setAdminGateOpen(false)}
      />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}

/* ---------- Sub-components ---------- */

function LandingSubnav({ onJump }: { onJump: (id: string) => void }) {
  const items = [
    { id: "que-es", label: "¿Qué es?" },
    { id: "esquemas", label: "Esquemas" },
    { id: "como-funciona", label: "Cómo funciona" },
    { id: "planes", label: "Planes" },
  ]
  return (
    <div className="sticky top-16 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-1 overflow-x-auto">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => onJump(it.id)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors whitespace-nowrap"
              >
                {it.label}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operación normal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type LiveStats = {
  active: number
  paused: number
  finished: number
  lastRefresh: number
}

function LiveIndicator({ seconds }: { seconds: number }) {
  // Subtle "En vivo" pill with pulsing green dot + relative last-refresh time
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
      title="Feed actualizado en tiempo real cada 20s"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="font-semibold">En vivo</span>
      <span className="text-emerald-300/50">·</span>
      <span className="text-emerald-300/80 tabular-nums">hace {seconds}s</span>
    </span>
  )
}

function LiveStatsRow({ stats }: { stats: LiveStats }) {
  // Recompute relative seconds at render time — parent re-renders every 1s
  // via the `now` state so this badge stays fresh.
  const seconds = Math.max(0, Math.floor((Date.now() - stats.lastRefresh) / 1000))
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="font-semibold tabular-nums">{stats.active}</span>
        <span>activos</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="font-semibold tabular-nums">{stats.paused}</span>
        <span>pausados</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="font-semibold tabular-nums">{stats.finished}</span>
        <span>finalizados</span>
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300"
        title="Feed actualizado en tiempo real cada 20s"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-semibold">En vivo</span>
        <span className="text-emerald-300/50">·</span>
        <span className="text-emerald-300/80 tabular-nums">hace {seconds}s</span>
      </span>
    </div>
  )
}

function PortalHeader({
  title, subtitle, icon, onBack, badge, user, liveStats,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onBack: () => void;
  badge?: string;
  user?: AuthUser | null;
  liveStats?: LiveStats | null;
}) {
  return (
    <section className="relative border-b border-border/60 overflow-hidden">
      <div className="aurora" />
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
      <div className="container relative mx-auto px-4 md:px-6 py-10 md:py-14">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Volver al inicio
        </button>
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-gold text-primary-foreground shadow-lg glow-gold">
            {icon}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
              {badge && <Badge variant="outline" className="border-primary/30 text-primary">{badge}</Badge>}
              {user && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 gap-1">
                  <Fingerprint className="h-3 w-3" /> {user.name}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm md:text-base text-muted-foreground max-w-3xl">{subtitle}</p>
            {liveStats && <LiveStatsRow stats={liveStats} />}
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminGate({ open, onSuccess, onClose }: { open: boolean; onSuccess: () => void; onClose: () => void }) {
  // Email + one-time key auth (the key is sent to the admin's email and changes each time)
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [oneTimeKey, setOneTimeKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [demoKey, setDemoKey] = useState("") // demo only: the key "sent" by email

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(1); setEmail(""); setOneTimeKey(""); setError(""); setShowKey(false); setDemoKey("")
    }
  }, [open])

  const requestKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError("Email inválido"); return }
    setError("")
    setLoading(true)
    fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false)
        if (data.ok) {
          setStep(2)
          setDemoKey(data.demoKey || "")
          toast.success("Clave enviada", { description: `Revisa tu email ${email}. La clave expira en 5 minutos.` })
        } else {
          setError(data.error || "Email no autorizado")
          toast.error(data.error || "Email no autorizado")
        }
      })
      .catch(() => { setLoading(false); setError("Error de conexión"); toast.error("Error de conexión") })
  }

  const verifyKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oneTimeKey) { setError("Introduce la clave recibida"); return }
    setError("")
    setLoading(true)
    fetch("/api/auth/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, key: oneTimeKey }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false)
        if (data.ok) {
          toast.success("Acceso concedido", { description: "Autenticación por email verificada" })
          onSuccess()
        } else {
          setError(data.error || "Clave incorrecta")
          toast.error(data.error || "Clave incorrecta")
        }
      })
      .catch(() => { setLoading(false); setError("Error de conexión"); toast.error("Error de conexión") })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md"
          >
            <div className="glass-strong rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden glow-gold">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-br from-amber-500/15 to-violet-500/10">
                <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Cerrar"><X className="h-4 w-4" /></button>
                <div className="flex items-center gap-3 mb-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-gold text-primary-foreground shadow-lg">
                    <Mail className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">Acceso Administrativo</h2>
                    <p className="text-xs text-muted-foreground">Autenticación por email · clave de un solo uso</p>
                  </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={step === 1 ? "default" : "outline"} className={`gap-1 ${step === 1 ? "bg-gradient-gold text-primary-foreground" : "border-emerald-500/40 text-emerald-300"}`}>
                    {step === 1 ? <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> : <CheckCircle2 className="h-3 w-3" />} 1. Email
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                  <Badge variant={step === 2 ? "default" : "outline"} className={`gap-1 ${step === 2 ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"}`}>
                    <KeyRound className="h-3 w-3" /> 2. Clave
                  </Badge>
                </div>
              </div>

              {/* Step 1: request key via email */}
              {step === 1 && (
                <form onSubmit={requestKey} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-xs font-medium text-muted-foreground">Email administrativo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail className="h-4 w-4" /></span>
                      <Input id="admin-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError("") }} placeholder="admin@knight.demo" autoFocus className={`pl-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <p className="text-[11px] text-muted-foreground">Se enviará una clave segura de un solo uso a tu email. La clave <span className="text-amber-300 font-medium">cambia cada vez</span> que solicitas acceso y expira en 5 minutos.</p>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold gap-2">
                    {loading ? <Shield className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}
                    Enviar clave por email
                  </Button>
                </form>
              )}

              {/* Step 2: enter the one-time key */}
              {step === 2 && (
                <form onSubmit={verifyKey} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-key" className="text-xs font-medium text-muted-foreground">Clave de un solo uso</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><KeyRound className="h-4 w-4" /></span>
                      <Input
                        id="admin-key"
                        type={showKey ? "text" : "password"}
                        value={oneTimeKey}
                        onChange={(e) => { setOneTimeKey(e.target.value.toUpperCase()); setError("") }}
                        placeholder="Ej: KN7X9M2P"
                        autoFocus
                        maxLength={12}
                        className={`pl-10 pr-10 font-mono tracking-widest uppercase ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showKey ? "Ocultar" : "Mostrar"}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {demoKey && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                      <p className="text-[11px] text-muted-foreground mb-0.5">🔑 DEMO — tu clave (en producción se enviaría por email):</p>
                      <code className="text-sm font-mono font-bold text-amber-300 tracking-widest">{demoKey}</code>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setStep(1); setError(""); setOneTimeKey("") }} className="flex-1 gap-1.5">
                      <ChevronRight className="h-4 w-4 rotate-180" /> Volver
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 bg-gradient-gold text-primary-foreground font-semibold gap-2">
                      {loading ? <Shield className="h-4 w-4 animate-pulse" /> : <Shield className="h-4 w-4" />}
                      Verificar y entrar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-20">
      <div className="space-y-6">
        <div className="h-10 w-2/3 rounded-lg bg-secondary animate-pulse" />
        <div className="h-5 w-full rounded bg-secondary/60 animate-pulse" />
        <div className="h-5 w-4/5 rounded bg-secondary/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-secondary/60 animate-pulse" />)}
        </div>
      </div>
    </div>
  )
}
