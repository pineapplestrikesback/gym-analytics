import { describe, it, expect } from 'vitest';
import { getVolumeColor, getVolumeOpacity, getNoTargetColor } from '../color-scale';

/**
 * Parse an oklch string into its components
 */
function parseOklch(color: string): { L: number; C: number; H: number } {
  const match = color.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
  if (!match) throw new Error(`Invalid oklch color: ${color}`);

  const L = match[1];
  const C = match[2];
  const H = match[3];

  if (L === undefined || C === undefined || H === undefined) {
    throw new Error(`Invalid oklch color: ${color}`);
  }

  return {
    L: parseFloat(L),
    C: parseFloat(C),
    H: parseFloat(H),
  };
}

describe('color-scale', () => {
  describe('getVolumeColor', () => {
    it('should return purple-ish color for 0%', () => {
      const color = getVolumeColor(0);
      const { H } = parseOklch(color);

      // Purple hue is around 290 degrees
      expect(H).toBeGreaterThanOrEqual(280);
      expect(H).toBeLessThanOrEqual(300);
    });

    it('should return blue color for 25%', () => {
      const color = getVolumeColor(25);
      const { H } = parseOklch(color);

      // Blue hue is around 250 degrees
      expect(H).toBeGreaterThanOrEqual(240);
      expect(H).toBeLessThanOrEqual(260);
    });

    it('should return teal color for 50%', () => {
      const color = getVolumeColor(50);
      const { H } = parseOklch(color);

      // Teal hue is around 200 degrees
      expect(H).toBeGreaterThanOrEqual(190);
      expect(H).toBeLessThanOrEqual(210);
    });

    it('should return green color for 100% (goal achieved)', () => {
      const color = getVolumeColor(100);
      const { H } = parseOklch(color);

      // Green hue is around 142 degrees
      expect(H).toBeGreaterThanOrEqual(135);
      expect(H).toBeLessThanOrEqual(150);
    });

    it('should return yellow color for 110% (slight over)', () => {
      const color = getVolumeColor(110);
      const { H } = parseOklch(color);

      // Yellow hue is around 85 degrees
      expect(H).toBeGreaterThanOrEqual(75);
      expect(H).toBeLessThanOrEqual(95);
    });

    it('should return red color for 150% (warning)', () => {
      const color = getVolumeColor(150);
      const { H } = parseOklch(color);

      // Red hue is around 29 degrees
      expect(H).toBeGreaterThanOrEqual(20);
      expect(H).toBeLessThanOrEqual(40);
    });

    it('should interpolate smoothly between color stops', () => {
      // Test that colors between stops have intermediate hue values
      const color37 = getVolumeColor(37.5);
      const color25 = getVolumeColor(25);
      const color50 = getVolumeColor(50);

      const h37 = parseOklch(color37).H;
      const h25 = parseOklch(color25).H;
      const h50 = parseOklch(color50).H;

      // 37.5% should be between 25% and 50% hues
      // Since hue goes from 250 (blue) to 200 (teal), h37 should be in between
      expect(h37).toBeLessThan(h25);
      expect(h37).toBeGreaterThan(h50);
    });

    it('should clamp negative percentages to 0%', () => {
      const colorNeg = getVolumeColor(-10);
      const colorZero = getVolumeColor(0);

      expect(colorNeg).toBe(colorZero);
    });

    it('should clamp percentages above 150% to 150%', () => {
      const color200 = getVolumeColor(200);
      const color150 = getVolumeColor(150);

      expect(color200).toBe(color150);
    });

    it('should return valid oklch format', () => {
      const color = getVolumeColor(50);

      expect(color).toMatch(/^oklch\([0-9.]+\s+[0-9.]+\s+[0-9.]+\)$/);
    });

    it('should have increasing lightness from 0% to 100%', () => {
      const l0 = parseOklch(getVolumeColor(0)).L;
      const l50 = parseOklch(getVolumeColor(50)).L;
      const l100 = parseOklch(getVolumeColor(100)).L;

      expect(l50).toBeGreaterThan(l0);
      expect(l100).toBeGreaterThan(l50);
    });
  });

  describe('getVolumeOpacity', () => {
    it('should return 0.4 for 0%', () => {
      expect(getVolumeOpacity(0)).toBe(0.4);
    });

    it('should return 1.0 for 100%', () => {
      expect(getVolumeOpacity(100)).toBe(1.0);
    });

    it('should return 1.0 for values above 100%', () => {
      expect(getVolumeOpacity(150)).toBe(1.0);
      expect(getVolumeOpacity(200)).toBe(1.0);
    });

    it('should return 0.7 for 50% (midpoint)', () => {
      expect(getVolumeOpacity(50)).toBe(0.7);
    });

    it('should increase linearly with percentage', () => {
      const o25 = getVolumeOpacity(25);
      const o50 = getVolumeOpacity(50);
      const o75 = getVolumeOpacity(75);

      // Check linear progression
      expect(o50 - o25).toBeCloseTo(o75 - o50);
    });

    it('should clamp negative percentages to 0%', () => {
      expect(getVolumeOpacity(-50)).toBe(0.4);
    });
  });

  describe('getNoTargetColor', () => {
    it('should return a gray color', () => {
      const color = getNoTargetColor();
      const { L, C } = parseOklch(color);

      // Gray should have low chroma
      expect(C).toBeLessThan(0.05);
      // Should have reasonable lightness for visibility
      expect(L).toBeGreaterThan(0.2);
      expect(L).toBeLessThan(0.5);
    });

    it('should be distinct from 0% volume color', () => {
      const noTarget = getNoTargetColor();
      const zeroVolume = getVolumeColor(0);

      expect(noTarget).not.toBe(zeroVolume);

      // Parse and compare
      const ntParsed = parseOklch(noTarget);
      const zvParsed = parseOklch(zeroVolume);

      // No-target should have lower chroma (more gray)
      expect(ntParsed.C).toBeLessThan(zvParsed.C);
    });

    it('should return valid oklch format', () => {
      const color = getNoTargetColor();

      expect(color).toMatch(/^oklch\([0-9.]+\s+[0-9.]+\s+[0-9.]+\)$/);
    });
  });
});
