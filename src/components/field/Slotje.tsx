interface Props {
  /** Centre of the shackle, in SVG units. */
  x: number
  y: number
  maat: number
  kleur: string
  /** Blink once, because a tap just deliberately did nothing. */
  wijst?: boolean
}

/**
 * The padlock on a pinned zone or note.
 *
 * Always drawn, not only while the thing is selected: without it, something
 * that refuses to move looks broken rather than locked. It blinks once when you
 * tap it, which is the only way a tap that does nothing can say why.
 */
export function Slotje({ x, y, maat, kleur, wijst = false }: Props) {
  const b = maat * 0.78
  return (
    <g
      pointerEvents="none"
      opacity={0.85}
      className={wijst ? 'slotje slotje--wijst' : 'slotje'}
    >
      <path
        d={`M ${x - b / 2 + b * 0.22} ${y} v ${-maat * 0.24} a ${b * 0.28} ${b * 0.28} 0 0 1 ${b * 0.56} 0 v ${maat * 0.24}`}
        fill="none"
        stroke={kleur}
        strokeWidth={maat * 0.14}
        strokeLinecap="round"
      />
      <rect x={x - b / 2} y={y} width={b} height={maat * 0.52} rx={maat * 0.12} fill={kleur} />
    </g>
  )
}
