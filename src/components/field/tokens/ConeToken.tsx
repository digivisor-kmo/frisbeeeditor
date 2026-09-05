import { memo } from 'react'
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
 * A training cone, seen from where you stand next to it: a body with a rounded
 * apex sitting on an elliptical base, with its own shadow on the grass.
 *
 * A triangle, not a cross. The brick marks on the field are already crosses, so
 * a cross-shaped cone standing next to one is unreadable.
 */
function ConeTokenBasis({ cone, view, radiusM, hitRadiusM, selected }: Props) {
  const { x, y } = toSvg(cone.pos, view)
  const r = metresToUnits(radiusM) * 0.78
  const hit = metresToUnits(hitRadiusM)
  const lijn = Math.max(r * 0.17, 0.5)

  const top = y - r * 0.92
  const voet = y + r * 0.62
  const halfBreed = r * 0.8
  const basisRy = r * 0.26

  // The two flanks bow out very slightly, the way a moulded cone does.
  const lichaam = [
    `M ${x - halfBreed} ${voet}`,
    `Q ${x - halfBreed * 0.62} ${(top + voet) / 2} ${x - r * 0.16} ${top + r * 0.1}`,
    `Q ${x} ${top - r * 0.06} ${x + r * 0.16} ${top + r * 0.1}`,
    `Q ${x + halfBreed * 0.62} ${(top + voet) / 2} ${x + halfBreed} ${voet}`,
    'Z',
  ].join(' ')

  return (
    <g data-entity-id={cone.id} style={{ cursor: 'grab' }}>
      <ellipse
        cx={x}
        cy={voet + basisRy * 0.5}
        rx={halfBreed * 1.24}
        ry={basisRy * 0.86}
        fill="var(--token-donker)"
        opacity={0.16}
        pointerEvents="none"
      />

      {selected && (
        <circle
          cx={x}
          cy={y}
          r={r * 1.55}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={lijn * 0.9}
          pointerEvents="none"
        />
      )}

      {/* The base plate, drawn first so the body sits on it. */}
      <ellipse
        cx={x}
        cy={voet}
        rx={halfBreed * 1.16}
        ry={basisRy}
        fill={coneFill(cone.color)}
        stroke="var(--token-donker)"
        strokeWidth={lijn * 0.8}
        pointerEvents="none"
      />

      <path
        d={lichaam}
        fill={coneFill(cone.color)}
        stroke="var(--token-donker)"
        strokeWidth={lijn * 0.8}
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* The band every training cone carries around its middle. */}
      <path
        d={`M ${x - halfBreed * 0.62} ${voet - r * 0.42} Q ${x} ${voet - r * 0.3} ${x + halfBreed * 0.62} ${voet - r * 0.42}`}
        fill="none"
        stroke="var(--token-donker)"
        strokeWidth={lijn * 0.55}
        opacity={0.35}
        pointerEvents="none"
      />

      <circle cx={x} cy={y} r={hit} fill="transparent" />
    </g>
  )
}

/**
 * Memoised on purpose.
 *
 * Immer gives the document structural sharing, so during a drag only the entity
 * that moved gets a new identity. Without this wrapper React redrew every token,
 * every arrow and every thumbnail on every single pointer move; with it, it
 * redraws the one that changed.
 */
export const ConeToken = memo(ConeTokenBasis)
