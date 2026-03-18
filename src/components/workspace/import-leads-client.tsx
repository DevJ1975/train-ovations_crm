'use client';

import { useRef, useState } from 'react';

import { TVButton, TVCard, TVSectionHeader } from '@/components/trainovations';

interface ParsedLead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  notes: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const EXPECTED_HEADERS = ['firstName', 'lastName', 'email', 'phone', 'company', 'title', 'notes'] as const;

/**
 * Parse a single CSV line respecting double-quoted fields.
 * Does not handle escaped quotes within fields (RFC 4180 minimal).
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped double-quote inside a quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): ParsedLead[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));

  // Build a mapping from EXPECTED_HEADERS to column index, case-insensitive
  const colIndex: Record<string, number> = {};
  for (const expected of EXPECTED_HEADERS) {
    const idx = headers.indexOf(expected.toLowerCase());
    colIndex[expected] = idx; // -1 means column not present
  }

  const leads: ParsedLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (key: (typeof EXPECTED_HEADERS)[number]) => {
      const idx = colIndex[key];
      return idx >= 0 ? (cols[idx] ?? '').trim() : '';
    };

    leads.push({
      firstName: get('firstName'),
      lastName: get('lastName'),
      email: get('email'),
      phone: get('phone'),
      company: get('company'),
      title: get('title'),
      notes: get('notes'),
    });
  }

  return leads;
}

export function ImportLeadsClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setParseError(null);
    setLeads([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setParseError('Could not read the file.');
        return;
      }

      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setParseError(
          'No data rows found. Make sure the file has a header row and at least one data row.',
        );
        return;
      }

      setLeads(parsed);
    };
    reader.onerror = () => setParseError('Failed to read the file.');
    reader.readAsText(file);
  }

  async function handleImport() {
    if (leads.length === 0) return;

    setIsImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/workspace/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leads),
      });

      const data = (await response.json()) as ImportResult & { error?: string };

      if (!response.ok) {
        setParseError(data.error ?? 'Import failed. Please try again.');
        return;
      }

      setResult(data);
      setLeads([]);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setParseError('A network error occurred. Please try again.');
    } finally {
      setIsImporting(false);
    }
  }

  function handleReset() {
    setLeads([]);
    setFileName(null);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const previewLeads = leads.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* File picker */}
      <TVCard className="space-y-4">
        <TVSectionHeader
          title="Select a CSV file"
          description={`Expected columns (first row must be a header): ${EXPECTED_HEADERS.join(', ')}`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label
            className="tv-pressable inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-[linear-gradient(180deg,hsl(var(--tv-surface)),hsl(var(--tv-surface-muted)/0.88))] px-5 text-label text-foreground shadow-[0_12px_24px_-20px_hsl(var(--tv-foreground)/0.24)] transition-colors hover:border-primary/20"
            htmlFor="csv-file-input"
          >
            Choose file
          </label>
          <input
            accept=".csv,text/csv"
            className="sr-only"
            id="csv-file-input"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          {fileName ? (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No file chosen</span>
          )}
        </div>

        {parseError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            {parseError}
          </p>
        ) : null}
      </TVCard>

      {/* Preview table */}
      {leads.length > 0 ? (
        <TVCard className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Preview — {leads.length} lead{leads.length !== 1 ? 's' : ''} found
              {leads.length > 5 ? ` (showing first 5)` : ''}
            </p>
            <TVButton onClick={handleReset} size="sm" variant="ghost">
              Clear
            </TVButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">First name</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Last name</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Email</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Company</th>
                  <th className="pb-2 font-medium text-muted-foreground">Title</th>
                </tr>
              </thead>
              <tbody>
                {previewLeads.map((lead, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2 pr-4 text-foreground">{lead.firstName || <span className="text-danger">—</span>}</td>
                    <td className="py-2 pr-4 text-foreground">{lead.lastName || <span className="text-danger">—</span>}</td>
                    <td className="py-2 pr-4 text-foreground">{lead.email || <span className="text-danger">—</span>}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{lead.phone || '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{lead.company || '—'}</td>
                    <td className="py-2 text-muted-foreground">{lead.title || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TVButton
            disabled={isImporting}
            loading={isImporting}
            onClick={handleImport}
            variant="primary"
          >
            {isImporting ? 'Importing...' : `Import ${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
          </TVButton>
        </TVCard>
      ) : null}

      {/* Result banner */}
      {result ? (
        <TVCard className="space-y-3">
          <p className="font-medium text-foreground">
            Import complete — imported {result.imported} lead{result.imported !== 1 ? 's' : ''}
            {result.skipped > 0 ? `, skipped ${result.skipped} row${result.skipped !== 1 ? 's' : ''}` : ''}
          </p>

          {result.errors.length > 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Skipped rows:</p>
              <ul className="space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-sm text-danger">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-3">
            <TVButton
              asChild
              size="sm"
              variant="secondary"
            >
              <a href="/workspace/leads">Back to lead inbox</a>
            </TVButton>
            <TVButton onClick={handleReset} size="sm" variant="ghost">
              Import another file
            </TVButton>
          </div>
        </TVCard>
      ) : null}
    </div>
  );
}
