import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/treasury — list all sub-accounts A1..A7
export async function GET() {
  const accounts = await db.treasuryAccount.findMany({ orderBy: { code: "asc" } });
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  return NextResponse.json({ accounts, total });
}

// PUT /api/treasury — adjust balance (admin demo)
// Body: { id, balance, actor? }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, balance, actor = "Finance Manager" } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const before = await db.treasuryAccount.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "cuenta no encontrada" }, { status: 404 });

  const updated = await db.treasuryAccount.update({
    where: { id },
    data: { balance: Number(balance) },
  });

  await db.auditLog.create({
    data: {
      actor,
      action: "TREASURY_ADJUST",
      entity: "TreasuryAccount",
      entityId: id,
      detail: `Saldo ajustado en ${updated.code} (${updated.name}): ${before.balance} → ${updated.balance}`,
      before: JSON.stringify({ balance: before.balance }),
      after: JSON.stringify({ balance: updated.balance }),
    },
  });

  return NextResponse.json({ account: updated });
}
