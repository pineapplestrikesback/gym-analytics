/**
 * Color Scale Utility for Volume Visualization
 *
 * Provides perceptually uniform color mapping using Oklab/oklch color space.
 * This is the single source of truth for volume-to-color conversions throughout
 * the application.
 *
 * Color progression:
 *   0% (Purple) -> 25% (Blue) -> 50% (Teal) -> 75% (Yellow-Green)
 *   -> 100% (Green/Goal) -> 110% (Yellow) -> 150% (Red/Warning)
 */

/**
 * Color stop in oklch format for gradient interpolation
 */
interface ColorStop {
  position: number; // percentage (0-150)
  L: number; // Lightness (0-1)
  C: number; // Chroma (saturation)
  H: number; // Hue angle (degrees)
}

/**
 * Color stops defining the volume gradient
 * Carefully tuned for perceptual uniformity on dark backgrounds
 */
const COLOR_STOPS: ColorStop[] = [
  { position: 0, L: 0.45, C: 0.12, H: 290 }, // Muted purple (cold, low volume)
  { position: 25, L: 0.55, C: 0.15, H: 250 }, // Blue
  { position: 50, L: 0.6, C: 0.14, H: 200 }, // Teal
  { position: 75, L: 0.65, C: 0.16, H: 160 }, // Yellow-green
  { position: 100, L: 0.72, C: 0.19, H: 142 }, // Green (goal achieved!)
  { position: 110, L: 0.75, C: 0.18, H: 85 }, // Yellow (slight over)
  { position: 150, L: 0.55, C: 0.22, H: 29 }, // Red (warning, caps here)
];

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two oklch color stops
 */
function interpolateOklch(
  stop1: ColorStop,
  stop2: ColorStop,
  t: number
): { L: number; C: number; H: number } {
  // Handle hue interpolation (shortest path around the color wheel)
  let hDiff = stop2.H - stop1.H;
  if (hDiff > 180) hDiff -= 360;
  if (hDiff < -180) hDiff += 360;

  return {
    L: lerp(stop1.L, stop2.L, t),
    C: lerp(stop1.C, stop2.C, t),
    H: (stop1.H + hDiff * t + 360) % 360,
  };
}

/**
 * Find the color at a given position in the gradient
 */
function getColorAtPosition(position: number): { L: number; C: number; H: number } {
  // Find surrounding stops
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const stop1 = COLOR_STOPS[i];
    const stop2 = COLOR_STOPS[i + 1];

    if (position >= stop1.position && position <= stop2.position) {
      const t = (position - stop1.position) / (stop2.position - stop1.position);
      return interpolateOklch(stop1, stop2, t);
    }
  }

  // Should not reach here due to clamping, but return last stop if needed
  const lastStop = COLOR_STOPS[COLOR_STOPS.length - 1];
  return { L: lastStop.L, C: lastStop.C, H: lastStop.H };
}

/**
 * Convert a volume percentage to a CSS oklch() color string.
 *
 * Uses perceptually uniform Oklab interpolation for smooth gradients.
 * The color scale progresses from cool (purple/blue) for low volume
 * through warm (green) at goal to warning (yellow/red) for over-target.
 *
 * @param percentage - Volume percentage (0-150+, will be clamped)
 * @returns CSS oklch() color string (e.g., "oklch(0.72 0.19 142)")
 *
 * @example
 * getVolumeColor(0)    // Purple - cold, no volume
 * getVolumeColor(50)   // Teal - halfway to goal
 * getVolumeColor(100)  // Green - goal achieved
 * getVolumeColor(150)  // Red - significantly over target
 */
export function getVolumeColor(percentage: number): string {
  // Clamp to valid range (0-150)
  const clamped = Math.max(0, Math.min(150, percentage));

  const { L, C, H } = getColorAtPosition(clamped);

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

/**
 * Get opacity value based on volume percentage.
 *
 * Lower volume muscles are more transparent, making them visually recede.
 * Higher volume muscles are more opaque, drawing attention.
 *
 * @param percentage - Volume percentage (0-100+)
 * @returns Opacity value between 0.4 (low volume) and 1.0 (100%+)
 *
 * @example
 * getVolumeOpacity(0)    // 0.4 - very transparent
 * getVolumeOpacity(50)   // 0.7 - medium opacity
 * getVolumeOpacity(100)  // 1.0 - fully opaque
 */
export function getVolumeOpacity(percentage: number): number {
  // Clamp percentage to 0-100 for opacity calculation
  const clamped = Math.max(0, Math.min(100, percentage));

  // Linear interpolation from 0.4 (at 0%) to 1.0 (at 100%)
  return 0.4 + (clamped / 100) * 0.6;
}

/**
 * Get the color for muscles with no target defined.
 *
 * Returns a distinct gray that differs from the 0% volume color,
 * allowing users to distinguish "no target set" from "has target but no progress".
 *
 * @returns CSS oklch() color string for no-target state
 *
 * @example
 * // Use for muscles where goal === 0 or undefined
 * const color = goal > 0 ? getVolumeColor(percentage) : getNoTargetColor();
 */
export function getNoTargetColor(): string {
  // Slightly different gray with minimal chroma and cooler hue
  // than the 0% volume purple to create visual distinction
  return 'oklch(0.35 0.02 270)';
}
