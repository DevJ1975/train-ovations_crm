import type { PartialBlock } from '@blocknote/core';

export type DaytimerBlock = PartialBlock;

export function getDaytimerDateKey(value: string) {
  return value;
}

export function buildDaytimerTemplate(dateLabel: string): DaytimerBlock[] {
  return [
    {
      type: 'heading',
      props: { level: 1 },
      content: `Day plan for ${dateLabel}`,
    },
    {
      type: 'paragraph',
      content:
        'Use slash commands, tab indentation, and checklists to keep the day moving cleanly.',
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: 'Top priorities',
    },
    {
      type: 'checkListItem',
      content: 'Respond to highest-priority leads',
    },
    {
      type: 'checkListItem',
      content: 'Prep meetings and follow-up',
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: 'Calls and meetings',
    },
    {
      type: 'bulletListItem',
      content: 'Capture key takeaways, objections, and next steps here.',
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: 'Follow-up queue',
    },
    {
      type: 'numberedListItem',
      content: 'Who needs a reply today?',
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: 'Personal reminders',
    },
    {
      type: 'bulletListItem',
      content: 'Travel, prep, admin tasks, and anything that keeps the day on track.',
    },
  ];
}
