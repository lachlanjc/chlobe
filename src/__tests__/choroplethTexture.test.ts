import { describe, expect, it } from "vitest";

import { computeCountryFill } from "../choroplethTexture";

describe("computeCountryFill", () => {
  const filledColorRange: readonly [string, string] = ["#82b6ff", "#0051c3"];

  it("returns the range start color at 70% alpha for a zero-share value", () => {
    const fill = computeCountryFill({
      value: 0,
      maxMagnitude: 100,
      filledColorRange,
    });
    expect(fill.fillStyle).toEqual("rgb(130, 182, 255)");
    expect(fill.alpha).toBeCloseTo(0.7);
  });

  it("returns the range end color at full alpha for the max value", () => {
    const fill = computeCountryFill({
      value: 100,
      maxMagnitude: 100,
      filledColorRange,
    });
    expect(fill.fillStyle).toEqual("rgb(0, 81, 195)");
    expect(fill.alpha).toBeCloseTo(1);
  });

  it("uses absolute values for the share, so negatives match positives", () => {
    const negative = computeCountryFill({
      value: -50,
      maxMagnitude: 100,
      filledColorRange,
    });
    const positive = computeCountryFill({
      value: 50,
      maxMagnitude: 100,
      filledColorRange,
    });
    expect(negative).toEqual(positive);
    expect(negative.alpha).toBeCloseTo(0.85);
  });

  it("treats a zero max magnitude as a zero share", () => {
    const fill = computeCountryFill({
      value: 42,
      maxMagnitude: 0,
      filledColorRange,
    });
    expect(fill.alpha).toBeCloseTo(0.7);
  });
});
