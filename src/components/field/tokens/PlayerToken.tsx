import { memo } from 'react'
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

function PlayerTokenBasis({ player, view, radiusM, hitRadiusM, stijl, selected }: Props) {
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
      {/*
        No drop shadow. A field is seen from above, so a shadow under a marker
        implies a light source that is not there, and at this size it peeks out
        all around and reads as a dirty edge. What the token needs instead is a
        crisp boundary: the white rim below, and this hairline outside it that
        holds the shape against the green.
      */}
      <circle
        cx={x}
        cy={y}
        r={r + ring * 0.5}
        fill="none"
        stroke="var(--token-donker)"
        strokeWidth={ring * 0.5}
        opacity={0.28}
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

            {/* Resting on his shoulder, overlapping the rim, rather than floating off
          the corner: it belongs to this player and has to look like it. */}
      {player.hasDisc && <Schijf x={x + r * 0.74} y={y - r * 0.72} r={r * 1.02} rand />}

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
export const PlayerToken = memo(PlayerTokenBasis)
