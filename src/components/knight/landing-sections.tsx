'use client'

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Eye,
  Megaphone,
  Wallet,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
  Coins,
  BarChart3,
  Lock,
  Globe,
  CheckCircle2,
  ExternalLink,
  Gift,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  type AdvertiserPlan,
  type AdWithRatings,
  type PlatformStats,
  type Setting,
  type TreasuryAccount,
  badgeClass,
  formatPricePair,
  formatUsd,
  getSettingValue,
  knightToUsd,
} from "@/lib/knight-types";
import { PlanDiamonds } from "@/components/knight/plan-diamonds";
import { StarRating } from "@/components/knight/star-rating";

/* ----------------------------------------------------------------------------
 * Shared motion variants
 * ------------------------------------------------------------------------- */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const itemUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

type CtaRole = "anunciante" | "visitante";

const fmtKnight = (n: number) => `${n.toLocaleString("es-ES")} $Kn`;

// Formats tiny per-view reward values (e.g. 0.00375 -> "0,00375") — Spanish locale.
const fmtKnReward = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

// Hardcoded fallback for the highest visitor plan multiplier (Platinum = ×2.5
// in the seed). Used when visitorPlans are not passed to a section so the
// marketing copy can still surface a concrete "up to" value.
const MAX_VISITOR_MULTIPLIER_FALLBACK = 2.5;

// Hardcoded fallback for the highest-tier advertiser plan (Permanente:
// 10 $Kn / 2.000 vistas) — used when `plans` is not provided to a section.
const MAX_PLAN_FALLBACK: { priceKnight: number; viewsIncluded: number } = {
  priceKnight: 10,
  viewsIncluded: 2000,
};

/**
 * Computes the maximum reward a visitor can earn per single view, based on
 * the highest-priced advertiser plan, the platform's visitorRewardPercent and
 * the maximum visitor multiplier (e.g. Platinum ×2.5).
 *
 *   baseReward = (plan.priceKnight × visitorRewardPercent/100) / plan.viewsIncluded
 *   maxPerView = baseReward × maxMultiplier
 *
 * Returns 0 if no views are available.
 */
function computeMaxRewardPerView(
  plans: AdvertiserPlan[] | undefined,
  visitorRewardPercent: number,
  maxMultiplier: number = MAX_VISITOR_MULTIPLIER_FALLBACK
): number {
  let price = MAX_PLAN_FALLBACK.priceKnight;
  let views = MAX_PLAN_FALLBACK.viewsIncluded;
  if (plans && plans.length > 0) {
    const top = plans.reduce((a, b) =>
      b.priceKnight > a.priceKnight ? b : a
    );
    price = top.priceKnight;
    views = top.viewsIncluded;
  }
  if (views <= 0) return 0;
  return ((price * (visitorRewardPercent / 100)) / views) * maxMultiplier;
}

// Solid (non-faded) color for small treasury dots — uses stronger opacity
const DOT_COLOR: Record<string, string> = {
  amber: "bg-amber-400",
  gold: "bg-yellow-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  rose: "bg-rose-400",
  emerald: "bg-emerald-400",
  teal: "bg-teal-400",
  orange: "bg-orange-400",
  slate: "bg-slate-400",
};
const dotColor = (c: string) => DOT_COLOR[c] ?? DOT_COLOR.slate;

/* ----------------------------------------------------------------------------
 * Static illustrative data (Hero live feed preview)
 * ------------------------------------------------------------------------- */
const liveFeedPreview = [
  {
    advertiser: "Solana Foundation",
    title: "Solana Summer Hackathon 2026",
    badge: "Permanente",
    badgeColor: "rose",
    reward: "0.40",
    seconds: 60,
  },
  {
    advertiser: "Jupiter",
    title: "Jupiter Exchange — Swap con 0% slippage",
    badge: "Superior",
    badgeColor: "amber",
    reward: "0.20",
    seconds: 45,
  },
  {
    advertiser: "Phantom",
    title: "Phantom Wallet — Tu llave a Web3",
    badge: "Alta",
    badgeColor: "violet",
    reward: "0.12",
    seconds: 30,
  },
];

/* ============================================================================
 * 1. HeroSection
 * ========================================================================== */
