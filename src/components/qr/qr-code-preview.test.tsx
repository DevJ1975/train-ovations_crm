import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QrCodePreview } from './qr-code-preview';

describe('QrCodePreview', () => {
  it('renders a QR preview region', () => {
    render(<QrCodePreview value="https://trainovations.com/rep/jay-jones" />);

    expect(screen.getByLabelText('QR preview')).toBeInTheDocument();
  });
});
