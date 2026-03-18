const LOCATION_TIMEZONES: Array<{
  timeZone: string;
  patterns: RegExp[];
}> = [
  {
    timeZone: 'America/Phoenix',
    patterns: [/phoenix/i, /\barizona\b/i, /\baz\b/i],
  },
  {
    timeZone: 'America/Denver',
    patterns: [/denver/i, /\bcolorado\b/i, /\bco\b/i, /salt lake city/i, /\butah\b/i],
  },
  {
    timeZone: 'America/Los_Angeles',
    patterns: [
      /los angeles/i,
      /san francisco/i,
      /san diego/i,
      /seattle/i,
      /portland/i,
      /las vegas/i,
      /\bcalifornia\b/i,
      /\bnevada\b/i,
      /\bwashington\b/i,
      /\boregon\b/i,
      /\bca\b/i,
      /\bnv\b/i,
      /\bwa\b/i,
      /\bor\b/i,
    ],
  },
  {
    timeZone: 'America/Chicago',
    patterns: [
      /dallas/i,
      /houston/i,
      /austin/i,
      /san antonio/i,
      /chicago/i,
      /minneapolis/i,
      /nashville/i,
      /new orleans/i,
      /st\.?\s*louis/i,
      /\btexas\b/i,
      /\billinois\b/i,
      /\bminnesota\b/i,
      /\bwisconsin\b/i,
      /\btn\b/i,
      /\btx\b/i,
      /\bil\b/i,
      /\bmn\b/i,
      /\bwi\b/i,
    ],
  },
  {
    timeZone: 'America/New_York',
    patterns: [
      /new york/i,
      /boston/i,
      /philadelphia/i,
      /miami/i,
      /orlando/i,
      /tampa/i,
      /atlanta/i,
      /charlotte/i,
      /washington/i,
      /\bdc\b/i,
      /\bflorida\b/i,
      /\bgeorgia\b/i,
      /\bmassachusetts\b/i,
      /\bnew jersey\b/i,
      /\bfl\b/i,
      /\bga\b/i,
      /\bma\b/i,
      /\bnj\b/i,
    ],
  },
];

function parseShortOffset(value: string) {
  const normalized = value.replace('GMT', '');

  if (!normalized) {
    return 0;
  }

  const match = normalized.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');

  return sign * (hours * 60 + minutes);
}

function getOffsetMinutes(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: 'numeric',
  });
  const part = formatter
    .formatToParts(date)
    .find((value) => value.type === 'timeZoneName')?.value;

  return parseShortOffset(part ?? 'GMT');
}

export function resolveLocationTimeZone(location: string | null | undefined) {
  if (!location?.trim()) {
    return null;
  }

  const match = LOCATION_TIMEZONES.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(location)),
  );

  if (!match) {
    return null;
  }

  return {
    location,
    timeZone: match.timeZone,
  };
}

export function formatTimeForZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const formatted = formatter.formatToParts(date);

  const time = formatter.format(date).replace(
    formatted.find((part) => part.type === 'timeZoneName')?.value ?? '',
    '',
  ).trim();

  return {
    time,
    zone: formatted.find((part) => part.type === 'timeZoneName')?.value ?? timeZone,
  };
}

export function getTimeDifferenceLabel(repTimeZone: string, leadTimeZone: string, date: Date) {
  const repOffset = getOffsetMinutes(date, repTimeZone);
  const leadOffset = getOffsetMinutes(date, leadTimeZone);
  const diffMinutes = leadOffset - repOffset;

  if (diffMinutes === 0) {
    return 'same local time';
  }

  const hours = Math.abs(diffMinutes) / 60;
  const suffix = diffMinutes > 0 ? 'ahead' : 'behind';

  if (Number.isInteger(hours)) {
    return `${hours}h ${suffix}`;
  }

  return `${hours.toFixed(1)}h ${suffix}`;
}
