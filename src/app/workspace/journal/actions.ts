'use server';

import { revalidatePath } from 'next/cache';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { createRepJournalEntry, deleteRepJournalEntry, getRepJournalEntries } from '@/lib/services';
import { Resend } from 'resend';

async function requireRepUser() {
  const user = await requireAuthenticatedUser('/workspace/journal');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  return user;
}

export async function createRepJournalEntryAction(formData: FormData) {
  const user = await requireRepUser();
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');
  await createRepJournalEntry(user.id, { title: title || undefined, body });
  revalidatePath('/workspace/journal');
}

export async function deleteRepJournalEntryAction(formData: FormData) {
  const user = await requireRepUser();
  const entryId = String(formData.get('entryId') ?? '');
  await deleteRepJournalEntry(user.id, entryId);
  revalidatePath('/workspace/journal');
}

export async function shareRepJournalEntryAction(
  _prev: { error?: string; sent?: boolean },
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const user = await requireRepUser();

  const toEmail = String(formData.get('toEmail') ?? '').trim();
  const entryId = String(formData.get('entryId') ?? '');

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { error: 'Enter a valid email address.' };
  }

  // Verify this entry belongs to the rep
  const entries = await getRepJournalEntries(user.id);
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return { error: 'Entry not found.' };

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { error: 'Email delivery is not configured. Contact your admin.' };
  }

  const title = entry.title ?? 'Journal entry';
  const dateStr = entry.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Escape HTML special chars so body text is safe in an email
  const escHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:0 auto;padding:24px">
  <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280">Shared from Trainovations CRM Rep Journal</p>
  <h1 style="font-size:20px;font-weight:700;margin-bottom:4px">${escHtml(title)}</h1>
  <p style="font-size:13px;color:#6b7280;margin-top:0;margin-bottom:24px">${escHtml(dateStr)}</p>
  <div style="white-space:pre-wrap;font-size:15px">${escHtml(entry.body)}</div>
  <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/>
  <p style="font-size:12px;color:#9ca3af">Shared by ${escHtml(user.name ?? '')} &middot; ${escHtml(user.email ?? '')}</p>
</body></html>`;

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `Journal: ${title}`,
    html,
  });

  return { sent: true };
}
