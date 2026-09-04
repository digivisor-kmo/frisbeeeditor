import { tokenText } from '@/lib/diagram/entities'
import type { Player, Tokenstijl } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'
import { tokenFontSizeM } from '@/lib/field/scale'
import { paintFor } from './colors'
import { Schijf } from './Schijf'

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
      {/* A player stands on the grass, he is not printed into it. One soft
          ellipse underneath is the whole difference. */}
      <ellipse
        cx={x}
        cy={y + r * 0.34}
        rx={r * 0.94}
        ry={r * 0.8}
        fill="var(--token-donker)"
        opacity={0.16}
        pointerEvents="none"
      />

      {selected && (
        <>
          {/* A white gap under the accent ring, so the selection reads on a
              black token and on a white one. */}
          <circle
            cx={x}
            cy={y}
            r={r + ring * 2.4}
            fill="none"
            stroke="var(--field-line)"
            strokeWidth={ring * 2.6}
            pointerEvents="none"
          />
          <circle
            cx={x}
            cy={y}
            r={r + ring * 2.4}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={ring * 1.3}
            pointerEvents="none"
          />
        </>
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
          r={r - ring * 1.9}
          fill="none"
          stroke="var(--field-line)"
          strokeWidth={ring * 0.85}
          opacity={0.9}
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
          fontSize={metresToUnits(tokenFontSizeM(radiusM, label.length))}
          fontWeight={700}
          letterSpacing={label.length > 1 ? -metresToUnits(radiusM * 0.06) : 0}
          pointerEvents="none"
        >
          {label}
        </text>
      )}

      {player.hasDisc && <Schijf x={x + r * 0.92} y={y - r * 0.88} r={r * 0.86} halo />}

      <circle cx={x} cy={y} r={hit} fill="transparent" />
    </g>
  )
}
