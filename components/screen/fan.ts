// Fan layout shared by the WebGL and CSS carousels: panels sit on a wheel whose
// pivot is below the screen, so neighbours tilt away and drop like a hand of cards.

export const FAN_STEP = 0.3; // radians between neighbours
export const FAN_RADIUS = 3.4; // in panel widths
export const FAN_VISIBLE = 2.6; // neighbours drawn either side

export interface FanPose {
  /** horizontal offset, in panel widths */
  x: number;
  /** downward drop, in panel widths */
  y: number;
  /** tilt, radians (positive = clockwise) */
  angle: number;
  /** 0 at centre, 1 per neighbour away */
  dist: number;
}

export function fanPose(offset: number): FanPose {
  const angle = offset * FAN_STEP;
  return {
    x: Math.sin(angle) * FAN_RADIUS,
    y: (1 - Math.cos(angle)) * FAN_RADIUS,
    angle,
    dist: Math.abs(offset),
  };
}

export function wrapIndex(i: number, count: number) {
  return ((i % count) + count) % count;
}
