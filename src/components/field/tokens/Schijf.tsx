interface Props {
  /** Centre, in SVG units. */
  x: number
  y: number
  /** Radius the disc is drawn to, in SVG units. */
  r: number
  /**
   * A white ring behind it, for when the disc sits on top of a token: without
   * it a white disc on a white token disappears.
   */
  halo?: boolean
}

/**
 * The disc, seen the way it lies in a hand: an ellipse with a rim.
 *
 * One component for both the disc a player is holding and the disc in flight,
 * so the thing that leaves a hand is visibly the same thing that arrives in
 * another. Two separate drawings would drift apart the first time either is
 * touched.
 */
export function Schijf({ x, y, r, halo = false }: Props) {
  const rx = r * 0.62
  const ry = r * 0.42
  const lijn = Math.max(r * 0.11, 0.6)

  return (
    <g pointerEvents="none">
      {halo && (
        <ellipse
          cx={x}
          cy={y}
          rx={rx + lijn * 2.1}
          ry={ry + lijn * 2.1}
          fill="var(--field-line)"
        />
      )}

      {/* The underside, just visible below the rim. It is what makes this read
          as an object lying at an angle rather than a white oval. */}
      <ellipse cx={x} cy={y + ry * 0.22} rx={rx} ry={ry} fill="var(--token-donker)" opacity={0.22} />

      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill="var(--token-wit)"
        stroke="var(--token-donker)"
        strokeWidth={lijn}
      />

      {/* The inner rim of a disc, the line every frisbee has. */}
      <ellipse
        cx={x}
        cy={y}
        rx={rx * 0.54}
        ry={ry * 0.48}
        fill="none"
        stroke="var(--token-donker)"
        strokeWidth={lijn * 0.6}
        opacity={0.5}
      />
    </g>
  )
}
