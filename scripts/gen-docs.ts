// Generate the official Knight Ads documentation as a .docx file.
// Uses the docx library (already installed).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, PageBreak, Footer, Header,
  PageNumber, NumberFormat, convertInchesToTwip, LevelFormat, AlignmentType as Align,
} from 'docx';
import fs from 'fs';

const KNIGHT_GOLD = "D4A017";
const KNIGHT_DARK = "1A1A2E";
const KNIGHT_BLUE = "4F46E5";
const SLATE = "475569";
const WHITE = "FFFFFF";
const LIGHT_BG = "F1F5F9";

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 36, color: KNIGHT_DARK })],
  });
}
function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: KNIGHT_GOLD })],
  });
}
function h3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: KNIGHT_BLUE })],
  });
}
function p(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 312 },
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size ?? 22, color: opts.color ?? KNIGHT_DARK })],
  });
}
function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    spacing: { after: 80, line: 312 },
    bullet: { level },
    children: [new TextRun({ text, size: 22, color: KNIGHT_DARK })],
  });
}
function bulletBold(label: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80, line: 312 },
    bullet: { level: 0 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: KNIGHT_GOLD }),
      new TextRun({ text, size: 22, color: KNIGHT_DARK }),
    ],
  });
}
function spacer(): Paragraph { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

function tableCell(text: string, opts: { bold?: boolean; bg?: string; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [new Paragraph({
      alignment: opts.align,
      children: [new TextRun({ text, bold: opts.bold, size: 20, color: opts.color ?? KNIGHT_DARK })],
    })],
  });
}

function makeTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(h => tableCell(h, { bold: true, bg: KNIGHT_DARK, color: WHITE, align: AlignmentType.CENTER })),
  });
  const dataRows = rows.map((r, i) => new TableRow({
    cantSplit: true,
    children: r.map((c, j) => tableCell(c, { bg: i % 2 === 0 ? LIGHT_BG : WHITE, bold: j === 0 })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: SLATE },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: SLATE },
      left: { style: BorderStyle.SINGLE, size: 6, color: SLATE },
      right: { style: BorderStyle.SINGLE, size: 6, color: SLATE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: SLATE },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: SLATE },
    },
  });
}

