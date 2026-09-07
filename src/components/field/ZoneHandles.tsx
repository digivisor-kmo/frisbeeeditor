import { zoneKader } from '@/lib/diagram/zones'
import type { Annotation } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  zone: Annotation
  view: FieldView
  hitRadiusM: number
  tokenRadiusM: number
}

/**
 * The four corners of a selected zone.
 *
 * Four rather than the two that are stored: whichever one you grab, the one
 * across from it stays put, which is the only behaviour that does not feel like
 * the shape is fighting you. Which two end up in the data afterwards is an
 * implementation detail nobody should have to think about.
 */
export function ZoneHandles({ zone, view, hitRadiusM, tokenRadiusM }: Props) {
  const k = zoneKader(zone)
  const hoeken = [
    { x: k.minX, y: k.minY },
    { x: k.maxX, y: k.minY },
    { x: k.maxX, y: k.maxY },
    { x: k.minX, y: k.maxY },
  ]
  const r = metresToUnits(tokenRadiusM * 0.4)
  const hit = metresToUnits(hitRadiusM)

  return (
    <g data-entity-id={zone.id}>
      {hoeken.map((hoek, index) => {
        const p = toSvg(hoek, view)
        return (
          <g key={index} data-part={`hoek-${index}`}>
            <circle cx={p.x} cy={p.y} r={hit} fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill="var(--token-wit)"
              stroke="var(--accent)"
              strokeWidth={metresToUnits(tokenRadiusM * 0.13)}
              pointerEvents="none"
            />
          </g>
        )
      })}
    </g>
  )
}
