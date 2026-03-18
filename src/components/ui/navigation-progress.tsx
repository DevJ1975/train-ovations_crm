'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When pathname changes, navigation is complete — finish the bar
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (timerRef.current) clearInterval(timerRef.current);
      setWidth(100);
      completeTimer.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 400);
    }
  }, [pathname]);

  // Intercept link clicks to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return;
      if (href === pathname) return;

      // Start progress bar
      if (completeTimer.current) clearTimeout(completeTimer.current);
      if (timerRef.current) clearInterval(timerRef.current);

      setVisible(true);
      setWidth(8);

      let current = 8;
      timerRef.current = setInterval(() => {
        // Ease toward 85% — never reaches 100% until navigation completes
        current += (85 - current) * 0.08;
        setWidth(current);
      }, 120);
    }

    // Also intercept form submissions (server actions redirect)
    function handleSubmit() {
      if (completeTimer.current) clearTimeout(completeTimer.current);
      if (timerRef.current) clearInterval(timerRef.current);

      setVisible(true);
      setWidth(15);

      let current = 15;
      timerRef.current = setInterval(() => {
        current += (80 - current) * 0.07;
        setWidth(current);
      }, 150);
    }

    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimer.current) clearTimeout(completeTimer.current);
    };
  }, [pathname]);

  if (!visible && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-primary shadow-[0_0_8px_hsl(var(--tv-primary)/0.6)]"
      style={{
        width: `${width}%`,
        transition: width === 100 ? 'width 200ms ease-out' : 'width 120ms linear',
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
