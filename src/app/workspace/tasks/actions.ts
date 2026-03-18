'use server';

import { revalidatePath } from 'next/cache';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  scheduleRepTask,
  snoozeRepTask,
  unscheduleRepTask,
  updateRepTaskSuggestionStatus,
} from '@/lib/services';

export async function updateRepTaskStatusAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/tasks');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const taskId = String(formData.get('taskId') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!['acknowledged', 'dismissed', 'converted'].includes(status)) {
    throw new Error('Invalid task status');
  }

  await updateRepTaskSuggestionStatus(
    user.id,
    taskId,
    status as 'acknowledged' | 'dismissed' | 'converted',
  );

  revalidatePath('/workspace');
  revalidatePath('/workspace/tasks');
  revalidatePath('/workspace/calendar');
}

export async function scheduleRepTaskAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/tasks');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const taskId = String(formData.get('taskId') ?? '');
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '');
  const durationRaw = formData.get('duration');
  const durationMinutes = durationRaw ? Number(durationRaw) : 30;

  if (!taskId || !scheduledAtRaw) {
    throw new Error('taskId and scheduledAt are required');
  }

  const scheduledAt = new Date(scheduledAtRaw);

  if (isNaN(scheduledAt.getTime())) {
    throw new Error('Invalid scheduledAt date');
  }

  await scheduleRepTask(user.id, taskId, scheduledAt, durationMinutes);

  revalidatePath('/workspace');
  revalidatePath('/workspace/tasks');
  revalidatePath('/workspace/calendar');
}

export async function unscheduleRepTaskAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/tasks');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const taskId = String(formData.get('taskId') ?? '');

  if (!taskId) {
    throw new Error('taskId is required');
  }

  await unscheduleRepTask(user.id, taskId);

  revalidatePath('/workspace');
  revalidatePath('/workspace/tasks');
  revalidatePath('/workspace/calendar');
}

export async function snoozeRepTaskAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/tasks');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const taskId = String(formData.get('taskId') ?? '');
  const snoozedUntilRaw = String(formData.get('snoozedUntil') ?? '');

  if (!taskId || !snoozedUntilRaw) {
    throw new Error('taskId and snoozedUntil are required');
  }

  const snoozedUntil = new Date(snoozedUntilRaw);

  if (isNaN(snoozedUntil.getTime())) {
    throw new Error('Invalid snoozedUntil date');
  }

  await snoozeRepTask(user.id, taskId, snoozedUntil);

  revalidatePath('/workspace');
  revalidatePath('/workspace/tasks');
  revalidatePath('/workspace/calendar');
}
