import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DataTable } from './data-table';

type LeadRow = {
  id: string;
  name: string;
  company: string;
};

describe('DataTable', () => {
  it('renders tanstack table data with Trainovations table wrappers', () => {
    const columnHelper = createColumnHelper<LeadRow>();
    const columns = [
      columnHelper.accessor('name', {
        header: 'Lead',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: (info) => info.getValue(),
      }),
    ];

    render(
      <DataTable
        columns={columns as ColumnDef<LeadRow, unknown>[]}
        data={[{ id: '1', name: 'Jordan Lee', company: 'Apex Industrial' }]}
      />,
    );

    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Apex Industrial')).toBeInTheDocument();
  });

  it('supports sorting and pagination controls through the shared table layer', async () => {
    const user = userEvent.setup();
    const columnHelper = createColumnHelper<LeadRow>();
    const columns = [
      columnHelper.accessor('name', {
        header: 'Lead',
        cell: (info) => info.getValue(),
      }),
    ];

    render(
      <DataTable
        columns={columns as ColumnDef<LeadRow, unknown>[]}
        data={[
          { id: '1', name: 'Zoe Carter', company: 'Zeta' },
          { id: '2', name: 'Alex Brown', company: 'Alpha' },
        ]}
        pageSize={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: /lead/i }));
    expect(screen.getByText('Alex Brown')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Zoe Carter')).toBeInTheDocument();
  });
});
