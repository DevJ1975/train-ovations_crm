import { NextResponse } from 'next/server';
import { ExpenseCategory } from '@prisma/client';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function serializeExpense(e: {
  id: string; repProfileId: string; amount: number; currency: string;
  vendor: string | null; category: ExpenseCategory; date: Date;
  notes: string | null; receiptUrl: string | null; ocrRaw: unknown;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: e.id,
    repProfileId: e.repProfileId,
    amount: e.amount,
    currency: e.currency,
    vendor: e.vendor,
    category: e.category,
    date: e.date.toISOString(),
    notes: e.notes,
    receiptUrl: e.receiptUrl,
    ocrRaw: e.ocrRaw,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const expense = await db.expense.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  return NextResponse.json(serializeExpense(expense));
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await db.expense.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validCategories = Object.values(ExpenseCategory);

  const expense = await db.expense.update({
    where: { id },
    data: {
      ...(body.amount != null ? { amount: Number(body.amount) } : {}),
      ...(body.currency != null ? { currency: String(body.currency).toUpperCase() } : {}),
      ...(body.vendor !== undefined ? { vendor: body.vendor ? String(body.vendor) : null } : {}),
      ...(body.category != null && validCategories.includes(body.category as ExpenseCategory)
        ? { category: body.category as ExpenseCategory }
        : {}),
      ...(body.date != null ? { date: new Date(String(body.date)) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
      ...(body.receiptUrl !== undefined ? { receiptUrl: body.receiptUrl ? String(body.receiptUrl) : null } : {}),
    },
  });

  return NextResponse.json(serializeExpense(expense));
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const expense = await db.expense.findFirst({
    where: { id, repProfileId: repProfile.id },
    select: { id: true },
  });
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  await db.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
