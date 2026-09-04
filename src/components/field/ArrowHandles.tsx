import { midpoint } from '@/lib/diagram/curve'
import { arrowBend, arrowEnd } from '@/lib/diagram/arrows'
import type { Arrow } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  arrow: Arrow
  view: FieldView
  tokenRadiusM: number
  hitRadiusM: number
}

/**
 * Handles for a selected arrow.
 *
 * A big filled handle is a bend point that lies on the curve. A small grey one
 * sits at the middle of a straight arrow and is an invitation: drag it and it
 * becomes a real bend. In phase one an arrow carries at most one bend.
 */
export function ArrowHandles({ arrow, view, tokenRadiusM, hitRadiusM }: Props) {
  const hit = metresToUnits(hitRadiusM)
  const groot = metresToUnits(tokenRadiusM * 0.5)
  const klein = metresToUnits(tokenRadiusM * 0.32)
  const lijn = metresToUnits(tokenRadiusM * 0.13)

  const bend = arrowBend(arrow)
  const eind = toSvg(arrowEnd(arrow), view)

  return (
    <g data-entity-id={arrow.id}>
      <circle
        cx={eind.x}
        cy={eind.y}
        r={groot * 0.8}
        fill="var(--accent)"
        stroke="var(--token-wit)"
        strokeWidth={lijn}
        pointerEvents="none"
      />

      {bend ? (
        <BendHandle
          punt={toSvg(bend, view)}
          straal={groot}
          hit={hit}
          lijn={lijn}
        />
      ) : (
        <g data-part="hint">
          <circle
            cx={midpoint(arrow.path.points.map((p) => toSvg(p, view))).x}
            cy={midpoint(arrow.path.points.map((p) => toSvg(p, view))).y}
            r={klein}
            fill="var(--token-wit)"
            stroke="var(--handle)"
            strokeWidth={lijn * 0.8}
            opacity={0.75}
            pointerEvents="none"
          />
          <circle
            cx={midpoint(arrow.path.points.map((p) => toSvg(p, view))).x}
            cy={midpoint(arrow.path.points.map((p) => toSvg(p, view))).y}
            r={hit * 0.7}
            fill="transparent"
          />
        </g>
      )}
    </g>
  )
}

function BendHandle({
  punt,
  straal,
  hit,
  lijn,
}: {
  punt: { x: number; y: number }
  straal: number
  hit: number
  lijn: number
}) {
  const kruisX = punt.x + straal * 2.1
  const kruisY = punt.y - straal * 2.1
  const arm = straal * 0.62

  return (
    <g>
      <g data-part="bend">
        <circle
          cx={punt.x}
          cy={punt.y}
          r={straal}
          fill="var(--handle)"
          stroke="var(--token-wit)"
          strokeWidth={lijn}
          pointerEvents="none"
        />
        <circle cx={punt.x} cy={punt.y} r={hit * 0.7} fill="transparent" />
      </g>

      {/* Removing one bend without undoing everything you did after it. */}
      <g data-part="bendDelete" style={{ cursor: 'pointer' }}>
        <circle
          cx={kruisX}
          cy={kruisY}
          r={straal * 0.78}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={lijn * 0.8}
          pointerEvents="none"
        />
        <path
          d={`M ${kruisX - arm} ${kruisY - arm} L ${kruisX + arm} ${kruisY + arm} M ${kruisX + arm} ${kruisY - arm} L ${kruisX - arm} ${kruisY + arm}`}
          stroke="var(--waarschuwing)"
          strokeWidth={lijn}
          strokeLinecap="round"
          pointerEvents="none"
        />
        <circle cx={kruisX} cy={kruisY} r={hit * 0.6} fill="transparent" />
      </g>
    </g>
  )
}
