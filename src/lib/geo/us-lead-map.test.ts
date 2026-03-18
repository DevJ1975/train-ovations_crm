import { describe, expect, it } from 'vitest';

import { resolveUsLeadMapPoint } from './us-lead-map';

describe('resolveUsLeadMapPoint', () => {
  it('returns map coordinates for supported U.S. locations', () => {
    expect(resolveUsLeadMapPoint('Phoenix, Arizona')).toEqual({ x: 27, y: 72 });
    expect(resolveUsLeadMapPoint('Dallas, Texas')).toEqual({ x: 52, y: 58 });
    expect(resolveUsLeadMapPoint('Boston, Massachusetts')).toEqual({ x: 84, y: 29 });
  });

  it('returns null when a location cannot be mapped', () => {
    expect(resolveUsLeadMapPoint('London, England')).toBeNull();
    expect(resolveUsLeadMapPoint(null)).toBeNull();
  });
});
