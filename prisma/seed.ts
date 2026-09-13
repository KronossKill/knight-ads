// Seed Knight Ads platform with all default configurable values
// Run with: bun run db:seed
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding Knight Ads platform...')

  // ---------- Global Settings (highly configurable) ----------
  const settings = [
    // Economic parameters — adjusted for profitability (platform self-sustaining)
    // 70/30 split + capped multipliers ensures every plan is net-positive for the platform
    { key: 'commissionPercent', value: '70', type: 'number', label: 'Comisión de Plataforma (%)', category: 'economic', min: '0', max: '95', help: 'Porcentaje de cada paquete destinado a comisiones de plataforma (sub-cuenta A3). 70% garantiza rentabilidad incluso con multiplicadores.' },
    { key: 'visitorRewardPercent', value: '30', type: 'number', label: 'Reward Visitantes (%)', category: 'economic', min: '5', max: '50', help: 'Porcentaje del paquete repartido entre los visitantes que visualicen el anuncio (sub-cuenta A5).' },
    { key: 'withdrawalFeePercent', value: '10', type: 'number', label: 'Fee de Retiro (%)', category: 'economic', min: '0', max: '50', help: 'Comisión aplicada a cada retiro de fondos (sub-cuenta A4).' },
    { key: 'minWithdrawalKnight', value: '1', type: 'number', label: 'Retiro Mínimo ($Knight)', category: 'economic', min: null, max: null, help: 'Monto mínimo que un usuario puede retirar. Sin límite de rango: el admin puede fijar cualquier valor.' },
    // Price feed — $Knight USD price (configurable; live fetch optional)
    { key: 'knightPriceUsd', value: '0.05', type: 'number', label: 'Precio $Knight (USD, manual)', category: 'pricing', min: '0.0001', max: '1000', help: 'Precio de 1 $Knight en USD. Usado si el feed en vivo está desactivado o cae.' },
    { key: 'useLivePriceFeed', value: 'true', type: 'boolean', label: 'Feed de precio en vivo', category: 'pricing', help: 'Si activo, intenta obtener el precio real de $Knight desde Jupiter Price API usando el mint configurado.' },
    { key: 'knightTokenMint', value: 'J1toso1uCk3RLhzorh11h2pEHV4Lq9K2mJ1toso1uCk3', type: 'string', label: 'Mint address del token $Knight', category: 'pricing', help: 'Dirección del contrato del token en Solana (para el feed de precio en vivo).' },
    { key: 'priceCacheSeconds', value: '60', type: 'number', label: 'Caché del precio (segundos)', category: 'pricing', min: '10', max: '3600', help: 'Tiempo de caché del feed de precio para no agotar la API.' },
    // Anti-farming
    { key: 'reviewWindowHours', value: '24', type: 'number', label: 'Ventana de Revisualización (horas)', category: 'antifraud', min: '0', max: '720', help: 'Tiempo mínimo entre vistas del mismo anuncio por el mismo usuario. 0 = desactivado.' },
    { key: 'captchaTimeoutSeconds', value: '10', type: 'number', label: 'Tiempo máximo para resolver Captcha (s)', category: 'antifraud', min: '5', max: '60', help: 'Segundos que tiene el visitante para resolver el captcha tras terminar la vista. Si no lo completa, la vista queda invalidada.' },
    { key: 'captchaRequired', value: 'true', type: 'boolean', label: 'Captcha Obligatorio', category: 'antifraud', help: 'Forzar resolución de captcha al finalizar cada vista.' },
    { key: 'antiBotOnPublish', value: 'true', type: 'boolean', label: 'Anti-Bot al Publicar', category: 'antifraud', help: 'Verificación anti-bot obligatoria al publicar anuncios.' },
    { key: 'walletValidation', value: 'true', type: 'boolean', label: 'Validar wallet Solana al conectar', category: 'antifraud', help: 'Valida que la wallet ingresada sea una dirección Solana real (base58, 32-44 chars) antes de aceptarla.' },
    // Visitor plan duration (global default)
    { key: 'visitorPlanDurationDays', value: '15', type: 'number', label: 'Duración Planes Visitante (días)', category: 'plans', min: '1', max: '365', help: 'Duración por defecto de los planes Gold/Platinum.' },
    // Referral system (2 levels, configurable)
    { key: 'referralRewardKnight', value: '100', type: 'number', label: 'Reward registro por referido ($Knight)', category: 'referral', min: '0', max: '10000', help: 'Recompensa en $Knight que recibe un nuevo usuario al registrarse via enlace de referido.' },
    { key: 'referralLevel1Percent', value: '5', type: 'number', label: 'Comisión referente nivel 1 (%)', category: 'referral', min: '0', max: '50', help: 'Porcentaje de los ingresos del referido que se paga al referente directo, de por vida.' },
    { key: 'referralLevel2Percent', value: '2', type: 'number', label: 'Comisión referente nivel 2 (%)', category: 'referral', min: '0', max: '25', help: 'Porcentaje pagado al referente del referente (nivel 2), de por vida.' },
    { key: 'referralEnabled', value: 'true', type: 'boolean', label: 'Sistema de referidos activo', category: 'referral', help: 'Si activo, los usuarios pueden compartir enlaces de referido y ganar comisiones.' },
    // Admin email (for one-time key auth)
    { key: 'adminEmail', value: 'admin@knight.demo', type: 'string', label: 'Email admin (clave por correo)', category: 'antifraud', help: 'Email donde se envía la clave segura de un solo uso para acceder al Centro de Administración. La clave cambia cada vez que se solicita.' },
    // Branding (admin can rebrand without code)
    { key: 'brandName', value: 'Knight Ads', type: 'string', label: 'Nombre de Marca', category: 'branding', help: 'Nombre mostrado en el navbar y footer.' },
    { key: 'tokenSymbol', value: '$Knight', type: 'string', label: 'Símbolo del Token', category: 'branding', help: 'Símbolo usado en toda la plataforma.' },
    { key: 'networkName', value: 'Solana', type: 'string', label: 'Red Blockchain', category: 'branding', help: 'Red blockchain donde opera el token.' },
    { key: 'jupiterEnabled', value: 'true', type: 'boolean', label: 'Integración Jupiter Aggregator', category: 'integrations', help: 'Botón directo a Jupiter Aggregator para comprar tokens.' },
    { key: 'reserveProofEnabled', value: 'true', type: 'boolean', label: 'Prueba de Reservas Pública', category: 'integrations', help: 'Mostrar prueba de reservas en la página de transparencia.' },
    { key: 'i18nEnabled', value: 'true', type: 'boolean', label: 'Multi-idioma (i18n)', category: 'integrations', help: 'Soporte multi-idioma desde el primer día.' },
    { key: 'landingHeadline', value: 'Plataforma descentralizada de publicidad en la red Solana.', type: 'string', label: 'Titular Landing', category: 'branding', help: 'Mensaje principal del hero en la landing page.' },
  ]
  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s as any,
    })
  }
  console.log(`Inserted ${settings.length} settings`)

  // ---------- Advertiser Plans (5 tiers, 1:1 with ads) ----------
  // Prices adjusted for platform profitability (70% commission covers reward + multiplier subsidy).
  // Default $Knight price = 0.05 USD → prices below reflect ~$0.05 to ~$1.00 USD per package.
  const advertiserPlans = [
    { code: 'minimo', name: 'Mínimo', viewsIncluded: 1000, priceKnight: 2, viewSeconds: 10, feedPriority: 100, diamondCount: 1, badgeColor: 'slate', description: 'Ideal para empezar. Perfecto para pequeños negocios o pruebas. Alcance básico con visibilidad estándar en el feed.' },
    { code: 'medio', name: 'Medio', viewsIncluded: 1000, priceKnight: 4, viewSeconds: 20, feedPriority: 200, diamondCount: 2, badgeColor: 'sky', description: 'El más equilibrado. Mayor tiempo de exposición y mejor posición en el feed. Recomendado para la mayoría de anunciantes.' },
    { code: 'alta', name: 'Alta', viewsIncluded: 1000, priceKnight: 6, viewSeconds: 30, feedPriority: 300, diamondCount: 3, badgeColor: 'violet', description: 'Máxima atención. Posición privilegiada en el feed y tiempo suficiente para transmitir tu mensaje completo.' },
    { code: 'superior', name: 'Superior', viewsIncluded: 1500, priceKnight: 10, viewSeconds: 45, feedPriority: 400, diamondCount: 4, badgeColor: 'amber', description: 'Alto impacto. Más vistas y mayor tiempo para captar la atención del usuario. Ideal para campañas serias.' },
    { code: 'permanente', name: 'Permanente', viewsIncluded: 2000, priceKnight: 20, viewSeconds: 60, feedPriority: 500, diamondCount: 5, badgeColor: 'rose', isPermanent: true, description: 'Máxima exposición. Siempre en la cima del feed con 60 segundos completos. Para campañas premium y lanzamientos importantes.' },
  ]
  for (const p of advertiserPlans) {
    const existing = await db.advertiserPlan.findUnique({ where: { code: p.code } })
    if (existing) {
      await db.advertiserPlan.update({ where: { code: p.code }, data: { priceKnight: p.priceKnight, diamondCount: p.diamondCount } })
    } else {
      await db.advertiserPlan.create({ data: p as any })
    }
  }

  // ---------- Side-rail banner ads (left/right) ----------
  const sideAds = [
    { position: 'left', title: 'Raydium DEX', content: 'Liquidez infinita en Solana. Swap ahora.', link: 'https://raydium.io', bgColor: 'violet', order: 1, isActive: true },
    { position: 'left', title: 'Orca Whirlpools', content: 'Concentrated liquidity AMM. Mejores tasas.', link: 'https://www.orca.so', bgColor: 'teal', order: 2, isActive: true },
    { position: 'left', title: 'Solflare Wallet', content: 'La wallet segura para tu Solana journey.', link: 'https://solflare.com', bgColor: 'amber', order: 3, isActive: true },
    { position: 'right', title: 'Helius RPC', content: 'Infraestructura premium para dApps en Solana.', link: 'https://www.helius.dev', bgColor: 'sky', order: 1, isActive: true },
    { position: 'right', title: 'Tensor NFT', content: 'El marketplace NFT #1 de Solana.', link: 'https://www.tensor.trade', bgColor: 'rose', order: 2, isActive: true },
    { position: 'right', title: 'Marinade Finance', content: 'Liquid staking en Solana. mSOL.', link: 'https://marinade.finance', bgColor: 'emerald', order: 3, isActive: true },
  ]
  for (const s of sideAds) {
    const existing = await db.sideAd.findFirst({ where: { title: s.title } })
    if (!existing) await db.sideAd.create({ data: s as any })
  }
  console.log(`Inserted/updated ${sideAds.length} side ads`)
  console.log(`Inserted ${advertiserPlans.length} advertiser plans`)

  // ---------- Visitor Plans (3 tiers with configurable duration) ----------
  // Multipliers capped (×1.5 Gold, ×2.5 Platinum) so the platform never loses money:
  // With 30% reward pool and ×2.5 max, worst-case payout = 75% < 70% commission → still profitable.
  const visitorPlans = [
    { code: 'estandar', name: 'Estandar', costKnight: 0, durationDays: 0, multiplier: 1.0, dailyViewsLimit: 0, feedPriority: 100, badgeColor: 'slate', description: 'Plan gratuito permanente. Ganancias estándar sin límite de vistas diarias.', isDefault: true },
    { code: 'gold', name: 'Gold', costKnight: 30, durationDays: 15, multiplier: 1.5, dailyViewsLimit: 500, feedPriority: 200, badgeColor: 'amber', description: 'Multiplica tus ganancias ×1.5 y prioridad en el feed. Plan rentable para todos.' },
    { code: 'platinum', name: 'Platinum', costKnight: 100, durationDays: 15, multiplier: 2.5, dailyViewsLimit: 1000, feedPriority: 300, badgeColor: 'violet', description: 'Multiplica tus ganancias ×2.5 y máxima prioridad. El multiplicador más alto rentable para la plataforma.' },
  ]
  for (const p of visitorPlans) {
    const existing = await db.visitorPlan.findUnique({ where: { code: p.code } })
    if (existing) {
      await db.visitorPlan.update({ where: { code: p.code }, data: { costKnight: p.costKnight, multiplier: p.multiplier, dailyViewsLimit: p.dailyViewsLimit } })
    } else {
      await db.visitorPlan.create({ data: p as any })
    }
  }
  console.log(`Inserted ${visitorPlans.length} visitor plans`)

  // ---------- Treasury sub-accounts A1..A7 ----------
  const treasury = [
    { code: 'A1', name: 'Planes de Anunciantes Comprados', description: 'Fondos retenidos hasta consumo por vistas.', balance: 4820.5, color: 'amber' },
    { code: 'A2', name: 'Reserva Anuncios Administrativos', description: 'Financia anuncios administrativos gratuitos.', balance: 1500.0, color: 'sky' },
    { code: 'A3', name: 'Comisiones de Plataforma', description: '60% de cada paquete comprado.', balance: 8640.75, color: 'emerald' },
    { code: 'A4', name: 'Fees de Retiros Acumulados', description: '10% por defecto de cada retiro.', balance: 920.3, color: 'violet' },
    { code: 'A5', name: 'Rewards Pendientes a Visitantes', description: '40% de cada paquete, pendiente de pago.', balance: 3210.0, color: 'rose' },
    { code: 'A6', name: 'Retiros en Proceso', description: 'Fondos siendo procesados para retiro.', balance: 780.0, color: 'orange' },
    { code: 'A7', name: 'Reserva Libre', description: 'Incluye subsidios de multiplicadores.', balance: 12450.25, color: 'teal' },
  ]
  for (const t of treasury) {
    await db.treasuryAccount.upsert({
      where: { code: t.code },
      update: {},
      create: t as any,
    })
  }
  console.log(`Inserted ${treasury.length} treasury accounts`)

  // ---------- Demo ads for the feed ----------
  const permanente = await db.advertiserPlan.findUnique({ where: { code: 'permanente' } })
  const superior = await db.advertiserPlan.findUnique({ where: { code: 'superior' } })
  const alta = await db.advertiserPlan.findUnique({ where: { code: 'alta' } })
  const medio = await db.advertiserPlan.findUnique({ where: { code: 'medio' } })
  const minimo = await db.advertiserPlan.findUnique({ where: { code: 'minimo' } })
  if (permanente && superior && alta && medio && minimo) {
    const ads = [
      { title: 'Solana Summer Hackathon 2026', content: 'Únete al mayor hackathon de la red Solana. $1M en premios. Inscripciones abiertas.', link: 'https://solana.com/hackathon', advertiser: 'Solana Foundation', planId: permanente.id, viewsUsed: 412, status: 'active', isAdministrative: true, imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
      { title: 'Jupiter Exchange — Swap con 0% slippage', content: 'El aggregator #1 de Solana. Intercambia cualquier token al mejor precio.', link: 'https://jup.ag', advertiser: 'Jupiter', planId: superior.id, viewsUsed: 980, status: 'active', imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
      { title: 'Phantom Wallet — Tu llave a Web3', content: 'La wallet más usada en Solana. Disponible en iOS, Android y navegador.', link: 'https://phantom.app', advertiser: 'Phantom', planId: alta.id, viewsUsed: 320, status: 'active', imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
      { title: 'Magic Eden — Marketplace NFT #1', content: 'Compra, vende y descubre NFTs en la red Solana con las menores comisiones.', link: 'https://magiceden.io', advertiser: 'Magic Eden', planId: medio.id, viewsUsed: 145, status: 'active', imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
      { title: 'Café Web3 — Tu primer NFT de café', content: 'Apoya a caficultores tokenizando cosechas. Prueba nuestra app demo.', link: 'https://example.com/cafe', advertiser: 'Café Web3', planId: minimo.id, viewsUsed: 88, status: 'active', imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
      { title: 'Mantenimiento programado — 12 sep 02:00 UTC', content: 'El retiro de fondos estará pausado 30 minutos por upgrade de seguridad HSM.', link: '#', advertiser: 'Knight Ads Ops', planId: permanente.id, viewsUsed: 12, status: 'active', isAdministrative: true, imageUrl: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
    ]
    for (const a of ads) {
      const existing = await db.ad.findFirst({ where: { title: a.title } })
      if (!existing) await db.ad.create({ data: a as any })
    }
    console.log(`Inserted demo ads`)
  }

  // ---------- Initial audit log ----------
  await db.auditLog.create({
    data: {
      actor: 'System',
      action: 'SEED',
      entity: 'Platform',
      detail: 'Plataforma inicializada con configuración rentable v2.4 (commission 70/30, multipliers capped)',
      after: JSON.stringify({ version: '2.4' }),
    },
  })

  // ---------- Admin credentials + 2FA secret code ----------
  // Demo admin: username "admin", password "knight2026", 2FA code "KN7X9M2P"
  const existingAdmin = await db.adminCredential.findUnique({ where: { username: 'admin' } })
  if (!existingAdmin) {
    await db.adminCredential.create({
      data: {
        username: 'admin',
        passwordHash: 'knight2026', // demo: stored plain (in production use bcrypt/argon2)
        secretCode: 'KN7X9M2P',    // 2FA code: 8 chars letters+numbers
        mfaLabel: 'Knight Admin MFA',
      },
    })
    console.log('Inserted admin credential (admin / knight2026 / 2FA: KN7X9M2P)')
  } else {
    // Update existing demo admin to ensure the secret code is set
    await db.adminCredential.update({
      where: { username: 'admin' },
      data: { passwordHash: 'knight2026', secretCode: 'KN7X9M2P' },
    })
    console.log('Updated admin credential (admin / knight2026 / 2FA: KN7X9M2P)')
  }

  // ---------- Demo star ratings (1-5) on ads ----------
  const allAds = await db.ad.findMany()
  const demoRaters = ['alice@knight.demo', 'bob@knight.demo', 'carol@knight.demo', 'dave@knight.demo', 'eve@knight.demo']
  const demoStars = [5, 4, 5, 3, 4]
  for (const ad of allAds) {
    // Skip the maintenance ad (no external link, not rateable)
    if (ad.link === '#') continue
    for (let i = 0; i < demoRaters.length; i++) {
      const rater = demoRaters[i]
      const stars = demoStars[(i + ad.title.length) % demoStars.length]
      const existing = await db.adRating.findUnique({ where: { adId_userLabel: { adId: ad.id, userLabel: rater } } })
      if (!existing) {
        await db.adRating.create({
          data: { adId: ad.id, userLabel: rater, stars, comment: null },
        })
      }
    }
  }
  console.log('Inserted demo ratings')

  console.log('Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
