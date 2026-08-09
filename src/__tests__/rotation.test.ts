import { describe, expect, it } from 'vitest';

import {
  PHI_EASING_FACTOR,
  phiForLongitude,
  shortestPhiDelta,
  stepPhiTowardTarget,
  targetPhiForLongitude,
} from '../rotation';

const TWO_PI = 2 * Math.PI;

describe(phiForLongitude, () => {
  const cases: [lonDegrees: number, expectedPhi: number][] = [
    [0, (3 * Math.PI) / 2],
    [90, Math.PI],
    [180, Math.PI / 2],
    [-90, TWO_PI],
    [-180, (5 * Math.PI) / 2],
  ];

  it.each(cases)('maps longitude %d° to phi %f', (lonDegrees, expectedPhi) => {
    expect(phiForLongitude(lonDegrees)).toBeCloseTo(expectedPhi, 10);
  });
});

describe(shortestPhiDelta, () => {
  it('returns the plain difference when it is already short', () => {
    expect(shortestPhiDelta(1, 1.5)).toBeCloseTo(0.5, 10);
    expect(shortestPhiDelta(1.5, 1)).toBeCloseTo(-0.5, 10);
  });

  it('wraps deltas larger than half a turn to the shorter direction', () => {
    // Going from 0.1 to 2π - 0.1 is shorter backwards by 0.2.
    expect(shortestPhiDelta(0.1, TWO_PI - 0.1)).toBeCloseTo(-0.2, 10);
    expect(shortestPhiDelta(TWO_PI - 0.1, 0.1)).toBeCloseTo(0.2, 10);
  });

  it('handles targets many turns away', () => {
    expect(shortestPhiDelta(0, 5 * TWO_PI + 0.3)).toBeCloseTo(0.3, 10);
    expect(shortestPhiDelta(3 * TWO_PI, -0.4)).toBeCloseTo(-0.4, 10);
  });

  it('returns zero for equal angles', () => {
    expect(shortestPhiDelta(1.234, 1.234)).toBe(0);
    expect(shortestPhiDelta(0, TWO_PI)).toBeCloseTo(0, 10);
  });
});

describe(stepPhiTowardTarget, () => {
  it('moves a fraction of the remaining delta each step', () => {
    const { phi, done } = stepPhiTowardTarget(0, 1);
    expect(phi).toBeCloseTo(PHI_EASING_FACTOR, 10);
    expect(done).toBeFalsy();
  });

  it('eases along the shortest path across the 2π wrap', () => {
    const { phi } = stepPhiTowardTarget(0.1, TWO_PI - 0.1);
    // Shortest delta is -0.2, so phi should decrease.
    expect(phi).toBeCloseTo(0.1 - 0.2 * PHI_EASING_FACTOR, 10);
  });

  it('snaps to the target when the remaining delta is below the threshold', () => {
    const { phi, done } = stepPhiTowardTarget(1, 1.005);
    expect(phi).toBe(1.005);
    expect(done).toBeTruthy();
  });

  it('converges to done within a bounded number of steps', () => {
    let phi = 0;
    let done = false;
    for (let i = 0; i < 200 && !done; i++) {
      ({ phi, done } = stepPhiTowardTarget(phi, Math.PI));
    }
    expect(done).toBeTruthy();
    expect(phi).toBeCloseTo(Math.PI, 10);
  });
});

describe(targetPhiForLongitude, () => {
  it('returns phiForLongitude when starting from zero', () => {
    expect(targetPhiForLongitude(0, 0)).toBeCloseTo(
      shortestPhiDelta(0, phiForLongitude(0)),
      10
    );
  });

  it('stays within half a turn of the current phi', () => {
    const currentPhis = [0, 1, Math.PI, 5, 3 * TWO_PI, -7];
    const longitudes = [-180, -90, 0, 45, 90, 180];
    for (const currentPhi of currentPhis) {
      for (const lonDegrees of longitudes) {
        const target = targetPhiForLongitude(currentPhi, lonDegrees);
        expect(Math.abs(target - currentPhi)).toBeLessThanOrEqual(
          Math.PI + 1e-9
        );
        // The target must be an equivalent angle to phiForLongitude.
        expect(
          shortestPhiDelta(target, phiForLongitude(lonDegrees))
        ).toBeCloseTo(0, 10);
      }
    }
  });
});
