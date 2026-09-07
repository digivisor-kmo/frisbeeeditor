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
 * The whole shape can be tapped, fill included — hunting for a two-pixel dashed
 * edge is not something anybody should have to do with a wet finger. What that
 * costs is the selection box: a zone lying over the stack would swallow a drag
 * meant for the players inside it. That is what the lock is for. A locked zone
 * still answers a tap, but a drag goes straight through it to the pitch.
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
        {/* The grab area: the shape itself, plus a band around its edge so the
            outline is still catchable from just outside. */}
        <ellipse
          data-part="vlak"
          cx={x + breedte / 2}
          cy={y + hoogte / 2}
          rx={breedte / 2}
          ry={hoogte / 2}
          fill="transparent"
          stroke="transparent"
          strokeWidth={hit}
        />
      </>
    ) : (
      <>
        <rect x={x} y={y} width={breedte} height={hoogte} {...gemeen} pointerEvents="none" />
        <rect
          data-part="vlak"
          x={x}
          y={y}
          width={breedte}
          height={hoogte}
          fill="transparent"
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

      {zone.vergrendeld && (
        <Slotje
          x={x + breedte - labelHoogte * 0.9}
          y={y + labelHoogte * 0.5}
          maat={labelHoogte * 0.85}
          kleur={verf}
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

/**
 * The little padlock in the corner of a pinned zone.
 *
 * Always drawn, not only while it is selected: without it, a zone that refuses
 * to move looks broken rather than locked.
 */
function Slotje({ x, y, maat, kleur }: { x: number; y: number; maat: number; kleur: string }) {
  const b = maat * 0.78
  return (
    <g pointerEvents="none" opacity={0.85}>
      <path
        d={`M ${x - b / 2 + b * 0.22} ${y} v ${-maat * 0.24} a ${b * 0.28} ${b * 0.28} 0 0 1 ${b * 0.56} 0 v ${maat * 0.24}`}
        fill="none"
        stroke={kleur}
        strokeWidth={maat * 0.14}
        strokeLinecap="round"
      />
      <rect
        x={x - b / 2}
        y={y}
        width={b}
        height={maat * 0.52}
        rx={maat * 0.12}
        fill={kleur}
      />
    </g>
  )
}

export const ZoneShape = memo(ZoneShapeBasis)
