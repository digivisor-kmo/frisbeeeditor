import type { Cone } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'
import { coneFill } from './colors'

interface Props {
  cone: Cone
  view: FieldView
  radiusM: number
  hitRadiusM: number
  selected: boolean
}

/**
 * A triangle, not a cross. The brick marks on the field are already crosses, so
 * a cross-shaped cone standing next to one is unreadable.
 */
export function ConeToken({ cone, view, radiusM, hitRadiusM, selected }: Props) {
  const { x, y } = toSvg(cone.pos, view)
  const r = metresToUnits(radiusM) * 0.72
  const hit = metresToUnits(hitRadiusM)
  const stroke = r * 0.2

  const points = [
    [x, y - r],
    [x + r * 0.85, y + r * 0.65],
    [x - r * 0.85, y + r * 0.65],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ')

  return (
    <g data-entity-id={cone.id} style={{ cursor: 'grab' }}>
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={r * 1.7}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          pointerEvents="none"
        />
      )}
      <polygon
        points={points}
        fill={coneFill(cone.color)}
        stroke="var(--token-donker)"
        strokeWidth={stroke}
        strokeLinejoin="round"
        pointerEvents="none"
      />
      <circle cx={x} cy={y} r={hit} fill="transparent" />
    </g>
  )
}
