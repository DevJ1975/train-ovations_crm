import { describe, expect, it } from 'vitest';

import { buildDaytimerTemplate } from './daytimer-note';

describe('daytimer note helpers', () => {
  it('builds a daily template with core sections', () => {
    const blocks = buildDaytimerTemplate('Mar 14, 2026');

    expect(blocks[0]).toEqual(
      expect.objectContaining({
        type: 'heading',
        content: 'Day plan for Mar 14, 2026',
      }),
    );
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Top priorities' }),
        expect.objectContaining({ content: 'Calls and meetings' }),
        expect.objectContaining({ content: 'Follow-up queue' }),
        expect.objectContaining({ content: 'Personal reminders' }),
      ]),
    );
  });
});
