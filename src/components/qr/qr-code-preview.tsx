'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

type QrCodePreviewProps = {
  value: string;
  title?: string;
};

export function QrCodePreview({ value, title = 'QR preview' }: QrCodePreviewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex rounded-2xl border bg-white p-4 shadow-sm" aria-label={title}>
      {mounted && <QRCode value={value} size={144} />}
    </div>
  );
}
