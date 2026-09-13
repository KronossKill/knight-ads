// Shared TypeScript types for Knight Ads platform
export type SettingType = "number" | "string" | "boolean";

export interface Setting {
  key: string;
  value: string;
  type: SettingType;
  label: string;
  category: string;
  min?: string | null;
  max?: string | null;
  help?: string | null;
  updatedAt: string;
}

export interface AdvertiserPlan {
  id: string;
  code: string;
  name: string;
  viewsIncluded: number;
  priceKnight: number;
  viewSeconds: number;
  feedPriority: number;
  diamondCount: number; // 1-5 diamonds identifying tier
  badgeColor: string;
  description: string;
  isActive: boolean;
  isPermanent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorPlan {
  id: string;
  code: string;
  name: string;
  costKnight: number;
  durationDays: number;
  multiplier: number;
  dailyViewsLimit: number;
  feedPriority: number;
  badgeColor: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryAccount {
  id: string;
  code: string;
  name: string;
  description: string;
  balance: number;
  color: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  title: string;
  content: string;
  link: string;
  advertiser: string;
  planId: string;
  plan?: AdvertiserPlan;
  viewsUsed: number;
  status: string;
  isAdministrative: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string | null;
  detail: string;
  before?: string | null;
  after?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface PlatformConfig {
  settings: Setting[];
  advertiserPlans: AdvertiserPlan[];
  visitorPlans: VisitorPlan[];
  treasury: TreasuryAccount[];
}

export interface AdRating {
  id: string;
  adId: string;
  userLabel: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
}

export interface AdWithRatings extends Ad {
  avgStars: number;
  ratingCount: number;
}

export interface PriceFeed {
  priceUsd: number;
  source: "live-jupiter" | "manual";
  tokenSymbol: string;
  tokenMint: string;
  cachedAge: number;
}

export interface AdminCredentialConfig {
  configured: boolean;
  username?: string;
  mfaLabel?: string;
  hasPassword?: boolean;
  hasSecret?: boolean;
  email?: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  role: string;
  referralCode: string;
  referredByCode: string | null;
  balanceKnight: number;
  createdAt: string;
}

export interface ReferralStats {
  user: PlatformUser;
  referralLink: string;
  level1Count: number;
  level2Count: number;
  totalEarningsKnight: number;
  recentReferrals: { name: string; email: string; createdAt: string; level: number }[];
}

/** Generate a short referral code: 8 chars, base58 (no ambiguous chars) */
export function generateReferralCode(): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export interface SideAd {
  id: string;
  position: "left" | "right";
  title: string;
  content: string;
  link: string;
  imageUrl?: string | null;
  bgColor: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalAds: number;
  activeAds: number;
  totalViewsServed: number;
  totalAdvertiserSpend: number; // $Knight
  totalVisitorRewards: number;  // $Knight
  treasuryTotal: number;        // sum of all sub-accounts
  users: number;
  pendingWithdrawals: number;
}

// Typed accessor for settings
export function getSettingValue<T = string | number | boolean>(
  settings: Setting[],
  key: string,
  fallback: T
): T {
  const s = settings.find((x) => x.key === key);
  if (!s) return fallback;
  if (s.type === "number") return Number(s.value) as unknown as T;
  if (s.type === "boolean") return (s.value === "true") as unknown as T;
  return s.value as unknown as T;
}

export const SETTING_CATEGORIES: Record<string, { label: string; icon: string }> = {
  economic: { label: "Parámetros Económicos", icon: "Coins" },
  pricing: { label: "Precio del Token & USD", icon: "DollarSign" },
  antifraud: { label: "Seguridad & Anti-Fraud", icon: "ShieldCheck" },
  plans: { label: "Planes & Duraciones", icon: "Layers" },
  referral: { label: "Sistema de Referidos", icon: "Users" },
  branding: { label: "Marca & Identidad", icon: "Palette" },
  integrations: { label: "Integraciones", icon: "Plug" },
  general: { label: "General", icon: "Settings" },
};

export const BADGE_COLORS: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  gold: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  teal: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

/* ===== Solana wallet validation ===== */
// Solana addresses are base58, typically 32-44 characters.
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function isValidSolanaAddress(addr: string): boolean {
  if (!addr || typeof addr !== "string") return false;
  const s = addr.trim();
  if (s.length < 32 || s.length > 44) return false;
  if (!BASE58_REGEX.test(s)) return false;
  return true;
}

/* ===== Price formatting helpers (USD ↔ $Knight) ===== */
export function formatUsd(usd: number): string {
  if (usd >= 1) return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
}

export function knightToUsd(knight: number, priceUsd: number): number {
  return knight * priceUsd;
}

export function usdToKnight(usd: number, priceUsd: number): number {
  if (priceUsd <= 0) return 0;
  return usd / priceUsd;
}

export function formatPricePair(knight: number, priceUsd: number): string {
  const usd = knightToUsd(knight, priceUsd);
  return `${knight.toLocaleString("es-ES", { maximumFractionDigits: 4 })} $Kn · ${formatUsd(usd)}`;
}

export function badgeClass(color: string): string {
  return BADGE_COLORS[color] ?? BADGE_COLORS.slate;
}
