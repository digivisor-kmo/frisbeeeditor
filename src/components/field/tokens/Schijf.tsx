interface Props {
  /** Centre, in SVG units. */
  x: number
  y: number
  /** Radius the disc is drawn to, in SVG units. */
  r: number
  /**
   * A white edge around it, for when the disc sits on top of a token: without
   * it a white disc on a white token disappears, and on a black one it looks
   * like a hole.
   */
  rand?: boolean
}

/**
 * The disc, seen the way it lies in a hand: an ellipse with a rim.
 *
 * One component for both the disc a player is holding and the disc in flight,
 * so the thing that leaves a hand is visibly the same thing that arrives in
 * another. Two separate drawings would drift apart the first time either is
 * touched.
 *
 * Deliberately only three shapes. On a token the whole disc is about a dozen
 * pixels across, and anything more detailed turns into a smudge at that size.
 */
export function Schijf({ x, y, r, rand = false }: Props) {
  const rx = r * 0.66
  const ry = r * 0.45
  const lijn = Math.max(r * 0.13, 0.7)

  return (
    <g pointerEvents="none">
      {rand && (
        <ellipse
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          fill="var(--token-wit)"
          stroke="var(--field-line)"
          strokeWidth={lijn * 2.6}
        />
      )}

      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill="var(--token-wit)"
        stroke="var(--token-donker)"
        strokeWidth={lijn}
      />

      {/* The inner rim, the line every frisbee has. It is what makes this an
          object rather than a white oval. */}
      <ellipse
        cx={x}
        cy={y}
        rx={rx * 0.46}
        ry={ry * 0.4}
        fill="none"
        stroke="var(--token-donker)"
        strokeWidth={lijn * 0.7}
        opacity={0.55}
      />
    </g>
  )
}
