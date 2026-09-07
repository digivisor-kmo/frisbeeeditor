import { memo } from 'react'
import { coneFill } from './tokens/colors'
import { zoneKader } from '@/lib/diagram/zones'
import type { Annotation } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  zone: Annotation
  view: FieldView
  selected: boolean
  /** Roughly a fingertip, in metres, for the invisible grab areas. */
  hitRadiusM: number
}

/**
 * A region of the pitch: a dashed outline with a wash of colour inside.
 *
 * Only the outline and the label can be grabbed, not the fill. A zone is often
 * twenty metres across, and one that swallows every click inside it would make
 * it impossible to drag a selection box over the players standing in it — which
 * is precisely what you do with a zone drawn on the field.
 */
function ZoneShapeBasis({ zone, view, selected, hitRadiusM }: Props) {
  const kader = zoneKader(zone)
  const a = toSvg({ x: kader.minX, y: kader.minY }, view)
  const b = toSvg({ x: kader.maxX, y: kader.maxY }, view)
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const breedte = Math.abs(b.x - a.x)
  const hoogte = Math.abs(b.y - a.y)

  const verf = coneFill(zone.style.stroke)
  const dikte = metresToUnits(zone.style.width)
  const streep = `${dikte * 3.2} ${dikte * 2.4}`
  const hit = Math.max(metresToUnits(hitRadiusM * 0.8), dikte * 3)

  const gemeen = {
    fill: verf,
    fillOpacity: zone.style.opacity,
    stroke: verf,
    strokeWidth: dikte,
    strokeDasharray: zone.style.dash === false ? undefined : streep,
    strokeLinecap: 'round' as const,
  }

  const vorm =
    zone.shape === 'ellipse' ? (
      <>
        <ellipse
          cx={x + breedte / 2}
          cy={y + hoogte / 2}
          rx={breedte / 2}
          ry={hoogte / 2}
          {...gemeen}
          pointerEvents="none"
        />
        <ellipse
          data-part="rand"
          cx={x + breedte / 2}
          cy={y + hoogte / 2}
          rx={breedte / 2}
          ry={hoogte / 2}
          fill="none"
          stroke="transparent"
          strokeWidth={hit}
        />
      </>
    ) : (
      <>
        <rect x={x} y={y} width={breedte} height={hoogte} {...gemeen} pointerEvents="none" />
        <rect
          data-part="rand"
          x={x}
          y={y}
          width={breedte}
          height={hoogte}
          fill="none"
          stroke="transparent"
          strokeWidth={hit}
        />
      </>
    )

  const labelHoogte = metresToUnits(1.6)

  return (
    <g data-entity-id={zone.id}>
      {vorm}

      {selected && (
        <rect
          x={x - dikte * 2}
          y={y - dikte * 2}
          width={breedte + dikte * 4}
          height={hoogte + dikte * 4}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={dikte * 0.9}
          pointerEvents="none"
        />
      )}

      {zone.label && (
        <text
          data-part="label"
          x={x + breedte / 2}
          y={y + labelHoogte * 1.15}
          textAnchor="middle"
          fontSize={labelHoogte}
          fontWeight={700}
          fill={verf}
          stroke="var(--zone-halo)"
          strokeWidth={labelHoogte * 0.18}
          paintOrder="stroke"
          style={{ letterSpacing: '0.01em' }}
        >
          {zone.label}
        </text>
      )}
    </g>
  )
}

export const ZoneShape = memo(ZoneShapeBasis)