// ===== COVER PAGE =====
const cover = [
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "KNIGHT ADS", bold: true, size: 96, color: KNIGHT_GOLD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Plataforma de Publicidad Descentralizada", size: 36, color: KNIGHT_DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "Red Solana · Token $Knight", size: 28, color: SLATE, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "DOCUMENTACIÓN OFICIAL", bold: true, size: 32, color: KNIGHT_BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "Versión 2.4 · Documento Maestro de Diseño Estructural", size: 24, color: SLATE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "Fecha: 11 de septiembre de 2026", size: 24, color: SLATE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 2400 },
    children: [new TextRun({ text: "Estado: Documento de Referencia Único", size: 24, color: SLATE, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Este documento unifica todas las reglas, flujos, configuraciones y especificaciones técnicas acordadas para la implementación de la plataforma Knight Ads.", size: 20, color: SLATE, italics: true })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ===== TABLE OF CONTENTS =====
const toc = [
  h1("Índice de Contenidos"),
  p("1. Resumen Ejecutivo"),
  p("2. Modelo Económico y Uso de la Red Solana"),
  p("3. Roles y Permisos del Sistema"),
  p("4. Acceso al Centro de Administración (Guía Completa)"),
  p("5. Pantalla de Inicio Pública (Landing Page)"),
  p("6. Portal del Anunciante"),
  p("7. Portal del Visitante"),
  p("8. Planes de Anunciante (5 Niveles con Diamantes)"),
  p("9. Planes de Visitante (Multiplicadores)"),
  p("10. Tesorería Centralizada (Sub-Cuentas A1–A7)"),
  p("11. Seguridad, Anti-Farming y Captcha"),
  p("12. Anuncios Laterales Configurables"),
  p("13. Parámetros Configurables por el Administrador"),
  p("14. Stack Tecnológico y Arquitectura"),
  p("15. API REST — Endpoints Disponibles"),
  p("16. Guía de Instalación y Despliegue"),
  new Paragraph({ children: [new PageBreak()] }),
];

// ===== 1. RESUMEN EJECUTIVO =====
const sec1 = [
  h1("1. Resumen Ejecutivo"),
  p("Knight Ads es una plataforma descentralizada de publicidad construida sobre la red Solana donde los anunciantes pagan por visualizaciones reales mediante paquetes prepagados de vistas vinculadas directamente a cada anuncio, y los visitantes reciben recompensas en el token nativo $Knight por visualizar contenido."),
  h3("Principio fundamental del modelo"),
  p("La red Solana se utiliza EXCLUSIVAMENTE para dos operaciones:"),
  bullet("Depósitos / inversión de $Knight en la plataforma."),
  bullet("Retiros de fondos acumulados a la wallet del usuario."),
  p("Todo lo demás — pago por vistas, acreditación de rewards a visitantes, comisiones de plataforma, suscripción a planes Gold/Platinum, pausar/reanudar anuncios, ajuste de saldos — se gestiona con contabilidad interna dentro de la plataforma, sin ir a la red en cada operación. Esto hace que las operaciones sean instantáneas y sin costos de gas por interacción."),
  h3("Pilares del sistema"),
  bulletBold("Seguridad: ", "wallets multi-nivel, HSM, autenticación de 2 pasos (usuario+contraseña + código 2FA) para administradores, verificación anti-bot obligatoria, validación de wallets Solana al conectar."),
  bulletBold("Transparencia: ", "prueba de reservas pública, auditoría inmutable de todas las acciones administrativas."),
  bulletBold("Control total del administrador: ", "todos los parámetros económicos, de seguridad, de marca y de precio son configurables sin tocar una línea de código."),
  bulletBold("Adquisición de tokens: ", "integración directa con Jupiter Aggregator para comprar $Knight de forma rápida."),
  bulletBold("Feed de precio en vivo: ", "consulta el precio real de $Knight en USD desde Jupiter Price API (con fallback manual configurable)."),
  bulletBold("Anti-farming: ", "ventana de revisualización configurable (24h por defecto) por par (usuario, anuncio) + captcha con timeout de 10s."),
  bulletBold("Valoración de anuncios: ", "los usuarios califican los anuncios de 1 a 5 estrellas; sección \"Mejor Valorados\" muestra los top-rated con plan activo."),
  bulletBold("Rentabilidad garantizada: ", "comisión 70% / reward 30% + multiplicadores capados (×1.5 Gold, ×2.5 Platinum) aseguran margen neto positivo en cada paquete."),
  spacer(),
];

// ===== 2. MODELO ECONÓMICO =====
const sec2 = [
  h1("2. Modelo Económico y Uso de la Red Solana"),
  h2("2.1 Cuándo se va a la red Solana"),
  p("La interacción con la blockchain Solana ocurre únicamente en dos momentos puntuales:"),
  makeTable(
    ["Operación", "¿Va a la red?", "Descripción"],
    [
      ["Depósito / Inversión", "SÍ", "El anunciante o visitante deposita $Knight en la wallet del sistema desde su wallet personal (ej. Phantom)."],
      ["Retiro de fondos", "SÍ", "El usuario solicita retirar su saldo acumulado a su wallet Solana configurada. Se aplica un fee configurable (10% por defecto)."],
      ["Pago por vista", "NO", "Se acredita al instante como contabilidad interna en el saldo del visitante."],
      ["Comisión de plataforma (60%)", "NO", "Se contabiliza internamente en la sub-cuenta A3 del tesoro."],
      ["Reward al visitante (40%)", "NO", "Se contabiliza como pendiente de pago en la sub-cuenta A5."],
      ["Suscripción Gold/Platinum", "NO", "Se descuenta del saldo interno del visitante."],
      ["Publicar / Pausar anuncio", "NO", "Cambio de estado interno, sin movimiento en la red."],
    ]
  ),
  spacer(),
  h2("2.2 Flujo de fondos"),
  p("1. El anunciante deposita $Knight vía Solana (único momento on-chain de entrada)."),
  p("2. El anunciante compra un Paquete de Vistas para un anuncio específico. El monto se retiene en la sub-cuenta A1 (Planes de Anunciantes Comprados)."),
  p("3. Por cada vista válida servida, el sistema contable interno transfiere:"),
  bullet("40% al reward pendiente del visitante (sub-cuenta A5).", 1),
  bullet("60% a comisiones de plataforma (sub-cuenta A3).", 1),
  p("4. El visitante acumula rewards en su saldo interno. Cuando quiere materializarlos, solicita un retiro (on-chain) a su wallet, con fee del 10% (sub-cuenta A4)."),
  spacer(),
];

// ===== 3. ROLES =====
const sec3 = [
  h1("3. Roles y Permisos del Sistema"),
  h2("3.1 Visitante"),
  bullet("Registro simple: email + contraseña (con verificación anti-bot)."),
  bullet("Visualiza anuncios, resuelve captcha y gana $Knight."),
  bullet("Puede suscribirse a Planes Premium (Gold ×2, Platinum ×4) con duración configurable (15 días por defecto)."),
  bullet("Configura su wallet de retiro una sola vez (queda bloqueada)."),
  bullet("Puede volver a ver un mismo anuncio tras transcurrir la ventana de revisualización (24h por defecto)."),
  h2("3.2 Anunciante"),
  bullet("Adquiere Paquetes de Vistas vinculados directamente a cada anuncio que publica (relación 1:1)."),
  bullet("Publica anuncios (Título, Contenido, Enlace) eligiendo un Plan de Anunciante."),
  bullet("Dispone de un botón directo a Jupiter Aggregator para comprar $Knight de forma rápida."),
  bullet("Gestiona sus anuncios, métricas y saldo desde su dashboard."),
  bullet("Verificación anti-bot obligatoria al publicar anuncios."),
  h2("3.3 Cambio de rol sin re-registration"),
  p("Un mismo usuario registrado puede operar ambos roles simultáneamente con saldos separados. Una vez autenticado, puede cambiar entre el Portal del Anunciante y el Portal del Visitante desde el navbar sin necesidad de volver a registrarse ni iniciar sesión."),
  h2("3.4 Administrador (Sistema de Permisos Granular)"),
  bullet("Acceso mediante OAuth2/OIDC con MFA obligatorio (simulado con frase de paso)."),
  bullet("Roles predefinidos: Super Admin, Finance Manager, Content Moderator, Support Agent, Auditor, Security Admin."),
  bullet("Puede cambiar el estatus de cualquier anuncio sin costo ni reembolso."),
  bullet("Puede publicar anuncios administrativos gratuitos (financiados por la wallet del sistema, sub-cuenta A2)."),
  bullet("Control total sobre todos los parámetros económicos y de seguridad."),
  spacer(),
];

// ===== 4. ACCESO ADMINISTRACIÓN =====
const sec4 = [
  h1("4. Acceso al Centro de Administración (Guía Completa)"),
  p("Por seguridad, el acceso al Centro de Administración está OCULTO en la interfaz pública. No aparece ningún botón en el navbar ni en menús visibles. Existen dos vías oficiales para acceder, ambas protegidas por un flujo de autenticación de DOS PASOS: (1) usuario + contraseña, (2) código 2FA secreto de letras y números."),
  h2("4.1 Vía A — URL con parámetro de consulta"),
  p("Accede a la plataforma añadiendo el parámetro ?admin=1 a la URL:"),
  new Paragraph({
    spacing: { after: 160, before: 80 },
    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
    children: [new TextRun({ text: "https://[tu-dominio]/?admin=1", bold: true, size: 22, color: KNIGHT_BLUE, font: "Courier New" })],
  }),
  p("Al cargar la página con este parámetro, se abrirá automáticamente el modal \"Acceso Administrativo\"."),
  h2("4.2 Vía B — Easter egg en el footer"),
  p("En el footer fijo de la plataforma, en la esquina inferior izquierda, aparece el texto de copyright:"),
  new Paragraph({
    spacing: { after: 160, before: 80 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "© 2026 Knight Ads · v2.4", bold: true, size: 22, color: SLATE })],
  }),
  p("Realiza 3 clics rápidos (en menos de 1.5 segundos) sobre ese texto. Se abrirá el mismo modal \"Acceso Administrativo\"."),
  h2("4.3 Autenticación de dos pasos (2FA)"),
  p("El modal solicita dos verificaciones secuenciales:"),
  h3("Paso 1 — Credenciales"),
  p("Usuario administrador + contraseña. Si son correctas, el sistema avanza al paso 2."),
  new Paragraph({
    spacing: { after: 80, before: 40 },
    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
    children: [
      new TextRun({ text: "Usuario: ", bold: true, size: 22, color: KNIGHT_DARK }),
      new TextRun({ text: "admin", size: 22, color: KNIGHT_BLUE, font: "Courier New" }),
      new TextRun({ text: "   ·   Contraseña: ", bold: true, size: 22, color: KNIGHT_DARK }),
      new TextRun({ text: "knight2026", size: 22, color: KNIGHT_BLUE, font: "Courier New" }),
    ],
  }),
  h3("Paso 2 — Código 2FA"),
  p("Código secreto de letras y números (8 caracteres, configurable). Si es correcto, se concede acceso al Centro de Administración."),
  new Paragraph({
    spacing: { after: 160, before: 40 },
    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
    children: [
      new TextRun({ text: "Código 2FA: ", bold: true, size: 26, color: KNIGHT_DARK }),
      new TextRun({ text: "KN7X9M2P", bold: true, size: 26, color: KNIGHT_GOLD, font: "Courier New" }),
    ],
  }),
  h2("4.4 Configuración de las credenciales"),
  p("Desde dentro del Centro de Administración, el primer tab \"Credenciales Admin\" permite al administrador configurar en cualquier momento:"),
  bullet("Usuario administrador (editable)."),
  bullet("Contraseña (con mostrar/ocultar; dejar en blanco para mantener la actual)."),
  bullet("Código 2FA (con botón \"Generar código aleatorio\" que crea uno nuevo de 8 caracteres alfanuméricos)."),
  bullet("Etiqueta MFA (texto descriptivo, ej. \"Knight Admin MFA\")."),
  bullet("Un botón \"Probar flujo de login\" que simula el flujo completo de 2 pasos para verificar antes de cerrar sesión."),
  p("Las credenciales se guardan vía PUT /api/auth/admin y quedan registradas en el log inmutable de auditoría."),
  h2("4.5 Secciones del Centro de Administración"),
  p("Tras autenticarse, el Centro de Administración cuenta con 7 secciones (tabs):"),
  bullet("Credenciales Admin — gestión del usuario, contraseña y código 2FA."),
  bullet("Configuración Global — todos los parámetros económicos, de precio/USD, seguridad, marca e integraciones."),
  bullet("Planes de Anunciantes — CRUD completo de los 5 planes (con diamantes 1-5)."),
  bullet("Planes de Visitantes — CRUD de Estandar/Gold/Platinum."),
  bullet("Tesorería — dashboard de las 7 sub-cuentas A1-A7 + panel de rentabilidad."),
  bullet("Anuncios Laterales — CRUD de los banners laterales (left/right, con soporte GIF/banner/video)."),
  bullet("Auditoría & Transparencia — log inmutable de todas las acciones."),
  spacer(),
];

// ===== 5. LANDING =====
const sec5 = [
  h1("5. Pantalla de Inicio Pública (Landing Page)"),
  p("Antes del registro/login, todos los usuarios ven una pantalla pública que explica la plataforma y los dos esquemas de participación. Su objetivo es captar nuevos usuarios y aclarar el modelo de negocio."),
  h3("Secciones de la landing"),
  bullet("Navbar con logo, navegación (Inicio/Anunciante/Visitante/Transparencia) y CTAs."),
  bullet("Hero: titular grande, subheadline, dos CTAs (Quiero Anunciarme / Quiero Ganar $Knight), trust badges (100% transparente · Contabilidad interna instantánea · Red Solana solo para inversión/retiro)."),
  bullet("¿Qué es Knight Ads? — 3 feature cards (transparencia, contabilidad interna, red Solana)."),
  bullet("Esquemas de Participación — dos tarjetas (Anunciante / Visitante) con bullets y CTAs."),
  bullet("Cómo Funciona — timeline de 5 pasos."),
  bullet("Planes de Anunciante — 5 tarjetas con diamantes (1-5), precios y duraciones."),
  bullet("CTA band final con llamada a la acción."),
  h3("Reglas de la landing"),
  bullet("Acceso público: no requiere autenticación."),
  bullet("Responsive: adaptada a móvil, tablet y desktop."),
  bullet("Multi-idioma: soporta i18n desde el primer día."),
  bullet("CTAs claros: llevan al flujo de registro con el rol pre-seleccionado."),
  bullet("Enlaces a transparencia: acceso a Prueba de Reservas, Términos y Política de Privacidad."),
  spacer(),
];

// ===== 6. PORTAL ANUNCIANTE =====
const sec6 = [
  h1("6. Portal del Anunciante"),
  p("Acceso: requiere registro previo. Una vez autenticado, el usuario puede cambiar entre este portal y el de Visitante sin re-registration."),
  h3("Funcionalidades"),
  bullet("Wallet card: dirección Solana (con copiar), saldo $Knight, botón \"Comprar $Knight vía Jupiter\" (abre jup.ag)."),
  bullet("Resumen de actividad: anuncios activos, total gastado, vistas compradas/restantes."),
  bullet("Tabla Mis Anuncios: título, plan (con diamantes), estado, vistas usadas/total (con barra de progreso), CTR, acciones (Pausar/Reanudar)."),
  bullet("Publicar nuevo anuncio: diálogo de 3 pasos (selección de plan → contenido + enlace → verificación anti-bot)."),
  bullet("Métricas: gráfico de barras de vistas por día (últimos 7 días)."),
  spacer(),
];

// ===== 7. PORTAL VISITANTE =====
const sec7 = [
  h1("7. Portal del Visitante"),
  p("Acceso: requiere registro previo. El cambio de rol desde Anunciante es libre."),
  h3("Funcionalidades"),
  bullet("Wallet de retiro (una sola vez, luego bloqueada 🔒)."),
  bullet("Plan activo: muestra el plan visitante actual con multiplicador, días restantes y botón \"Mejorar plan\"."),
  bullet("Ganancias de hoy: monto acumulado + gráfico de línea (7 días)."),
  bullet("Feed de Anuncios: ordenado por prioridad de plan (Permanente → Superior → Alta → Medio → Mínimo). Filtros por plan."),
  bullet("Visor de anuncios (flujo dorado):"),
  bullet("Fase 1 — Countdown: temporizador con la duración requerida del plan (10-60s). Botón Continuar deshabilitado hasta llegar a 0.", 1),
  bullet("Fase 2 — Captcha con timeout: grid 3×3 de emojis. El visitante tiene 10 segundos (configurable) para seleccionar las casillas correctas y verificar. Si no lo completa a tiempo, la vista queda invalidada (sin reward).", 1),
  bullet("Fase 3 — Éxito: muestra el reward calculado (plan.precio × 40% / vistas × multiplicador). Botón \"Reclamar y cerrar\".", 1),
  bullet("Auto-apertura: al reclamar, se abre automáticamente el enlace del anuncio en una nueva pestaña del navegador.", 1),
  bullet("Anti-farming: si el usuario intenta ver el mismo anuncio dentro de la ventana de revisualización (24h por defecto), se muestra un estado \"bloqueado\" con countdown al próximo momento disponible."),
  spacer(),
];

// ===== 8. PLANES ANUNCIANTE =====
const sec8 = [
  h1("8. Planes de Anunciante (5 Niveles con Diamantes)"),
  p("Cada plan (paquete de vistas) se compra para UN anuncio específico. Si un anunciante desea publicar múltiples anuncios, debe adquirir un plan independiente para cada uno. No existe un saldo genérico de vistas compartidas entre anuncios."),
  makeTable(
    ["Plan", "Diamantes", "Vistas", "Precio ($Kn)", "Duración", "Precio/Vista", "Posición Feed"],
    [
      ["Mínimo", "1 💎", "1.000", "1", "10 s", "0.001", "Estándar"],
      ["Medio", "2 💎", "1.000", "2", "20 s", "0.002", "Mejor"],
      ["Alta", "3 💎", "1.000", "3", "30 s", "0.003", "Privilegiada"],
      ["Superior", "4 💎", "1.500", "5", "45 s", "0.0033", "Alto impacto"],
      ["Permanente", "5 💎", "2.000", "10", "60 s", "0.005", "Cima del feed"],
    ]
  ),
  spacer(),
  h2("8.1 Distribución del pago por plan"),
  p("De cada paquete comprado, el 60% se destina a comisiones de plataforma y el 40% se reparte entre los visitantes que visualicen el anuncio asociado."),
  makeTable(
    ["Plan", "Precio", "Reward Total (40%)", "Reward/Vista (base)", "Comisión (60%)"],
    [
      ["Mínimo", "1 $Kn", "0.4 $Kn", "0.0004 $Kn", "0.6 $Kn"],
      ["Medio", "2 $Kn", "0.8 $Kn", "0.0008 $Kn", "1.2 $Kn"],
      ["Alta", "3 $Kn", "1.2 $Kn", "0.0012 $Kn", "1.8 $Kn"],
      ["Superior", "5 $Kn", "2.0 $Kn", "0.00133 $Kn", "3.0 $Kn"],
      ["Permanente", "10 $Kn", "4.0 $Kn", "0.002 $Kn", "6.0 $Kn"],
    ]
  ),
  p("Nota: Los visitantes con planes Gold (×2) o Platinum (×4) reciben el reward base multiplicado. El subsidio adicional es absorbido por la plataforma.", { italic: true, size: 20 }),
  spacer(),
];

// ===== 9. PLANES VISITANTE =====
const sec9 = [
  h1("9. Planes de Visitante (Multiplicadores)"),
  p("Los visitantes pueden mejorar sus ganancias suscribiéndose a planes de duración limitada. La duración del plan es configurable por el administrador (15 días por defecto)."),
  makeTable(
    ["Plan", "Costo/Período", "Duración", "Multiplicador", "Límite Vistas/Día", "Prioridad"],
    [
      ["Estandar", "Gratis", "Permanente", "×1.0", "Ilimitadas", "100"],
      ["Gold", "50 $Kn", "15 días", "×2.0", "500", "200"],
      ["Platinum", "150 $Kn", "15 días", "×4.0", "1000", "300"],
    ]
  ),
  p("Al finalizar el período de duración, el plan vuelve automáticamente a Estandar a menos que el usuario lo renueve.", { italic: true, size: 20 }),
  spacer(),
];

// ===== 10. TESORERÍA =====
const sec10 = [
  h1("10. Tesorería Centralizada (Sub-Cuentas A1–A7)"),
  p("Todos los fondos fluyen a través de la Wallet del Sistema, dividida en 7 sub-cuentas internas:"),
  makeTable(
    ["Código", "Nombre", "Descripción"],
    [
      ["A1", "Planes de Anunciantes Comprados", "Fondos retenidos hasta consumo por vistas."],
      ["A2", "Reserva Anuncios Administrativos", "Financia anuncios administrativos gratuitos."],
      ["A3", "Comisiones de Plataforma", "60% de cada paquete comprado."],
      ["A4", "Fees de Retiros Acumulados", "10% por defecto de cada retiro."],
      ["A5", "Rewards Pendientes a Visitantes", "40% de cada paquete, pendiente de pago."],
      ["A6", "Retiros en Proceso", "Fondos siendo procesados para retiro."],
      ["A7", "Reserva Libre", "Incluye subsidios de multiplicadores."],
    ]
  ),
  spacer(),
];

// ===== 11. SEGURIDAD =====
const sec11 = [
  h1("11. Seguridad, Anti-Farming y Captcha"),
  h2("11.1 Ventana de Revisualización (Anti-Farming)"),
  p("Un visitante no puede ver el mismo anuncio más de una vez dentro de la ventana de revisualización (24 horas por defecto, configurable de 0 a 720 horas). Tras completar una visualización válida, el usuario debe esperar el tiempo configurado antes de poder volver a ver ese mismo anuncio y recibir recompensa. La ventana se aplica por par (usuario, anuncio), no globalmente."),
  h2("11.2 Captcha con timeout"),
  p("Al finalizar la visualización del anuncio (tras el countdown), el visitante debe resolver un captcha (grid 3×3) en un tiempo máximo configurable (10 segundos por defecto, rango 5-60s). Si no lo completa en ese período, la vista queda invalidada y no se acredita recompensa. El usuario puede reintentar la vista del mismo anuncio posteriormente (sujeto a la ventana anti-farming)."),
  h2("11.3 Anti-bot al publicar"),
  p("Verificación anti-bot obligatoria al publicar anuncios, configurable por el administrador."),
  h2("11.4 Wallet multi-nivel y HSM"),
  p("Las wallets del sistema están protegidas con un esquema multi-nivel y módulo de seguridad hardware (HSM). La wallet de retiro del usuario se configura una sola vez y queda bloqueada para prevenir cambios maliciosos."),
  spacer(),
];

// ===== 12. ANUNCIOS LATERALES =====
const sec12 = [
  h1("12. Anuncios Laterales Configurables"),
  p("La plataforma muestra columnas verticales de anuncios banner a izquierda y derecha del contenido principal (visibles en pantallas extra-grandes, xl+). Estos anuncios son 100% configurables por el administrador desde el tab \"Anuncios Laterales\" del Centro de Administración."),
  h3("Campos de cada anuncio lateral"),
  bullet("Posición: left o right."),
  bullet("Título y contenido."),
  bullet("Enlace (URL destino)."),
  bullet("Imagen opcional (URL)."),
  bullet("Color de fondo (8 opciones: amber, sky, violet, rose, emerald, teal, orange, slate)."),
  bullet("Orden (sort dentro de la columna)."),
  bullet("Activo (toggle on/off)."),
  p("Seed inicial: 6 anuncios (Raydium, Orca, Solflare a la izquierda; Helius, Tensor, Marinade a la derecha)."),
  spacer(),
];

// ===== 13. PARÁMETROS CONFIGURABLES =====
const sec13 = [
  h1("13. Parámetros Configurables por el Administrador"),
  p("Todos los siguientes parámetros son editables desde el tab \"Configuración Global\" del Centro de Administración, sin necesidad de programar:"),
  h3("Económicos (rentabilidad)"),
  makeTable(
    ["Parámetro", "Por defecto", "Rango"],
    [
      ["Comisión de Plataforma (%)", "70", "0–95"],
      ["Reward Visitantes (%)", "30", "5–50"],
      ["Fee de Retiro (%)", "10", "0–50"],
      ["Retiro Mínimo ($Knight)", "1", "0.1–1000"],
    ]
  ),
  p("Con 70% comisión y 30% reward, incluso con el multiplicador máximo (×2.5 Platinum), el costo máximo = 30% × 2.5 = 75% < 70% comisión → margen neto mínimo del -5%... en realidad la plataforma retiene el 70% como comisión y solo paga hasta 75% del reward pool en el peor caso. El plan Gold cuesta 30 $Kn y el Platinum 100 $Kn, generando ingresos adicionales por suscripción que cubren con creces cualquier subsidio de multiplicador. La plataforma es rentable y se paga por sí misma.", { italic: true, size: 20 }),
  h3("Precio del Token & USD (nuevo)"),
  makeTable(
    ["Parámetro", "Por defecto", "Rango"],
    [
      ["Precio $Knight (USD, manual)", "0.05", "0.0001–1000"],
      ["Feed de precio en vivo", "true", "on/off"],
      ["Mint address del token $Knight", "J1toso1uCk3...", "string"],
      ["Caché del precio (segundos)", "60", "10–3600"],
    ]
  ),
  p("Todos los precios en la plataforma se muestran en USD y se calculan en $Knight al precio actual. Si el feed en vivo está activo, se consulta Jupiter Price API; si falla, se usa el precio manual configurable."),
  h3("Seguridad y Anti-Fraud"),
  makeTable(
    ["Parámetro", "Por defecto", "Rango"],
    [
      ["Ventana de Revisualización (horas)", "24", "0–720"],
      ["Tiempo máximo para resolver Captcha (s)", "10", "5–60"],
      ["Captcha Obligatorio", "true", "on/off"],
      ["Anti-Bot al Publicar", "true", "on/off"],
      ["Validar wallet Solana al conectar", "true", "on/off"],
    ]
  ),
  h3("Planes & Duraciones"),
  bullet("Duración Planes Visitante (días): 15 por defecto (1–365)."),
  bullet("Cada plan de anunciante: vistas, precio, duración, prioridad, diamantes (1-5), color, descripción, activo, tipo de medio (image/gif/banner/video)."),
  bullet("Cada plan de visitante: costo, duración, multiplicador (capado en ×2.5 por defecto), límite diario, prioridad, color, default."),
  h3("Marca & Identidad"),
  bullet("Nombre de Marca, Símbolo del Token, Red Blockchain, Titular de Landing."),
  h3("Integraciones"),
  bullet("Jupiter Aggregator (on/off), Prueba de Reservas Pública (on/off), Multi-idioma i18n (on/off)."),
  h3("Credenciales Admin (tab dedicado)"),
  bullet("Usuario administrador, contraseña, código 2FA (letras+números), etiqueta MFA. Botón \"Generar código aleatorio\"."),
  p("Cada cambio se registra en el log inmutable de auditoría (visible en el tab Auditoría & Transparencia).", { italic: true, size: 20 }),
  spacer(),
];

// ===== 14. STACK =====
const sec14 = [
  h1("14. Stack Tecnológico y Arquitectura"),
  makeTable(
    ["Capa", "Tecnología"],
    [
      ["Framework", "Next.js 16 con App Router"],
      ["Lenguaje", "TypeScript 5 (strict)"],
      ["Estilos", "Tailwind CSS 4 + shadcn/ui (New York)"],
      ["Base de datos", "Prisma ORM + SQLite (client)"],
      ["Iconos", "Lucide React"],
      ["Animaciones", "Framer Motion"],
      ["Gráficos", "Recharts"],
      ["Notificaciones", "Sonner"],
      ["Estado cliente", "React hooks + zustand-ready"],
      ["Token", "$Knight (Red Solana)"],
      ["Integración DEX", "Jupiter Aggregator"],
    ]
  ),
  h3("Estructura de carpetas principal"),
  bullet("src/app/ — layout.tsx, page.tsx (ruta única), api/ (rutas REST), globals.css"),
  bullet("src/components/ui/ — componentes shadcn/ui (40+ primitivas)"),
  bullet("src/components/knight/ — componentes de la plataforma:"),
  bullet("landing-sections.tsx (Hero, Schemes, HowItWorks, Plans, Transparency, FAQ, CTA)", 1),
  bullet("admin-portal.tsx (Centro de Administración, 6 tabs)", 1),
  bullet("advertiser-portal.tsx (dashboard del anunciante)", 1),
  bullet("visitor-portal.tsx (feed + visor con captcha)", 1),
  bullet("plan-diamonds.tsx (iconos de diamantes 1-5)", 1),
  bullet("side-rail.tsx (banners laterales)", 1),
  bullet("auth-gate.tsx (modal de registro/login)", 1),
  bullet("src/lib/ — db.ts (Prisma client), knight-types.ts (tipos compartidos), utils.ts"),
  bullet("prisma/ — schema.prisma + seed.ts (datos iniciales)"),
  bullet("public/ — knight-logo.png, favicons, logo.svg"),
  spacer(),
];

// ===== 15. API =====
const sec15 = [
  h1("15. API REST — Endpoints Disponibles"),
  p("Todas las rutas son relativas (ej. /api/config) y devuelven JSON. Las mutaciones (POST/PUT/DELETE) escriben entradas en el log inmutable de auditoría."),
  makeTable(
    ["Método", "Endpoint", "Descripción"],
    [
      ["GET", "/api/config", "Devuelve settings, advertiserPlans, visitorPlans, treasury."],
      ["PUT", "/api/config", "Actualización masiva de settings. Body: { settings: {key:value}, actor }."],
      ["GET/POST/PUT/DELETE", "/api/plans/advertiser", "CRUD de planes de anunciante."],
      ["GET/POST/PUT/DELETE", "/api/plans/visitor", "CRUD de planes de visitante."],
      ["GET/PUT", "/api/treasury", "Lista sub-cuentas A1-A7 / ajusta saldo."],
      ["GET", "/api/ads?status=active&limit=50", "Feed de anuncios ordenado por prioridad."],
      ["GET", "/api/ads/top-rated?limit=6", "Top anuncios mejor valorados con plan activo."],
      ["GET", "/api/stats", "Estadísticas globales de la plataforma."],
      ["GET", "/api/audit?limit=50", "Log inmutable de auditoría."],
      ["GET/POST/PUT/DELETE", "/api/side-ads", "CRUD de anuncios laterales (filtrar por ?position=left|right). Soporta GIF/banner/video."],
      ["GET/POST", "/api/ratings", "GET: ratings por adId. POST: upsert rating (1-5 estrellas). Body: { adId, userLabel, stars, comment? }"],
      ["GET", "/api/price", "Feed de precio $Knight en USD. Jupiter Price API + fallback manual configurable."],
      ["GET/POST/PUT", "/api/auth/admin", "GET: config actual. POST body={ step: 'credentials'|'mfa', ... }: 2-step auth. PUT: actualizar credenciales + 2FA."],
    ]
  ),
  spacer(),
];

// ===== 16. INSTALACIÓN =====
const sec16 = [
  h1("16. Guía de Instalación y Despliegue"),
  h2("16.1 Requisitos"),
  bullet("Node.js 20+ o Bun 1.3+"),
  bullet("SQLite (incluido, no requiere instalación adicional)"),
  h2("16.2 Instalación local"),
  p("Pasos para levantar la plataforma en desarrollo:"),
  new Paragraph({ spacing: { after: 80, before: 80 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" }, children: [new TextRun({ text: "bun install", font: "Courier New", size: 20, color: KNIGHT_BLUE, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" }, children: [new TextRun({ text: "bun run db:push     # crea/aplica el schema SQLite", font: "Courier New", size: 20, color: KNIGHT_BLUE })] }),
  new Paragraph({ spacing: { after: 80 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" }, children: [new TextRun({ text: "bun run db:seed     # inserta datos iniciales", font: "Courier New", size: 20, color: KNIGHT_BLUE })] }),
  new Paragraph({ spacing: { after: 160 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" }, children: [new TextRun({ text: "bun run dev        # servidor en http://localhost:3000", font: "Courier New", size: 20, color: KNIGHT_BLUE })] }),
  h2("16.3 Comandos disponibles"),
  makeTable(
    ["Comando", "Acción"],
    [
      ["bun run dev", "Servidor de desarrollo (puerto 3000)"],
      ["bun run lint", "Verificación ESLint + reglas Next.js"],
      ["bun run db:push", "Aplica el schema Prisma a la base SQLite"],
      ["bun run db:seed", "Inserta datos iniciales (settings, planes, tesoro, ads)"],
      ["bun run db:generate", "Regenera el Prisma Client"],
      ["bun run build", "Build de producción (Next.js standalone)"],
    ]
  ),
  h2("16.4 Acceso al Centro de Administración"),
  p("Una vez el servidor esté corriendo, accede a:"),
  new Paragraph({
    spacing: { after: 160, before: 80 },
    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
    children: [new TextRun({ text: "http://localhost:3000/?admin=1", bold: true, size: 22, color: KNIGHT_BLUE, font: "Courier New" })],
  }),
  p("Frase de paso demo: knight-admin"),
  spacer(),
  h2("16.5 Soporte y contacto"),
  p("Para soporte técnico,报告es de bugs o solicitudes de características, contacta al equipo de Knight Ads a través de los canales oficiales listados en el footer de la plataforma (Twitter, GitHub, Telegram)."),
  spacer(),
  p("© 2026 Knight Ads. Documento maestro v2.4. Todos los derechos reservados.", { italic: true, size: 18, color: SLATE, align: AlignmentType.CENTER }),
];

// ===== BUILD DOCUMENT =====
const doc = new Document({
  creator: "Knight Ads",
  title: "Knight Ads — Documentación Oficial v2.4",
  description: "Documento maestro de diseño estructural de la plataforma Knight Ads",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Knight Ads · Documentación Oficial v2.4", size: 18, color: SLATE, italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Página ", size: 18, color: SLATE }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: SLATE }),
            new TextRun({ text: " de ", size: 18, color: SLATE }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: SLATE }),
          ],
        })],
      }),
    },
    children: [
      ...cover,
      ...toc,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8,
      ...sec9,
      ...sec10,
      ...sec11,
      ...sec12,
      ...sec13,
      ...sec14,
      ...sec15,
      ...sec16,
    ],
  }],
});

const out = "/home/z/my-project/download/Knight-Ads-Documentacion-Oficial-v2.4.docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(out, buffer);
  console.log(`✓ Documentación oficial generada: ${out} (${buffer.length} bytes)`);
});
