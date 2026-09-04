import { tokenText } from '@/lib/diagram/entities'
import type { Player, Tokenstijl } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'
import { tokenFontSizeM } from '@/lib/field/scale'
import { paintFor } from './colors'

interface Props {
  player: Player
  view: FieldView
  radiusM: number
  hitRadiusM: number
  stijl: Tokenstijl
  selected: boolean
}

export function PlayerToken({ player, view, radiusM, hitRadiusM, stijl, selected }: Props) {
  const { x, y } = toSvg(player.pos, view)
  const r = metresToUnits(radiusM)
  const hit = metresToUnits(hitRadiusM)
  const paint = paintFor(player.color, player.side)
  const label = tokenText(player, stijl)
  const ring = r * 0.14

  // Defence gets a second ring on top of its colour. Colour stays the primary
  // signal; the ring is what carries the difference on a black and white print
  // and for anyone who cannot separate the two hues.
  const isDefense = player.side === 'defense'

  return (
    <g data-entity-id={player.id} style={{ cursor: 'grab' }}>
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={r + ring * 2.4}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={ring * 1.2}
          pointerEvents="none"
        />
      )}

      <circle
        cx={x}
        cy={y}
        r={r}
        fill={paint.fill}
        stroke="var(--field-line)"
        strokeWidth={ring}
        pointerEvents="none"
      />

      {isDefense && (
        <circle
          cx={x}
          cy={y}
          r={r - ring * 1.8}
          fill="none"
          stroke="var(--field-line)"
          strokeWidth={ring}
          pointerEvents="none"
        />
      )}

      {label && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={paint.text}
          fontSize={metresToUnits(tokenFontSizeM(radiusM))}
          fontWeight={700}
          pointerEvents="none"
        >
          {label}
        </text>
      )}

      {player.hasDisc && (
        <ellipse
          cx={x + r * 0.95}
          cy={y - r * 0.95}
          rx={r * 0.5}
          ry={r * 0.34}
          fill="var(--token-wit)"
          stroke="var(--token-donker)"
          strokeWidth={ring * 0.9}
          pointerEvents="none"
        />
      )}

      <circle cx={x} cy={y} r={hit} fill="transparent" />
    </g>
  )
}
