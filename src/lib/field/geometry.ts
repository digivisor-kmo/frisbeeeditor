/**
 * Field geometry for a WFDF outdoor ultimate field.
 *
 * Every position in the application is stored in METRES, with the origin at the
 * bottom-left corner of the full field, x running along the length and y across
 * the width. Nothing stores pixels or SVG units.
 *
 * Rendering uses a fixed scale of 10 SVG units per metre, so the field itself
 * always occupies exactly 1000 x 370 SVG units. The viewBox is larger than that
 * on purpose: entities may sit just outside the sideline or behind the goal line
 * and must stay visible and tappable.
 */

export const UNITS_PER_METRE = 10

/** All distances in metres. Source: WFDF Rules of Ultimate, Appendix A1. */
export const FIELD_M = {
  length: 100,
  width: 37,
  endzoneDepth: 18,
  /** Brick mark distance from its own goal line, on the longitudinal centre line. */
  brickFromGoalLine: 18,
} as const

/** Central playing zone between the two goal lines: 64 m. */
export const CENTRAL_ZONE_M = FIELD_M.length - 2 * FIELD_M.endzoneDepth

/** Half-field view: one endzone plus 32 m of the central zone. */
export const HALF_VIEW_LENGTH_M = FIELD_M.endzoneDepth + 32

/** Functional margin around the visible slice, so entities outside the lines stay reachable. */
export const MARGIN_M = 3

export type ViewKind = 'volledig' | 'half' | 'vrij'

export interface Point {
  x: number
  y: number
}

export interface Rect {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface FieldView {
  kind: ViewKind
  /** The slice of the field that is shown, in metres. */
  area: Rect
  /**
   * True for the half-field view, which is rendered portrait: the field is
   * rotated 90 degrees clockwise so the length axis runs down the screen. On a
   * phone held upright that is the only usable orientation for an endzone set.
   */
  rotated: boolean
  showLines: boolean
  /** viewBox attribute for the SVG root, including the margin. */
  viewBox: string
  /** Top-left corner of the viewBox, in SVG units. */
  origin: Point
  /** Size of the viewBox in SVG units. */
  width: number
  height: number
}

export function createView(kind: ViewKind): FieldView {
  const area: Rect =
    kind === 'half'
      ? { minX: 0, minY: 0, maxX: HALF_VIEW_LENGTH_M, maxY: FIELD_M.width }
      : { minX: 0, minY: 0, maxX: FIELD_M.length, maxY: FIELD_M.width }

  const rotated = kind === 'half'
  const alongX = area.maxX - area.minX
  const alongY = area.maxY - area.minY

  const widthM = (rotated ? alongY : alongX) + 2 * MARGIN_M
  const heightM = (rotated ? alongX : alongY) + 2 * MARGIN_M

  const width = widthM * UNITS_PER_METRE
  const height = heightM * UNITS_PER_METRE
  const origin = -MARGIN_M * UNITS_PER_METRE

  return {
    kind,
    area,
    rotated,
    showLines: kind !== 'vrij',
    viewBox: `${origin} ${origin} ${width} ${height}`,
    origin: { x: origin, y: origin },
    width,
    height,
  }
}

/** Field metres -> SVG units. */
export function toSvg(p: Point, view: FieldView): Point {
  if (view.rotated) {
    return {
      x: (p.y - view.area.minY) * UNITS_PER_METRE,
      y: (p.x - view.area.minX) * UNITS_PER_METRE,
    }
  }
  return {
    x: (p.x - view.area.minX) * UNITS_PER_METRE,
    y: (view.area.maxY - p.y) * UNITS_PER_METRE,
  }
}

/** SVG units -> field metres. Exact inverse of toSvg. */
export function toField(p: Point, view: FieldView): Point {
  if (view.rotated) {
    return {
      x: p.y / UNITS_PER_METRE + view.area.minX,
      y: p.x / UNITS_PER_METRE + view.area.minY,
    }
  }
  return {
    x: p.x / UNITS_PER_METRE + view.area.minX,
    y: view.area.maxY - p.y / UNITS_PER_METRE,
  }
}

/**
 * Where a field position lands inside the rendered element, in CSS pixels
 * relative to its top-left corner. Used to anchor HTML overlays -- the context
 * menu -- to an entity on the field.
 */
export function toScreenPx(p: Point, view: FieldView, metresPerPixel: number): Point {
  const svg = toSvg(p, view)
  const pxPerUnit = 1 / (UNITS_PER_METRE * metresPerPixel)
  return {
    x: (svg.x - view.origin.x) * pxPerUnit,
    y: (svg.y - view.origin.y) * pxPerUnit,
  }
}

/** Convert a length (not a position) from metres to SVG units. */
export function metresToUnits(metres: number): number {
  return metres * UNITS_PER_METRE
}

export const GRID_STEP_M = 0.5

export function snapToGrid(p: Point, step: number = GRID_STEP_M): Point {
  return {
    x: Math.round(p.x / step) * step,
    y: Math.round(p.y / step) * step,
  }
}

/** Goal line positions along the length axis, in metres. */
export const GOAL_LINES_M = [FIELD_M.endzoneDepth, FIELD_M.length - FIELD_M.endzoneDepth] as const

/** Brick marks, in field metres. */
export const BRICK_MARKS_M: readonly Point[] = [
  { x: FIELD_M.endzoneDepth + FIELD_M.brickFromGoalLine, y: FIELD_M.width / 2 },
  { x: FIELD_M.length - FIELD_M.endzoneDepth - FIELD_M.brickFromGoalLine, y: FIELD_M.width / 2 },
]