export function HeroSection({
  settings,
  onCta,
  plans,
}: {
  settings: Setting[];
  onCta: (role: CtaRole) => void;
  /** Optional advertiser plans — used to compute the real max per-view reward.
   * When omitted, falls back to the seed's Permanente plan (10 $Kn / 2.000 vistas). */
  plans?: AdvertiserPlan[];
}) {
  const brandName = getSettingValue<string>(settings, "brandName", "Knight Ads");
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");
  const networkName = getSettingValue<string>(settings, "networkName", "Solana");
  const landingHeadline = getSettingValue<string>(
    settings,
    "landingHeadline",
    "Plataforma descentralizada de publicidad en la red Solana."
  );
  const priceUsd = getSettingValue<number>(settings, "knightPriceUsd", 0.05);
  const commissionPercent = getSettingValue<number>(settings, "commissionPercent", 70);
  const visitorRewardPercent = getSettingValue<number>(settings, "visitorRewardPercent", 30);
  // Max reward a Platinum-equivalent visitor can earn per single view.
  const maxRewardPerView = computeMaxRewardPerView(plans, visitorRewardPercent);

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-background pt-24 pb-20 md:pt-32 md:pb-28"
    >
      {/* Aurora + grid background */}
      <div className="aurora" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-grid bg-grid-fade opacity-70"
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={itemUp} className="mb-6 flex justify-center">
            <Badge
              variant="outline"
              className="glass gap-1.5 border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-200"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              {networkName} · {tokenSymbol}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemUp}
            className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Publicidad descentralizada
            <br className="hidden sm:block" /> en la red{" "}
            <span className="text-gradient-gold">{networkName}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemUp}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            {landingHeadline} Conectamos anunciantes que buscan visibilidad real
            con usuarios que desean ganar recompensas viendo contenido. Todo
            pagado en el token nativo {tokenSymbol}.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemUp}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              onClick={() => onCta("anunciante")}
              size="lg"
              className="bg-gradient-gold h-12 w-full rounded-lg px-7 text-base font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-amber-500/30 sm:w-auto"
            >
              <Megaphone className="size-4" />
              Quiero Anunciarme
              <ArrowRight className="size-4" />
            </Button>
            <Button
              onClick={() => onCta("visitante")}
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-lg border-transparent bg-gradient-solana px-7 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <Eye className="size-4" />
              Quiero Ganar {tokenSymbol}
            </Button>
          </motion.div>

          {/* Trust badges — commission split is dynamic from settings */}
          <motion.div
            variants={itemUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              100% transparente
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-3.5 text-amber-400" />
              Comisión {commissionPercent}%
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Coins className="size-3.5 text-sky-400" />
              Reward visitantes {visitorRewardPercent}%
            </span>
          </motion.div>

          {/* Live price ticker + dynamic max per-view reward badge */}
          <motion.div
            variants={itemUp}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-3.5 py-1.5 text-xs font-medium text-amber-100/90">
              <span className="text-sm leading-none" aria-hidden="true">💎</span>
              1 {tokenSymbol} ≈ {formatUsd(priceUsd)} USD
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-3.5 py-1.5 text-xs font-medium text-emerald-100/90">
              <Zap className="size-3.5 text-emerald-300" />
              Gana hasta {fmtKnReward(maxRewardPerView)} {tokenSymbol} por vista
            </span>
          </motion.div>
        </motion.div>

        {/* Live feed preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <Card className="glass-strong glow-gold overflow-hidden p-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Feed en vivo · {brandName}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-border/60 text-[10px] text-muted-foreground"
              >
                Demo
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {liveFeedPreview.map((row) => (
                  <li
                    key={row.title}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md ${badgeClass(
                        row.badgeColor
                      )}`}
                    >
                      <Megaphone className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.advertiser}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Reward
                      </p>
                      <p className="text-xs font-semibold text-amber-300">
                        {row.reward} {tokenSymbol}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${badgeClass(row.badgeColor)} shrink-0 text-[10px]`}
                    >
                      {row.badge}
                    </Badge>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="size-3" />
                      {row.seconds}s
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 2. WhatIsSection
 * ========================================================================== */
export function WhatIsSection({
  settings = [],
}: {
  settings?: Setting[];
} = {}) {
  const commissionPercent = getSettingValue<number>(settings, "commissionPercent", 70);
  const visitorRewardPercent = getSettingValue<number>(settings, "visitorRewardPercent", 30);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");
  const networkName = getSettingValue<string>(settings, "networkName", "Solana");

  const features = [
    {
      icon: ShieldCheck,
      title: "Transparencia Total",
      copy: `Prueba de reservas pública en tiempo real. Cada ${tokenSymbol} movido está auditado y registrado on-chain.`,
      accent: "text-emerald-400",
      ring: "hover:border-emerald-500/40",
    },
    {
      icon: Zap,
      title: "Pagos Automáticos",
      copy: `Distribución sin intermediarios. El ${visitorRewardPercent}% de cada paquete se reparte directamente entre los visitantes (configurable desde el panel).`,
      accent: "text-amber-300",
      ring: "hover:border-amber-500/40",
    },
    {
      icon: Globe,
      title: `En ${networkName}`,
      copy: `Velocidad y costos mínimos. Operamos sobre la red ${networkName} con el token nativo ${tokenSymbol}.`,
      accent: "text-sky-400",
      ring: "hover:border-sky-500/40",
    },
  ];

  const stats = [
    { label: "Comisión de plataforma", value: `${commissionPercent}%` },
    { label: "Recompensa a visitantes", value: `${visitorRewardPercent}%` },
    { label: "Sub-cuentas auditadas", value: "7" },
    { label: "Planes disponibles", value: "5" },
  ];

  return (
    <section
      id="que-es"
      className="bg-background py-16 md:py-24"
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            ¿Qué es Knight Ads?
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Publicidad sin intermediarios,{" "}
            <span className="text-gradient-gold">pagada en $Knight</span>
          </motion.h2>
          <motion.p
            variants={itemUp}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Una plataforma donde anunciantes y visitantes conviven en un
            ecosistema transparente, automatizado y verificado en la red
            Solana.
          </motion.p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={itemUp}>
              <Card
                className={`glass h-full border-border/60 transition-colors ${f.ring}`}
              >
                <CardHeader>
                  <div
                    className={`flex size-11 items-center justify-center rounded-lg bg-white/[0.03] ${f.accent}`}
                  >
                    <f.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.copy}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stat row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-10 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-white/[0.02] p-4 md:grid-cols-4 md:gap-6 md:p-6"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={itemUp}
              className="text-center"
            >
              <div className="text-2xl font-bold text-gradient-gold md:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 3. SchemesSection
 * ========================================================================== */
export function SchemesSection({
  settings = [],
  onCta,
}: {
  settings?: Setting[];
  onCta: (role: CtaRole) => void;
}) {
  const commissionPercent = getSettingValue<number>(settings, "commissionPercent", 70);
  const visitorRewardPercent = getSettingValue<number>(settings, "visitorRewardPercent", 30);
  const referralReward = getSettingValue<number>(settings, "referralRewardKnight", 100);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");
  const maxMultiplier = MAX_VISITOR_MULTIPLIER_FALLBACK;
  const maxRewardPerView = computeMaxRewardPerView(
    undefined,
    visitorRewardPercent,
    maxMultiplier
  );

  const advertiserBullets = [
    "Publica tu anuncio con visibilidad real y trazable",
    "5 planes flexibles: desde 1.000 hasta 2.000 vistas",
    "Solo pagas por las vistas efectivamente servidas",
    `Comisión de plataforma del ${commissionPercent}% (configurable)`,
    "Posición en el feed según plan (Mínimo → Permanente)",
    "Panel de control con métricas en tiempo real",
    "Precios en USD, calculados en $Knight en tiempo real",
  ];
  const visitorBullets = [
    `Gana ${tokenSymbol} viendo contenido por 10–60 segundos`,
    `Gana hasta ${fmtKnReward(maxRewardPerView)} ${tokenSymbol} por vista`,
    "Sin costo de entrada: el plan Estándar es gratis",
    `Multiplicador hasta ×${maxMultiplier} con plan Platinum`,
    "Pagos internos al instante (sin ir a la red)",
    `Reward de bienvenida: ${fmtKnight(referralReward)} al registrarte via referido`,
    "Sistema anti-farming con ventana de revisión de 24h",
    "Rewards acreditados en $Knight con valor en USD visible",
  ];

  return (
    <section id="esquemas" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            Dos roles, un ecosistema
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Elige tu lado de la{" "}
            <span className="text-gradient-solana">moneda</span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6"
        >
          {/* Advertiser */}
          <motion.div variants={itemUp}>
            <Card className="glass glow-gold h-full border-amber-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/15 text-2xl">
                    📢
                  </div>
                  <div>
                    <CardTitle className="text-xl text-amber-200">
                      ERES ANUNCIANTE
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Quieres dar visibilidad real a tu marca
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {advertiserBullets.map((b) => (
                  <div
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-400" />
                    <span>{b}</span>
                  </div>
                ))}
                <div className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <span className="flex flex-wrap items-center gap-2">
                    Identificación visual por diamantes (1-5)
                    <PlanDiamonds count={3} size={12} showLabel={false} />
                  </span>
                </div>
              </CardContent>
              <CardContent className="pt-2">
                <Button
                  onClick={() => onCta("anunciante")}
                  className="bg-gradient-gold w-full rounded-lg font-semibold text-slate-950 hover:opacity-90"
                  size="lg"
                >
                  Quiero Anunciarme
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Visitor */}
          <motion.div variants={itemUp}>
            <Card className="glass glow-solana h-full border-violet-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/15 text-2xl">
                    👁️
                  </div>
                  <div>
                    <CardTitle className="text-xl text-sky-200">
                      ERES VISITANTE
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Quieres ganar recompensas por tu atención
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {visitorBullets.map((b) => (
                  <div
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sky-400" />
                    <span>{b}</span>
                  </div>
                ))}
              </CardContent>
              <CardContent className="pt-2">
                <Button
                  onClick={() => onCta("visitante")}
                  className="bg-gradient-solana w-full rounded-lg font-semibold text-white hover:opacity-90"
                  size="lg"
                >
                  Quiero Ganar $Knight
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 4. HowItWorksSection
 * ========================================================================== */
export function HowItWorksSection({
  settings = [],
}: {
  settings?: Setting[];
} = {}) {
  const commissionPercent = getSettingValue<number>(settings, "commissionPercent", 70);
  const visitorRewardPercent = getSettingValue<number>(settings, "visitorRewardPercent", 30);
  const withdrawalFee = getSettingValue<number>(settings, "withdrawalFeePercent", 10);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");

  const steps = [
    {
      n: 1,
      icon: Wallet,
      title: "Regístrate",
      copy: "Crea tu cuenta con email y contraseña. Sin KYC invasivo ni fricción.",
      sub: "",
    },
    {
      n: 2,
      icon: Lock,
      title: "Configura tu wallet",
      copy: "Conecta una wallet Solana una sola vez. Ahí recibirás tus recompensas.",
      sub: "",
    },
    {
      n: 3,
      icon: Megaphone,
      title: "Elige tu rol",
      copy: `Anunciante para publicar anuncios. Visitante para ganar ${tokenSymbol} viéndolos.`,
      sub: "",
    },
    {
      n: 4,
      icon: Coins,
      title: "Interactúa y gana/paga",
      copy: "Mira anuncios 10–60s y recibe recompensas. O publica y recibe vistas reales.",
      sub: `Comisión de plataforma ${commissionPercent}% · ${visitorRewardPercent}% se reparte entre visitantes`,
    },
    {
      n: 5,
      icon: Zap,
      title: "Retira fondos",
      copy: `Solicita retiros a tu wallet. Procesados con un fee del ${withdrawalFee}% hacia la sub-cuenta A4.`,
      sub: "",
    },
  ];

  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-background py-16 md:py-24"
    >
      <div
        className="absolute inset-0 bg-grid bg-grid-fade opacity-50"
        aria-hidden="true"
      />
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            🔍 ¿Cómo funciona?
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Cinco pasos para{" "}
            <span className="text-gradient-gold">empezar</span>
          </motion.h2>
          <motion.p
            variants={itemUp}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            De cero a tu primera recompensa o primer anuncio publicado en
            minutos. Sin papeleo, sin intermediarios.
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-3"
        >
          {steps.map((s, idx) => (
            <motion.li
              key={s.n}
              variants={itemUp}
              className="relative flex flex-col items-start"
            >
              {/* Horizontal connector on desktop */}
              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-[calc(50%+1.5rem)] top-7 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-amber-500/40 to-transparent md:block"
                />
              )}
              <Card className="glass relative h-full w-full border-border/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-slate-950">
                    {s.n}
                  </div>
                  <s.icon className="size-5 text-amber-300" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {s.copy}
                </p>
                {s.sub && (
                  <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-amber-300/90">
                    {s.sub}
                  </p>
                )}
              </Card>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-12 flex justify-center"
        >
          <Button
            size="lg"
            className="bg-gradient-gold h-12 rounded-lg px-7 text-base font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.02]"
          >
            Comenzar Ahora
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 5. AdvertiserPlansSection
 * ========================================================================== */
export function AdvertiserPlansSection({
  plans,
  settings,
  onSubscribe,
}: {
  plans: AdvertiserPlan[];
  settings: Setting[];
  onSubscribe?: () => void;
}) {
  const commissionPct = getSettingValue<number>(settings, "commissionPercent", 60);
  const rewardPct = getSettingValue<number>(settings, "visitorRewardPercent", 40);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");
  const priceUsd = getSettingValue<number>(settings, "knightPriceUsd", 0.05);

  const sorted = [...plans].sort((a, b) => a.feedPriority - b.feedPriority);

  return (
    <section id="planes" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            Planes para anunciantes
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Elige el{" "}
            <span className="text-gradient-gold">alcance</span> de tu campaña
          </motion.h2>
          <motion.p
            variants={itemUp}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            5 niveles de exposición. Cada anuncio usa exactamente un plan. El
            precio es por paquete, no por mes.
          </motion.p>
        </motion.div>

        {/* USD pricing banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2 text-center text-xs text-amber-100/90"
        >
          <Coins className="size-3.5 shrink-0 text-amber-300" />
          <span>
            Todos los precios se muestran en USD y se calculan en {tokenSymbol} al
            precio actual del token (1 {tokenSymbol} ≈ {formatUsd(priceUsd)}).
          </span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3"
        >
          {sorted.map((p) => {
            const isPopular = p.isPermanent;
            const pricePerView =
              p.viewsIncluded > 0
                ? (p.priceKnight / p.viewsIncluded) * 1000
                : 0;
            return (
              <motion.div
                key={p.id}
                variants={itemUp}
                className={isPopular ? "lg:-mt-3" : ""}
              >
                <Card
                  className={`glass relative h-full border-border/60 transition-transform hover:-translate-y-1 ${
                    isPopular
                      ? "glow-gold border-amber-500/50"
                      : "hover:border-amber-500/30"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-gold border-transparent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                        ★ Más popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`${badgeClass(p.badgeColor)} text-[10px]`}
                      >
                        {p.code}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center pt-1.5">
                      <PlanDiamonds count={p.diamondCount} size={16} showLabel={false} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gradient-gold">
                          {p.priceKnight}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {tokenSymbol}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        por {p.viewsIncluded.toLocaleString("es-ES")} vistas
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        ≈ {formatUsd(knightToUsd(p.priceKnight, priceUsd))} USD
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Duración por vista
                        </span>
                        <span className="font-medium text-foreground">
                          {p.viewSeconds}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Precio / 1.000 vistas
                        </span>
                        <span className="font-medium text-foreground">
                          {pricePerView.toFixed(2)} {tokenSymbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Prioridad feed
                        </span>
                        <span className="font-medium text-foreground">
                          {p.feedPriority}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>

                    <Button
                      onClick={onSubscribe}
                      className={
                        isPopular
                          ? "bg-gradient-gold w-full rounded-md font-semibold text-slate-950 hover:opacity-90"
                          : "w-full rounded-md font-medium"
                      }
                      variant={isPopular ? "default" : "outline"}
                    >
                      Quiero Anunciarme
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Commission / reward split footer note */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <Card className="glass border-border/60">
            <CardContent className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-amber-300" />
                <span className="text-sm font-medium text-foreground">
                  Distribución de cada paquete
                </span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <div className="text-lg font-bold text-amber-300">
                    {commissionPct}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Comisión plataforma
                  </div>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <div className="text-lg font-bold text-sky-300">
                    {rewardPct}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Reward visitantes
                  </div>
                </div>
              </div>
              <p className="w-full text-center text-[11px] text-muted-foreground/80 sm:text-right">
                Comisión {commissionPct}% · Reward visitantes {rewardPct}% · configurable
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 6. TopRatedSection (Best-rated ads with active plan)
 * ========================================================================== */
export function TopRatedSection({
  ads,
  priceUsd,
}: {
  ads: AdWithRatings[];
  priceUsd: number;
}) {
  return (
    <section
      id="mejor-valorados"
      className="relative overflow-hidden border-y border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] via-background to-background py-16 md:py-24"
    >
      <div
        className="absolute inset-0 bg-grid bg-grid-fade opacity-40"
        aria-hidden="true"
      />
      {/* Subtle gold aura to draw the eye */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[80%] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        {/* TOP RATED ribbon */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mx-auto mb-5 flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200 shadow-[0_0_24px_-6px] shadow-amber-500/40">
            <Trophy className="size-3.5 text-amber-300" />
            ⭐ TOP RATED
          </span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            ⭐ Mejor Valorados
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Los anuncios <span className="text-gradient-gold">mejor calificados</span>
          </motion.h2>
          <motion.p
            variants={itemUp}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Los anuncios con las mejores calificaciones que tienen un plan activo.
          </motion.p>
        </motion.div>

        {/* "Ver todos" CTA — visual only, surfaces a toast */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          className="mt-6 flex justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Los mejores anuncios del momento")}
            className="gap-1.5 border-amber-500/40 bg-amber-500/[0.06] text-amber-200 hover:bg-amber-500/15 hover:text-amber-100"
          >
            Ver todos
            <ArrowRight className="size-3.5" />
          </Button>
        </motion.div>

        {ads.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="mx-auto mt-12 max-w-xl"
          >
            <Card className="glass border-border/60 p-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-3xl">
                ⭐
              </div>
              <p className="text-base font-medium text-foreground">
                Aún no hay anuncios valorados.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ¡Sé el primero en calificar!
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
          >
            {ads.map((ad) => {
              const plan = ad.plan;
              return (
                <motion.div key={ad.id} variants={itemUp}>
                  <Card className="glass glow-gold group h-full overflow-hidden border-amber-500/40 p-0 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/70 hover:shadow-[0_0_48px_-10px] hover:shadow-amber-500/50">
                    {/* Media — 16:9, supports GIF/animated */}
                    {ad.imageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03]">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      </div>
                    )}

                    <CardHeader className="gap-3 p-5">
                      {/* TOP pill + plan badge + diamonds */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                            <Trophy className="size-2.5" />
                            Top
                          </span>
                          {plan && (
                            <Badge
                              variant="outline"
                              className={`${badgeClass(plan.badgeColor)} gap-1.5 text-[10px]`}
                            >
                              {plan.code}
                            </Badge>
                          )}
                        </div>
                        {plan && (
                          <PlanDiamonds
                            count={plan.diamondCount}
                            size={12}
                            showLabel={false}
                          />
                        )}
                      </div>

                      {/* Title */}
                      <CardTitle className="line-clamp-2 text-base font-bold text-foreground">
                        {ad.title}
                      </CardTitle>

                      {/* Advertiser + avg rating */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-xs text-muted-foreground">
                          {ad.advertiser}
                        </span>
                        <StarRating
                          value={ad.avgStars}
                          count={ad.ratingCount}
                          size={14}
                          readOnly
                        />
                      </div>

                      {/* Short content */}
                      <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                        {ad.content}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4 p-5 pt-0">
                      {/* Price row */}
                      {plan && (
                        <div className="flex items-baseline justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Precio del plan
                          </span>
                          <span className="text-amber-300 font-semibold text-sm">
                            {formatPricePair(plan.priceKnight, priceUsd)}
                          </span>
                        </div>
                      )}

                      {/* CTA */}
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-gold w-full rounded-md font-semibold text-slate-950 hover:opacity-90"
                      >
                        <a
                          href={ad.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver anuncio
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 7. TransparencySection
 * ========================================================================== */
export function TransparencySection({
  stats,
  treasury,
}: {
  stats: PlatformStats;
  treasury: TreasuryAccount[];
}) {
  const total = treasury.reduce((sum, t) => sum + (t.balance || 0), 0);

  const statTiles = [
    {
      icon: Megaphone,
      label: "Anuncios totales",
      value: stats.totalAds.toLocaleString("es-ES"),
      color: "text-amber-300",
    },
    {
      icon: Eye,
      label: "Vistas servidas",
      value: stats.totalViewsServed.toLocaleString("es-ES"),
      color: "text-sky-300",
    },
    {
      icon: Coins,
      label: "Recompensas pagadas",
      value: `${stats.totalVisitorRewards.toLocaleString("es-ES", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} $Kn`,
      color: "text-emerald-300",
    },
    {
      icon: Wallet,
      label: "Usuarios activos",
      value: stats.users.toLocaleString("es-ES"),
      color: "text-violet-300",
    },
  ];

  return (
    <section
      id="transparencia"
      className="relative overflow-hidden bg-background py-16 md:py-24"
    >
      <div
        className="absolute inset-0 bg-grid bg-grid-fade opacity-50"
        aria-hidden="true"
      />
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            Prueba de reservas
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Cada $Knight está{" "}
            <span className="text-gradient-gold">contabilizado</span>
          </motion.h2>
          <motion.p
            variants={itemUp}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Reservas totales distribuidas en 7 sub-cuentas auditables. La
            transparencia es la base del ecosistema.
          </motion.p>
        </motion.div>

        {/* Total reserve */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <Card className="glass-strong glow-gold border-amber-500/30">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Reserva total auditada
              </span>
              <span className="text-4xl font-bold text-gradient-gold md:text-5xl">
                {total.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                $Kn
              </span>
              <span className="text-xs text-muted-foreground">
                Suma de sub-cuentas A1 a A7 · actualizado en tiempo real
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sub-account grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {treasury.map((t) => (
            <motion.div key={t.id} variants={itemUp}>
              <Card className="glass h-full border-border/60 p-4 transition-colors hover:border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${dotColor(t.color)}`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {t.code}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${badgeClass(t.color)} text-[10px]`}
                  >
                    {t.color}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {t.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.description}
                </p>
                <p className="mt-3 text-lg font-bold text-gradient-gold">
                  {t.balance.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  $Kn
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* 4 stat tiles */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {statTiles.map((s) => (
            <motion.div key={s.label} variants={itemUp}>
              <Card className="glass h-full border-border/60 p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`size-4 ${s.color}`} />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <div className="mt-2 text-xl font-bold text-foreground md:text-2xl">
                  {s.value}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Link to full page */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          className="mt-8 flex justify-center"
        >
          <Button
            variant="link"
            className="text-amber-300 hover:text-amber-200 hover:no-underline"
          >
            Ver página de transparencia completa
            <ExternalLink className="size-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 8. FaqSection
 * ========================================================================== */
export function FaqSection(_props: Record<string, never>) {
  const faqs = [
    {
      q: "¿Qué es Knight Ads?",
      a: "Knight Ads es una plataforma descentralizada de publicidad construida sobre la red Solana. Conecta anunciantes que buscan visibilidad real con usuarios que desean ganar recompensas viendo contenido. Importante: la red Solana se utiliza únicamente para depósitos (inversión) y retiros de fondos. Todos los pagos por vistas, comisiones y recompensas se gestionan con contabilidad interna dentro de la plataforma, sin ir a la red en cada operación. El token nativo $Knight es la unidad de cuenta de todo el ecosistema.",
    },
    {
      q: "¿Cómo me registro en la plataforma?",
      a: "El registro es simple: solo necesitas email y contraseña. No se requiere KYC invasivo para empezar a operar. Una vez dentro, configuras tu wallet Solana (una sola vez) y eliges tu rol: anunciante o visitante. Importante: una vez registrado, puedes cambiar entre el Portal del Anunciante y el Portal del Visitante cuando quieras, sin necesidad de volver a registrarte ni iniciar sesión — un mismo usuario puede operar ambos roles simultáneamente con saldos separados.",
    },
    {
      q: "¿Cómo funcionan las wallets Solana?",
      a: "Cada usuario conecta una wallet Solana (como Phantom) a su cuenta. Esta wallet se usa exclusivamente para depósitos (inversión en $Knight) y retiros de fondos acumulados. Los rewards por ver anuncios se acreditan al instante en tu saldo interno de la plataforma, sin necesidad de ir a la red en cada vista. Cuando quieras materializar tus ganancias, solicitas un retiro a tu wallet configurada (con un fee configurable del 10% por defecto). La conexión de wallet se hace una sola vez.",
    },
    {
      q: "¿Cómo retiro mis fondos?",
      a: "Desde tu panel solicitas un retiro a tu wallet Solana configurada. Existe un retiro mínimo configurable (1 $Knight por defecto) y se aplica un fee del 10% sobre el monto retirado, que va directamente a la sub-cuenta A4 del tesoro.",
    },
    {
      q: "¿Qué es la ventana anti-farming?",
      a: "Para evitar que un mismo usuario vea el mismo anuncio repetidas veces en poco tiempo, existe una ventana de revisión configurable (24 horas por defecto). Durante ese periodo, no puedes volver a ver el mismo anuncio para contar como vista válida.",
    },
    {
      q: "¿Qué planes existen para anunciantes?",
      a: "Hay 5 planes: Mínimo (1.000 vistas, 1 $Kn, 10s), Medio (1.000, 2 $Kn, 20s), Alta (1.000, 3 $Kn, 30s), Superior (1.500, 5 $Kn, 45s) y Permanente (2.000, 10 $Kn, 60s). Cuanto mayor el plan, mejor posición en el feed y mayor duración de cada vista.",
    },
    {
      q: "¿Cuándo se usa la red Solana?",
      a: "La red Solana se utiliza exclusivamente para dos operaciones: (1) depósitos / inversión de $Knight en la plataforma, y (2) retiros de fondos acumulados a tu wallet. Todo lo demás — pago por vistas, acreditación de rewards a visitantes, comisiones de plataforma, suscripción a planes Gold/Platinum, pausar/reanudar anuncios — se gestiona con contabilidad interna dentro de la plataforma, sin ir a la red. Esto hace las operaciones instantáneas y sin costos de gas por interacción.",
    },
    {
      q: "¿Puedo ser anunciante y visitante a la vez?",
      a: "Sí. Un mismo usuario registrado puede operar ambos roles simultáneamente, con saldos separados para cada rol. Una vez que inicias sesión, puedes cambiar entre el Portal del Anunciante y el Portal del Visitante desde el navbar sin volver a registrarte ni iniciar sesión de nuevo.",
    },
  ];

  return (
    <section id="faq" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={itemUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"
          >
            Preguntas frecuentes
          </motion.span>
          <motion.h2
            variants={itemUp}
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Todo lo que necesitas{" "}
            <span className="text-gradient-gold">saber</span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <Card className="glass border-border/60 p-5 md:p-7">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem
                    key={f.q}
                    value={`item-${i}`}
                    className="border-border/60"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-amber-200 hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 9. CtaBandSection
 * ========================================================================== */
export function CtaBandSection({
  settings = [],
  onCta,
}: {
  settings?: Setting[];
  onCta: (role: CtaRole) => void;
}) {
  const referralReward = getSettingValue<number>(settings, "referralRewardKnight", 100);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");
  return (
    <section id="cta-band" className="bg-background py-16 md:py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="container mx-auto px-4 md:px-6"
      >
        <Card className="bg-gradient-gold relative overflow-hidden border-amber-500/40 p-8 md:p-12">
          <div
            className="absolute inset-0 bg-grid opacity-20"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <motion.div variants={itemUp}>
              <Sparkles className="size-7 text-slate-950" />
            </motion.div>
            <motion.div variants={itemUp} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/20 bg-white/30 px-3 py-1 text-xs font-semibold text-slate-900">
                <Gift className="size-3.5" />
                Programa de Referidos a 2 niveles activo
              </span>
            </motion.div>
            <motion.h2
              variants={itemUp}
              className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl"
            >
              Únete a la revolución de la publicidad descentralizada
            </motion.h2>
            <motion.p
              variants={itemUp}
              className="max-w-2xl text-pretty text-base text-slate-900/80 sm:text-lg"
            >
              Publica tu marca con visibilidad real o gana recompensas viendo
              contenido. La red Solana se usa únicamente para inversión y retiros;
              el resto de las operaciones económicas se gestionan dentro de la
              plataforma con contabilidad interna. Todo en {tokenSymbol}.
            </motion.p>
            <motion.p
              variants={itemUp}
              className="max-w-2xl text-pretty text-sm font-medium text-slate-900/70 sm:text-base"
            >
              🎁 Gana recompensas de hasta {fmtKnight(referralReward)} solo por
              registrarte via un enlace de referido.
            </motion.p>
            <motion.div
              variants={itemUp}
              className="flex flex-col items-center gap-3 sm:flex-row"
            >
              <Button
                onClick={() => onCta("anunciante")}
                size="lg"
                className="h-12 rounded-lg bg-slate-950 px-7 text-base font-semibold text-amber-200 shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Megaphone className="size-4" />
                Quiero Anunciarme
                <ChevronRight className="size-4" />
              </Button>
              <Button
                onClick={() => onCta("visitante")}
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border-slate-900/30 bg-white/10 px-7 text-base font-semibold text-slate-950 backdrop-blur transition-transform hover:scale-[1.02] hover:bg-white/20"
              >
                <Eye className="size-4" />
                Quiero Ganar $Knight
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}

/* ============================================================================
 * 10. ReferralCtaSection — promotes the 2-level referral program
 * ========================================================================== */
export function ReferralCtaSection({
  settings,
  onCta,
}: {
  settings: Setting[];
  onCta?: (role: CtaRole) => void;
}) {
  const referralReward = getSettingValue<number>(settings, "referralRewardKnight", 100);
  const level1 = getSettingValue<number>(settings, "referralLevel1Percent", 5);
  const level2 = getSettingValue<number>(settings, "referralLevel2Percent", 2);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");

  return (
    <section id="referidos" className="bg-background py-16 md:py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="container mx-auto px-4 md:px-6"
      >
        <motion.div variants={itemUp} className="mx-auto max-w-3xl">
          {/* Gradient-border wrapper */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-violet-500/50 p-[1.5px] shadow-[0_0_48px_-12px] shadow-amber-500/40">
            <Card className="glass-strong relative overflow-hidden border-0 bg-background/95 p-6 md:p-8">
              <div
                className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-amber-500/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative z-10 flex flex-col items-center gap-5 text-center md:flex-row md:items-start md:gap-6 md:text-left">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold text-slate-950 shadow-lg shadow-amber-500/30">
                  <Gift className="size-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    🎁 Programa de Referidos a 2 niveles
                  </h3>
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Regístrate via un enlace de referido y recibe{" "}
                    <span className="font-semibold text-amber-300">
                      {fmtKnight(referralReward)}
                    </span>{" "}
                    de bienvenida. Tu referente gana{" "}
                    <span className="font-semibold text-amber-300">{level1}%</span> de
                    tus ingresos de por vida, y su referente{" "}
                    <span className="font-semibold text-amber-300">{level2}%</span>.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1 text-xs text-amber-100/90">
                      <Gift className="size-3.5" />
                      Bienvenida: {fmtKnight(referralReward)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1 text-xs text-amber-100/90">
                      Nivel 1: {level1}%
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1 text-xs text-amber-100/90">
                      Nivel 2: {level2}%
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                    <Button
                      onClick={() => onCta?.("visitante")}
                      size="lg"
                      className="bg-gradient-gold h-12 rounded-lg px-7 text-base font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-amber-500/30"
                    >
                      <Gift className="size-4" />
                      Quiero mi enlace de referido
                      <ArrowRight className="size-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Disponible al registrarte como visitante · pagado en {tokenSymbol}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
