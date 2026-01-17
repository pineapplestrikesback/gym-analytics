/**
 * MuscleHeatmap Component
 * Responsive wrapper that selects desktop or mobile variant
 */

import { useResponsiveVariant } from '@ui/hooks/useResponsiveVariant';
import { DesktopHeatmap } from './MuscleHeatmap.desktop';
import { MobileHeatmap } from './MuscleHeatmap.mobile';
import type { MuscleHeatmapProps } from './MuscleHeatmap.base';

export function MuscleHeatmap(props: MuscleHeatmapProps): React.ReactElement {
  const { isDesktop } = useResponsiveVariant();

  return isDesktop ? <DesktopHeatmap {...props} /> : <MobileHeatmap {...props} />;
}

// Re-export types for convenience
export type { MuscleHeatmapProps, RegionStats, BodyRegion } from './MuscleHeatmap.base';
