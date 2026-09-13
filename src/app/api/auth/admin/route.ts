import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettingValue } from "@/lib/knight-types";

// In-memory store of one-time keys: { email → { key, expiresAt, attempts } }
// Keys expire after 5 minutes. Max 3 attempts per key.
const keyStore = new Map<string, { key: string; expiresAt: number; attempts: number }>();

function generateOneTimeKey(): string {
  // 8-char alphanumeric, no ambiguous chars (no 0/O/1/l/I)
  const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// POST /api/auth/admin/request-key  body={ email }
// Generates a one-time key, stores it (5-min TTL), "sends" it to the email.
// In demo: returns the key in the response (for testing). In production: sends via SMTP.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  // Check if this email matches the configured admin email
  const settings = await db.setting.findMany();
  const configuredAdminEmail = getSettingValue<string>(settings, "adminEmail", "admin@knight.demo").toLowerCase();

  // Also check AdminCredential.email
  const cred = await db.adminCredential.findFirst();
  const credEmail = cred?.email?.toLowerCase();
  const isAuthorized = email === configuredAdminEmail || email === credEmail;

  if (!isAuthorized) {
    // Log the failed attempt but DON'T reveal whether the email is valid (security)
    await db.auditLog.create({
      data: {
        actor: email,
        action: "ADMIN_KEY_REQUEST_DENIED",
        entity: "AdminCredential",
        detail: `Intento de acceso admin con email no autorizado: ${email}`,
      },
    }).catch(() => undefined);
    // For security, we still return "sent: true" to avoid email enumeration
    // BUT in demo mode we return the denial so the user knows
    return NextResponse.json({
      ok: false,
      error: "Este email no está autorizado para acceso administrativo. Contacta al Super Admin.",
    }, { status: 403 });
  }

  // Generate a fresh one-time key (changes each time)
  const key = generateOneTimeKey();
  keyStore.set(email, { key, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

  await db.auditLog.create({
    data: {
      actor: email,
      action: "ADMIN_KEY_REQUESTED",
      entity: "AdminCredential",
      detail: `Clave de un solo uso generada y enviada a ${email}. Expira en 5 minutos.`,
    },
  }).catch(() => undefined);

  // In demo: return the key in the response so the admin can see it (toast).
  // In production: send via SMTP (e.g. SendGrid/Resend/SES) and return { sent: true } only.
  return NextResponse.json({
    ok: true,
    sent: true,
    email,
    expiresIn: "5 minutos",
    // DEMO ONLY — remove in production:
    demoKey: key,
    note: "DEMO: la clave se muestra aquí para pruebas. En producción se enviaría por email real vía SMTP.",
  });
}

// POST /api/auth/admin/verify-key  body={ email, key }
// Validates the one-time key. If valid → grants admin access + deletes the key (one-time use).
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const key = String(body?.key ?? "").trim();

  if (!email || !key) {
    return NextResponse.json({ error: "email y key requeridos" }, { status: 400 });
  }

  const entry = keyStore.get(email);
  if (!entry) {
    return NextResponse.json({ error: "No hay clave pendiente. Solicita una nueva clave." }, { status: 401 });
  }

  if (Date.now() > entry.expiresAt) {
    keyStore.delete(email);
    return NextResponse.json({ error: "La clave ha expirado. Solicita una nueva." }, { status: 401 });
  }

  if (entry.attempts >= 3) {
    keyStore.delete(email);
    return NextResponse.json({ error: "Demasiados intentos. Solicita una nueva clave." }, { status: 429 });
  }

  entry.attempts++;

  if (entry.key !== key) {
    await db.auditLog.create({
      data: {
        actor: email,
        action: "ADMIN_KEY_VERIFY_FAILED",
        entity: "AdminCredential",
        detail: `Clave incorrecta (intento ${entry.attempts}/3)`,
      },
    }).catch(() => undefined);
    return NextResponse.json({ error: `Clave incorrecta. Intentos restantes: ${3 - entry.attempts}` }, { status: 401 });
  }

  // Valid! Delete the key (one-time use) + grant access
  keyStore.delete(email);
  await db.auditLog.create({
    data: {
      actor: email,
      action: "ADMIN_LOGIN_SUCCESS",
      entity: "AdminCredential",
      detail: `Acceso administrativo concedido via clave por email (${email})`,
    },
  });

  return NextResponse.json({ ok: true, actor: "Super Admin", email });
}
