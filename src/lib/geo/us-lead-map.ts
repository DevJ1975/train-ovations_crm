export interface UsLeadMapPoint {
  x: number;
  y: number;
}

const LOCATION_POINTS: Array<{
  point: UsLeadMapPoint;
  patterns: RegExp[];
}> = [
  { point: { x: 14, y: 21 }, patterns: [/seattle/i, /\bwa\b/i, /\bwashington\b/i] },
  { point: { x: 16, y: 31 }, patterns: [/portland/i, /\bor\b/i, /\boregon\b/i] },
  { point: { x: 12, y: 54 }, patterns: [/san francisco/i, /sacramento/i, /\bca\b/i, /\bcalifornia\b/i] },
  { point: { x: 16, y: 70 }, patterns: [/los angeles/i, /san diego/i] },
  { point: { x: 25, y: 63 }, patterns: [/las vegas/i, /\bnv\b/i, /\bnevada\b/i] },
  { point: { x: 27, y: 72 }, patterns: [/phoenix/i, /\baz\b/i, /\barizona\b/i] },
  { point: { x: 36, y: 44 }, patterns: [/denver/i, /\bco\b/i, /\bcolorado\b/i] },
  { point: { x: 44, y: 33 }, patterns: [/minneapolis/i, /\bmn\b/i, /\bminnesota\b/i] },
  { point: { x: 48, y: 48 }, patterns: [/kansas city/i, /\bks\b/i, /\bkansas\b/i] },
  { point: { x: 52, y: 58 }, patterns: [/dallas/i, /fort worth/i, /\btx\b/i, /\btexas\b/i] },
  { point: { x: 56, y: 66 }, patterns: [/houston/i] },
  { point: { x: 58, y: 47 }, patterns: [/chicago/i, /\bil\b/i, /\billinois\b/i] },
  { point: { x: 61, y: 56 }, patterns: [/nashville/i, /memphis/i, /\btn\b/i, /\btennessee\b/i] },
  { point: { x: 65, y: 69 }, patterns: [/atlanta/i, /\bga\b/i, /\bgeorgia\b/i] },
  { point: { x: 72, y: 74 }, patterns: [/orlando/i, /miami/i, /tampa/i, /\bfl\b/i, /\bflorida\b/i] },
  { point: { x: 74, y: 54 }, patterns: [/charlotte/i, /\bnc\b/i, /\bnorth carolina\b/i] },
  { point: { x: 77, y: 46 }, patterns: [/washington, d\.?c/i, /\bdc\b/i, /baltimore/i] },
  { point: { x: 82, y: 36 }, patterns: [/new york/i, /philadelphia/i, /\bnj\b/i, /\bnew jersey\b/i] },
  { point: { x: 84, y: 29 }, patterns: [/boston/i, /\bma\b/i, /\bmassachusetts\b/i] },
];

export function resolveUsLeadMapPoint(location: string | null | undefined): UsLeadMapPoint | null {
  if (!location?.trim()) {
    return null;
  }

  const normalized = location.trim();
  const match = LOCATION_POINTS.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(normalized)),
  );

  return match?.point ?? null;
}
