'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';

export interface SignatureCanvasHandle {
  getDataUrl: () => string;
  isEmpty: () => boolean;
}

interface SignatureCanvasProps {
  onSign?: (dataUrl: string) => void;
  className?: string;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 160;
const GUIDE_Y_RATIO = 0.75;

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  function SignatureCanvas({ onSign, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const [empty, setEmpty] = useState(true);

    // Initialize canvas background + guide line
    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Baseline guide
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const guideY = Math.round(CANVAS_HEIGHT * GUIDE_Y_RATIO);
      ctx.moveTo(16, guideY);
      ctx.lineTo(CANVAS_WIDTH - 16, guideY);
      ctx.stroke();
      ctx.setLineDash([]);
    }, []);

    useEffect(() => {
      initCanvas();
    }, [initCanvas]);

    const getPos = (
      e: React.MouseEvent | React.TouchEvent,
      canvas: HTMLCanvasElement,
    ): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0] ?? e.changedTouches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      isDrawingRef.current = true;
      setEmpty(false);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getPos(e, canvas);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSign?.(dataUrl);
    };

    const clear = () => {
      initCanvas();
      setEmpty(true);
      onSign?.('');
    };

    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        return canvasRef.current?.toDataURL('image/png') ?? '';
      },
      isEmpty: () => empty,
    }));

    return (
      <div className={className}>
        <div className="relative w-full select-none rounded-lg border border-border bg-white overflow-hidden">
          {empty && (
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6 text-muted-foreground text-sm"
              style={{ paddingBottom: `${(1 - GUIDE_Y_RATIO) * 100 + 4}%` }}
            >
              Sign here
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full touch-none cursor-crosshair"
            style={{ display: 'block' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
    );
  },
);
