import {
  BRICK_MARKS_M,
  FIELD_M,
  GOAL_LINES_M,
  metresToUnits,
  toSvg,
  type FieldView,
} from '@/lib/field/geometry'

/** Half-length of a brick mark arm, in metres. */
const BRICK_ARM_M = 0.5
/** Line width on the field, in metres, so it scales with the field rather than the screen. */
const LINE_WIDTH_M = 0.12

interface Props {
  view: FieldView
}

/**
 * The static field: grass, perimeter, goal lines and brick marks.
 * Draws nothing that belongs to a diagram, so it can be memoised.
 */
export function FieldSurface({ view }: Props) {
  const { area } = view
  const corners = [
    toSvg({ x: area.minX, y: area.minY }, view),
    toSvg({ x: area.maxX, y: area.maxY }, view),
  ]
  const x = Math.min(corners[0]!.x, corners[1]!.x)
  const y = Math.min(corners[0]!.y, corners[1]!.y)
  const width = Math.abs(corners[1]!.x - corners[0]!.x)
  const height = Math.abs(corners[1]!.y - corners[0]!.y)
  const stroke = metresToUnits(LINE_WIDTH_M)

  const goalLines = GOAL_LINES_M.filter((at) => at > area.minX && at < area.maxX)

  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={width} height={height} fill="var(--field)" />

      {view.showLines && (
        <g fill="none" stroke="var(--field-line)" strokeWidth={stroke} strokeLinecap="square">
          <rect x={x} y={y} width={width} height={height} />

          {goalLines.map((at) => {
            const a = toSvg({ x: at, y: area.minY }, view)
            const b = toSvg({ x: at, y: area.maxY }, view)
            return <line key={at} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          })}

          {BRICK_MARKS_M.filter((m) => m.x > area.minX && m.x < area.maxX).map((mark) => {
            const h1 = toSvg({ x: mark.x - BRICK_ARM_M, y: mark.y }, view)
            const h2 = toSvg({ x: mark.x + BRICK_ARM_M, y: mark.y }, view)
            const v1 = toSvg({ x: mark.x, y: mark.y - BRICK_ARM_M }, view)
            const v2 = toSvg({ x: mark.x, y: mark.y + BRICK_ARM_M }, view)
            return (
              <g key={`${mark.x}-${mark.y}`}>
                <line x1={h1.x} y1={h1.y} x2={h2.x} y2={h2.y} />
                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} />
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
}

export { FIELD_M }
