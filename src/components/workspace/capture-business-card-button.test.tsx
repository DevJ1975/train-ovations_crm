import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CaptureBusinessCardButton } from './capture-business-card-button';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CaptureBusinessCardButton', () => {
  it('renders a camera-trigger button and capture input', () => {
    render(<CaptureBusinessCardButton />);

    expect(
      screen.getByRole('button', { name: /capture business card/i }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/capture business card photo/i);

    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('capture', 'environment');
  });

  it('posts the captured image to the OCR endpoint and shows extracted status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        parsedCard: {
          extractedFields: {
            name: { value: 'Jordan Lee' },
            company: { value: 'Apex Industrial' },
            email: { value: 'jordan@example.com' },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<CaptureBusinessCardButton />);

    const input = screen.getByLabelText(/capture business card photo/i);
    const file = new File(['card'], 'card.png', { type: 'image/png' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/workspace/business-card/parse',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    expect(
      await screen.findByText(/ocr ready: jordan lee • apex industrial • jordan@example.com/i),
    ).toBeInTheDocument();
  });
});
