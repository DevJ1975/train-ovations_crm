import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadStageProgress } from './lead-stage-progress';

describe('LeadStageProgress', () => {
  it('renders the full sales-stage rail for an active lead', () => {
    render(<LeadStageProgress status="qualified" />);

    expect(screen.getByLabelText(/lead stage progress: qualified/i)).toBeInTheDocument();
    expect(screen.getByText(/sales stage/i)).toBeInTheDocument();
    expect(screen.getByText(/^new$/i)).toBeInTheDocument();
    expect(screen.getByText(/^proposal$/i)).toBeInTheDocument();
  });

  it('renders the compact rail for terminal stages', () => {
    render(<LeadStageProgress compact status="won" />);

    expect(screen.getByLabelText(/lead stage progress: won/i)).toBeInTheDocument();
    expect(screen.getAllByText(/won/i).length).toBeGreaterThan(0);
  });
});
