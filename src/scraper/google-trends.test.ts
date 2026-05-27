import { describe, expect, it } from 'vitest';

import { trafficToScore } from './google-trends';

describe('trafficToScore', () => {
  it('returns the neutral 0.5 when traffic is missing or unparseable', () => {
    expect(trafficToScore(undefined)).toBe(0.5);
    expect(trafficToScore('lots')).toBe(0.5);
  });

  it('maps magnitude strings to the threshold table', () => {
    expect(trafficToScore('10M+')).toBe(1);
    expect(trafficToScore('1M+')).toBe(0.85);
    expect(trafficToScore('500K+')).toBe(0.7);
    expect(trafficToScore('200K+')).toBe(0.55);
    expect(trafficToScore('50K+')).toBe(0.4);
    expect(trafficToScore('10K+')).toBe(0.3);
  });

  it('returns the floor score below the lowest threshold', () => {
    expect(trafficToScore('5K+')).toBe(0.2);
    expect(trafficToScore('500+')).toBe(0.2);
  });

  it('handles commas, spaces and decimals', () => {
    expect(trafficToScore('2,000,000+')).toBe(0.85);
    expect(trafficToScore('1.5M')).toBe(0.85);
  });
});
