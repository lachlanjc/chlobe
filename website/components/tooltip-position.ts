import type { CSSProperties } from 'react';

const TOOLTIP_WIDTH = 220;

const getTooltipPosition = (x: number, y: number): CSSProperties => ({
  boxSizing: 'border-box',
  left: 0,
  overflowWrap: 'anywhere',
  position: 'absolute',
  top: 0,
  transform: `translate(clamp(0px, ${x - TOOLTIP_WIDTH / 2}px, calc(100cqw - ${TOOLTIP_WIDTH}px)), calc(${y}px - 100% - 12px))`,
  whiteSpace: 'normal',
  width: `min(${TOOLTIP_WIDTH}px, 100%)`,
});

export { getTooltipPosition };
