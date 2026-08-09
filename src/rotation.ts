/**
 * Pure rotation math for the world globe chart's phi (horizontal spin)
 * animation. Kept free of DOM/React so the easing behavior is unit-testable.
 */

/** Radians the globe auto-rotates per animation frame. */
export const AUTO_ROTATE_PHI_PER_FRAME = 0.0025;

/** Fraction of the remaining delta applied per frame when easing to a target. */
export const PHI_EASING_FACTOR = 0.08;

/** Remaining deltas below this snap directly to the target (radians). */
const PHI_SNAP_THRESHOLD = 0.01;

const TWO_PI = 2 * Math.PI;

/**
 * The phi rotation that centers the given longitude (degrees) on screen,
 * facing the viewer.
 */
export function phiForLongitude(lonDegrees: number): number {
  return (3 * Math.PI) / 2 - (lonDegrees * Math.PI) / 180;
}

/**
 * The signed shortest-path rotation from `from` to `to`, normalized into
 * (-PI, PI] so the globe never spins the long way around.
 */
export function shortestPhiDelta(from: number, to: number): number {
  const delta = to - from;
  return delta - Math.round(delta / TWO_PI) * TWO_PI;
}

/**
 * One frame of easing `currentPhi` toward `targetPhi`: moves by
 * `PHI_EASING_FACTOR` of the remaining shortest-path delta, snapping to the
 * target (and reporting `done`) once the remainder is below
 * `PHI_SNAP_THRESHOLD`.
 */
export function stepPhiTowardTarget(
  currentPhi: number,
  targetPhi: number
): { phi: number; done: boolean } {
  const delta = shortestPhiDelta(currentPhi, targetPhi);
  if (Math.abs(delta) < PHI_SNAP_THRESHOLD) {
    return { done: true, phi: targetPhi };
  }
  return { done: false, phi: currentPhi + delta * PHI_EASING_FACTOR };
}

/**
 * The target phi that centers `lonDegrees` on screen, expressed as the
 * value nearest `currentPhi` so the subsequent easing takes the shortest
 * path (e.g. easing from 6.2 to a longitude at phi 0.1 targets ~6.38
 * rather than unwinding almost a full turn).
 */
export function targetPhiForLongitude(
  currentPhi: number,
  lonDegrees: number
): number {
  return currentPhi + shortestPhiDelta(currentPhi, phiForLongitude(lonDegrees));
}
