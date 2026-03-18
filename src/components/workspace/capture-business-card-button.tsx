'use client';

import { useId, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

import { TVButton } from '@/components/trainovations';

export function CaptureBusinessCardButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleOpenCamera() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);

     if (!file) {
      setStatusText(null);
      return;
    }

    setIsProcessing(true);
    setStatusText('Processing business card...');

    try {
      const formData = new FormData();
      formData.set('image', file);

      const response = await fetch('/api/workspace/business-card/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Unable to process business card');
      }

      const payload = (await response.json()) as {
        parsedCard?: {
          extractedFields?: {
            name?: { value: string };
            company?: { value: string };
            email?: { value: string };
          };
        };
      };
      const fields = payload.parsedCard?.extractedFields;
      const summary = [fields?.name?.value, fields?.company?.value, fields?.email?.value]
        .filter(Boolean)
        .join(' • ');

      setStatusText(summary ? `OCR ready: ${summary}` : 'OCR complete. Review extracted details next.');
    } catch {
      setStatusText('OCR processing will be available again soon.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        accept="image/*"
        aria-label="Capture business card photo"
        capture="environment"
        className="sr-only"
        id={inputId}
        onChange={handleFileChange}
        type="file"
      />
      <TVButton onClick={handleOpenCamera} type="button" variant="secondary">
        <Camera className="mr-2 h-4 w-4" />
        {isProcessing ? 'Processing Card...' : 'Capture Business Card'}
      </TVButton>
      <p className="text-xs text-muted-foreground">
        {statusText
          ? statusText
          : fileName
            ? `Ready to process: ${fileName}`
          : 'Open your device camera or photo picker to capture a rep business card.'}
      </p>
    </div>
  );
}
