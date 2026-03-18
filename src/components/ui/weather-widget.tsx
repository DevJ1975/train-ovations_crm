'use client';

import { useEffect, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type IconKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'thunder'
  | 'fog';

interface Weather {
  tempF: number;
  icon: IconKind;
  label: string;
  city: string;
}

// ── Mock data — swap for live fetch once deployed to HTTPS ─────────────────────

const MOCK_LAS_VEGAS: Weather = {
  tempF: 91,
  icon: 'clear-day',
  label: 'Sunny',
  city: 'Las Vegas, NV',
};

// ── SVG animation helpers ─────────────────────────────────────────────────────

/** Inline style that keeps SVG transform-origin anchored to the element center */
const fillCenter: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center',
};

// ── Animated SVG weather icons ────────────────────────────────────────────────

function ClearDayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      {/* rays — the whole group spins around the viewBox center */}
      <g style={{ ...fillCenter, animation: 'w-spin 8s linear infinite' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="19" y="2" width="2" height="7"
            rx="1"
            fill="#FBBF24"
            style={{ ...fillCenter, transform: `rotate(${deg}deg)` }}
          />
        ))}
      </g>
      {/* sun disk */}
      <circle cx="20" cy="20" r="8" fill="#FCD34D" />
    </svg>
  );
}

function ClearNightIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M24 8a12 12 0 1 1-15.5 15.5A15 15 0 0 0 24 8z" fill="#E2E8F0" />
      {([
        { cx: 31, cy: 8,  delay: '0s'   },
        { cx: 36, cy: 18, delay: '0.9s' },
        { cx: 33, cy: 27, delay: '1.7s' },
      ] as const).map(({ cx, cy, delay }, i) => (
        <circle
          key={i} cx={cx} cy={cy} r="1.5" fill="#FCD34D"
          style={{ ...fillCenter, animation: `w-twinkle 2.4s ease-in-out infinite ${delay}` }}
        />
      ))}
    </svg>
  );
}

function CloudBase({ color = '#CBD5E1', accent = '#E2E8F0' }: { color?: string; accent?: string }) {
  return (
    <g>
      <circle cx="11" cy="24" r="7"   fill={color} />
      <circle cx="21" cy="21" r="9"   fill={accent} />
      <circle cx="30" cy="25" r="6"   fill={color} />
      <rect   x="4"  y="25" width="32" height="11" rx="5.5" fill={color} />
    </g>
  );
}

function PartlyCloudyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      {/* small sun — spins slowly */}
      <g style={{ ...fillCenter, animation: 'w-spin 10s linear infinite' }}>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect key={deg} x="29" y="4" width="2" height="5" rx="1" fill="#FBBF24"
            style={{ transformOrigin: '30px 11px', transform: `rotate(${deg}deg)` }} />
        ))}
      </g>
      <circle cx="30" cy="11" r="5.5" fill="#FCD34D" />
      {/* cloud bobs in front */}
      <g style={{ ...fillCenter, animation: 'w-bob 3.5s ease-in-out infinite' }}>
        <CloudBase />
      </g>
    </svg>
  );
}

function CloudyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <g style={{ ...fillCenter, animation: 'w-drift 5s ease-in-out infinite 0.6s', opacity: 0.55 }}>
        <CloudBase color="#94A3B8" accent="#94A3B8" />
      </g>
      <g style={{ ...fillCenter, animation: 'w-drift 3.8s ease-in-out infinite' }}>
        <CloudBase />
      </g>
    </svg>
  );
}

function RainIcon({ drops = 4, light = false }: { drops?: number; light?: boolean }) {
  const xs = drops === 3 ? [9, 18, 27] : [7, 14, 21, 28];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <g style={{ ...fillCenter, animation: 'w-bob 4s ease-in-out infinite' }}>
        <CloudBase color="#94A3B8" accent="#CBD5E1" />
      </g>
      {xs.map((x, i) => (
        <line
          key={i}
          x1={x + 2} y1="27" x2={x} y2={light ? 33 : 35}
          stroke={light ? '#93C5FD' : '#60A5FA'}
          strokeWidth={light ? 1.5 : 2}
          strokeLinecap="round"
          style={{
            animation: `w-rain ${light ? 1.4 : 1.15}s ease-in infinite`,
            animationDelay: `${i * 0.28}s`,
          }}
        />
      ))}
    </svg>
  );
}

function SnowIcon() {
  const xs = [8, 16, 23, 30];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <g style={{ ...fillCenter, animation: 'w-bob 4s ease-in-out infinite' }}>
        <CloudBase color="#94A3B8" accent="#CBD5E1" />
      </g>
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy="27" r="2.2" fill="#BAE6FD"
          style={{ ...fillCenter, animation: `w-snow 1.9s ease-in infinite ${i * 0.38}s` }}
        />
      ))}
    </svg>
  );
}

function ThunderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <g style={{ ...fillCenter, animation: 'w-bob 4s ease-in-out infinite' }}>
        <CloudBase color="#64748B" accent="#475569" />
      </g>
      <path
        d="M22 24 L16 33 L21 33 L14 40 L27 29 L22 29 Z"
        fill="#FCD34D"
        style={{ animation: 'w-flash 2.8s ease-in-out infinite' }}
      />
    </svg>
  );
}

function FogIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      {[
        { y: 10, w: 30, x: 5,  delay: '0s'  },
        { y: 19, w: 24, x: 8,  delay: '0.6s' },
        { y: 28, w: 20, x: 10, delay: '1.2s' },
      ].map(({ y, w, x, delay }, i) => (
        <rect key={i} x={x} y={y} width={w} height="4.5" rx="2.25" fill="#94A3B8"
          style={{ animation: `w-fog-pulse 2.4s ease-in-out infinite ${delay}` }}
        />
      ))}
    </svg>
  );
}

function DrizzleIcon() {
  return <RainIcon drops={3} light />;
}

function WeatherIcon({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'clear-day':     return <ClearDayIcon />;
    case 'clear-night':   return <ClearNightIcon />;
    case 'partly-cloudy': return <PartlyCloudyIcon />;
    case 'cloudy':        return <CloudyIcon />;
    case 'rain':          return <RainIcon />;
    case 'drizzle':       return <DrizzleIcon />;
    case 'snow':          return <SnowIcon />;
    case 'thunder':       return <ThunderIcon />;
    case 'fog':           return <FogIcon />;
  }
}

// ── Widget ────────────────────────────────────────────────────────────────────

export function WeatherWidget() {
  const [now, setNow] = useState<Date | null>(null);

  // Clock — tick every 30 s; also guards against SSR mismatch
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const { tempF, icon, label, city } = MOCK_LAS_VEGAS;

  return (
    <div className="mb-5 rounded-xl border border-border/50 bg-surface-muted/50 px-3 py-3">
      {/* Time */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold tabular-nums text-foreground">{timeStr}</span>
        <span className="text-[11px] text-muted-foreground">{dateStr}</span>
      </div>

      {/* Weather */}
      <div className="mt-2 flex items-center gap-2.5">
        <div className="shrink-0">
          <WeatherIcon kind={icon} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {tempF}°F · {label}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{city}</p>
        </div>
      </div>
    </div>
  );
}
