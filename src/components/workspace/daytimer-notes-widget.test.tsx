import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@blocknote/react', () => ({
  useCreateBlockNote: vi.fn(() => ({
    document: [{ type: 'paragraph', content: 'Mock note' }],
  })),
}));

vi.mock('@blocknote/mantine', () => ({
  BlockNoteView: ({
    onChange,
  }: {
    onChange?: () => void;
  }) => (
    <div>
      <button onClick={onChange} type="button">
        Trigger editor change
      </button>
      <div>Mock BlockNote editor</div>
    </div>
  ),
}));

import { DaytimerNotesWidget } from './daytimer-notes-widget';

describe('DaytimerNotesWidget', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00.000-07:00'));
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('renders the daytimer workspace and persists edits by date', () => {
    render(<DaytimerNotesWidget />);

    expect(screen.getByText(/daytimer notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day page/i)).toHaveValue('2026-03-14');

    fireEvent.change(screen.getByLabelText(/day page/i), {
      target: { value: '2026-03-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /trigger editor change/i }));

    expect(window.localStorage.getItem('trainovations-daytimer-notes')).toContain('Mock note');
  });
});
