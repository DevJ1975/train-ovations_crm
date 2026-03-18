import * as mindee from 'mindee';

export interface ReceiptOcrResult {
  vendor: string | null;
  date: string | null;      // ISO date string
  amount: number | null;
  currency: string;
  category: string | null;  // mapped to ExpenseCategory
  rawJson: unknown;
}

function mapCategory(mindeeCategory: string | null | undefined): string | null {
  if (!mindeeCategory) return null;
  const lc = mindeeCategory.toLowerCase();
  if (lc.includes('food') || lc.includes('meal') || lc.includes('restaurant') || lc.includes('dining')) return 'meals';
  if (lc.includes('travel') || lc.includes('transport') || lc.includes('flight') || lc.includes('uber') || lc.includes('lyft')) return 'travel';
  if (lc.includes('hotel') || lc.includes('lodge') || lc.includes('motel') || lc.includes('accommodation')) return 'lodging';
  if (lc.includes('entertain')) return 'entertainment';
  if (lc.includes('supply') || lc.includes('supplies') || lc.includes('office')) return 'supplies';
  if (lc.includes('software') || lc.includes('subscription') || lc.includes('saas')) return 'software';
  if (lc.includes('market') || lc.includes('adverti')) return 'marketing';
  return 'other';
}

/**
 * Runs Mindee Receipt OCR on a file buffer.
 * Returns structured fields ready to prefill an expense form.
 */
export async function parseReceipt(fileBuffer: Buffer, mimeType: string): Promise<ReceiptOcrResult> {
  const apiKey = process.env.MINDEE_API_KEY;
  if (!apiKey) {
    throw new Error('MINDEE_API_KEY is not set');
  }

  // Use the v1 client which supports ReceiptV5
  const client = new mindee.v1.Client({ apiKey });
  const inputSource = new mindee.BufferInput({ buffer: fileBuffer, filename: `receipt.${mimeType.split('/')[1] ?? 'jpg'}` });
  const response = await client.enqueueAndParse(mindee.v1.product.receipt.ReceiptV5, inputSource);

  const doc = response.document?.inference?.prediction;
  if (!doc) {
    return { vendor: null, date: null, amount: null, currency: 'USD', category: null, rawJson: null };
  }

  const rawJson = response.document?.inference?.prediction ?? null;
  const d = doc as unknown as Record<string, { value?: unknown; currency?: unknown }>;
  const vendor = d.supplierName?.value ?? null;
  const dateStr = d.date?.value ?? null;          // "YYYY-MM-DD"
  const totalAmount = d.totalAmount?.value ?? null;
  const currency = d.locale?.currency ?? 'USD';
  const categoryRaw = d.category?.value ?? null;

  return {
    vendor: vendor ? String(vendor) : null,
    date: dateStr ? new Date(String(dateStr)).toISOString() : null,
    amount: totalAmount != null ? Number(totalAmount) : null,
    currency: currency ? String(currency).toUpperCase() : 'USD',
    category: mapCategory(categoryRaw as string | null),
    rawJson,
  };
}
