import { NextResponse } from 'next/server';
import { ExpenseCategory } from '@prisma/client';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function serializeExpense(e: {
  id: string; repProfileId: string; amount: number; currency: string;
  vendor: string | null; category: ExpenseCategory; date: Date;
  notes: string | null; receiptUrl: string | null;
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
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));
  const category = searchParams.get('category') ?? '';

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json(paginated([], 0, page, pageSize));

  const where = {
    repProfileId: repProfile.id,
    ...(category ? { category: category as ExpenseCategory } : {}),
  };

  const [total, expenses] = await Promise.all([
    db.expense.count({ where }),
    db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(paginated(expenses.map(serializeExpense), total, page, pageSize));
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.amount == null || isNaN(Number(body.amount))) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 });
  }

  const validCategories = Object.values(ExpenseCategory);
  const category = body.category && validCategories.includes(body.category as ExpenseCategory)
    ? (body.category as ExpenseCategory)
    : ExpenseCategory.other;

  const expense = await db.expense.create({
    data: {
      repProfileId: repProfile.id,
      amount: Number(body.amount),
      currency: body.currency ? String(body.currency).toUpperCase() : 'USD',
      vendor: body.vendor ? String(body.vendor) : null,
      category,
      date: body.date ? new Date(String(body.date)) : new Date(),
      notes: body.notes ? String(body.notes) : null,
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : null,
      ocrRaw: body.ocrRaw ?? undefined,
    },
  });

  return NextResponse.json(serializeExpense(expense), { status: 201 });
}
