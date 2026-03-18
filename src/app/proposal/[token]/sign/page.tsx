'use client';

import React, { useRef, useState, useEffect, type FormEvent } from 'react';
import { CheckCircle } from 'lucide-react';
import { TVCard, TVCardTitle, TVButton, TVInput } from '@/components/trainovations';
import {
  SignatureCanvas,
  type SignatureCanvasHandle,
} from '@/components/proposal/signature-canvas';

interface ProposalData {
  id: string;
  title: string;
  status: string;
  totalValueCents: number | null;
  signedAt: string | null;
  signerName: string | null;
  repProfile?: {
    signatureProfile?: { companyName?: string | null } | null;
  } | null;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function SignProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureData, setSignatureData] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef<SignatureCanvasHandle>(null);

  // Unwrap the async params
  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  // Fetch proposal once we have the token
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/proposal/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Proposal not found');
        return res.json() as Promise<ProposalData>;
      })
      .then((data) => {
        setProposal(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !proposal) return;

    if (!signerName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!signerEmail.trim()) {
      setSubmitError('Please enter your email.');
      return;
    }
    if (canvasRef.current?.isEmpty()) {
      setSubmitError('Please draw your signature.');
      return;
    }

    const dataUrl = canvasRef.current?.getDataUrl() ?? signatureData;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/proposal/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          signatureData: dataUrl,
        }),
      });

      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setSubmitError(json.error ?? 'Failed to sign proposal.');
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tv-shell flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <p className="text-muted-foreground">Loading proposal…</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="tv-shell flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
        <TVCard className="max-w-md w-full text-center space-y-3">
          <TVCardTitle>Proposal not found</TVCardTitle>
          <p className="text-muted-foreground text-sm">{error ?? 'This proposal link is invalid.'}</p>
        </TVCard>
      </div>
    );
  }

  // Already signed
  if (proposal.status === 'signed' || proposal.signedAt) {
    return (
      <div className="tv-shell flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
        <TVCard className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-success" />
          <TVCardTitle>Proposal already signed</TVCardTitle>
          <p className="text-sm text-muted-foreground">
            This proposal was already signed on{' '}
            {new Date(proposal.signedAt!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {proposal.signerName ? ` by ${proposal.signerName}` : ''}.
          </p>
        </TVCard>
      </div>
    );
  }

  if (success) {
    return (
      <div className="tv-shell flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
        <TVCard className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-success" />
          <TVCardTitle>Proposal signed successfully</TVCardTitle>
          <p className="text-sm text-muted-foreground">
            Thank you, {signerName}. Your acceptance of &ldquo;{proposal.title}&rdquo; has been
            recorded. You will receive a confirmation at {signerEmail}.
          </p>
        </TVCard>
      </div>
    );
  }

  const company =
    (proposal as ProposalData & { account?: { name: string } | null })?.['account']?.name ??
    proposal.repProfile?.signatureProfile?.companyName ??
    null;

  return (
    <div className="tv-shell min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-12">
      <div className="mx-auto max-w-xl space-y-8">
        {/* Proposal summary */}
        <TVCard className="space-y-2">
          <TVCardTitle>{proposal.title}</TVCardTitle>
          {company && <p className="text-sm text-muted-foreground">{company}</p>}
          {proposal.totalValueCents != null && (
            <p className="text-sm font-semibold text-foreground">
              Total investment: {formatCurrency(proposal.totalValueCents)}
            </p>
          )}
        </TVCard>

        {/* Sign form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <TVCard className="space-y-4">
            <TVCardTitle className="text-base">Sign this proposal</TVCardTitle>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="signerName">
                Your full name
              </label>
              <TVInput
                id="signerName"
                type="text"
                placeholder="Jane Smith"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="signerEmail">
                Your email address
              </label>
              <TVInput
                id="signerEmail"
                type="email"
                placeholder="jane@example.com"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Signature</label>
              <SignatureCanvas
                ref={canvasRef}
                onSign={(dataUrl) => setSignatureData(dataUrl)}
              />
            </div>

            {submitError && (
              <p className="text-sm text-danger">{submitError}</p>
            )}

            <TVButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
              disabled={submitting}
            >
              Sign &amp; Accept Proposal
            </TVButton>
          </TVCard>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By signing, you accept the terms outlined in this proposal.
          Powered by Trainovations CRM.
        </p>
      </div>
    </div>
  );
}
