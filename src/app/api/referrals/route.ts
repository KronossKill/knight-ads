import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateReferralCode, getSettingValue } from "@/lib/knight-types";
import { invalidateConfigCaches } from "@/lib/cache";

// POST /api/referrals/register  body={ name, email, referredByCode?, role? }
// Registers a new user. If referredByCode is provided, links them to that referrer.
// If not provided, links to "SYSTEM" (system referral — system gets the commissions).
// Awards the 100 $Knight welcome reward (configurable) to the new user.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, referredByCode, role = "visitante" } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "name y email requeridos" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email", user: existing }, { status: 409 });
  }

  // Validate referral code if provided
  let referrer = null;
  let finalReferredByCode = "SYSTEM"; // default: system referral

  if (referredByCode && referredByCode !== "SYSTEM") {
    referrer = await db.user.findUnique({ where: { referralCode: referredByCode } });
    if (!referrer) {
      return NextResponse.json({ error: "Código de referido no válido" }, { status: 400 });
    }
    finalReferredByCode = referredByCode;
  }

  // Generate unique referral code for the new user
  let referralCode = generateReferralCode();
  while (await db.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode();
  }

  // Get welcome reward from settings
  const settings = await db.setting.findMany();
  const welcomeReward = getSettingValue<number>(settings, "referralRewardKnight", 100);
  const tokenSymbol = getSettingValue<string>(settings, "tokenSymbol", "$Knight");

  // Create the user
  const user = await db.user.create({
    data: {
      name,
      email,
      role,
      referralCode,
      referredByCode: finalReferredByCode,
      balanceKnight: welcomeReward, // welcome bonus credited immediately
    },
  });

  // Award the welcome reward + record who referred them (for commission tracking)
  // The welcome reward itself can also generate a commission for the referrer
  if (referrer) {
    const level1Percent = getSettingValue<number>(settings, "referralLevel1Percent", 5);
    const commission = (welcomeReward * level1Percent) / 100;
    if (commission > 0) {
      await db.referralEarning.create({
        data: {
          earnerUserId: referrer.id,
          sourceUserId: user.id,
          amountKnight: commission,
          level: 1,
          reason: `Welcome bonus commission (${level1Percent}% de ${welcomeReward} ${tokenSymbol})`,
        },
      });
      await db.user.update({ where: { id: referrer.id }, data: { balanceKnight: { increment: commission } } });

      // Level 2: find the referrer's referrer
      if (referrer.referredByCode && referrer.referredByCode !== "SYSTEM") {
        const level2Referrer = await db.user.findUnique({ where: { referralCode: referrer.referredByCode } });
        if (level2Referrer) {
          const level2Percent = getSettingValue<number>(settings, "referralLevel2Percent", 2);
          const l2Commission = (welcomeReward * level2Percent) / 100;
          if (l2Commission > 0) {
            await db.referralEarning.create({
              data: {
                earnerUserId: level2Referrer.id,
                sourceUserId: user.id,
                amountKnight: l2Commission,
                level: 2,
                reason: `Welcome bonus L2 commission (${level2Percent}% de ${welcomeReward} ${tokenSymbol})`,
              },
            });
            await db.user.update({ where: { id: level2Referrer.id }, data: { balanceKnight: { increment: l2Commission } } });
          }
        }
      }
    }
  }

  invalidateConfigCaches();

  await db.auditLog.create({
    data: {
      actor: user.email,
      action: "USER_REGISTER",
      entity: "User",
      entityId: user.id,
      detail: `Usuario registrado via referido ${finalReferredByCode}. Welcome: ${welcomeReward} ${tokenSymbol}.`,
      after: JSON.stringify({ referralCode: user.referralCode, referredByCode: finalReferredByCode, welcomeReward }),
    },
  });

  return NextResponse.json({ ok: true, user, welcomeReward, tokenSymbol });
}

// GET /api/referrals/stats?email=xxx — returns the user's referral dashboard data
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "usuario no encontrado" }, { status: 404 });

  // Level 1 referrals: users whose referredByCode === user.referralCode
  const level1 = await db.user.findMany({ where: { referredByCode: user.referralCode } });
  // Level 2: users referred by my level-1 referrals
  const l1Codes = level1.map((u) => u.referralCode);
  const level2 = l1Codes.length > 0 ? await db.user.findMany({ where: { referredByCode: { in: l1Codes } } }) : [];

  const earnings = await db.referralEarning.findMany({
    where: { earnerUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const totalEarnings = earnings.reduce((s, e) => s + e.amountKnight, 0);

  const recentReferrals = [
    ...level1.map((u) => ({ name: u.name, email: u.email, createdAt: u.createdAt, level: 1 })),
    ...level2.map((u) => ({ name: u.name, email: u.email, createdAt: u.createdAt, level: 2 })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const base = typeof window !== "undefined" ? window.location.origin : "https://knight-ads.demo";
  const referralLink = `/?ref=${user.referralCode}`;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
      referredByCode: user.referredByCode,
      balanceKnight: user.balanceKnight,
      createdAt: user.createdAt,
    },
    referralLink,
    level1Count: level1.length,
    level2Count: level2.length,
    totalEarningsKnight: Number(totalEarnings.toFixed(4)),
    recentReferrals,
  });
}
