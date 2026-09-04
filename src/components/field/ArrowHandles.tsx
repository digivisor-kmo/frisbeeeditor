import { segmentMidpoints } from '@/lib/diagram/curve'
import { arrowBochten, arrowEnd, MAX_BOCHTEN } from '@/lib/diagram/arrows'
import type { Arrow } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  arrow: Arrow
  view: FieldView
  tokenRadiusM: number
  hitRadiusM: number
  /** Index in path.points of the bend that shows its delete cross. */
  actieveBocht: number | null
}

/**
 * Handles for a selected arrow.
 *
 * A big filled handle is a bend point that lies on the curve. A small grey one
 * sits in the middle of every segment and is an invitation: drag it and it
 * becomes a real bend, after which two new small ones appear left and right of
 * it. With n bends there are always n + 1 small handles.
 */
export function ArrowHandles({ arrow, view, tokenRadiusM, hitRadiusM, actieveBocht }: Props) {
  const punten = arrow.path.points.map((p) => toSvg(p, view))
  const hit = metresToUnits(hitRadiusM)
  const groot = metresToUnits(tokenRadiusM * 0.46)
  const klein = metresToUnits(tokenRadiusM * 0.3)
  const lijn = metresToUnits(tokenRadiusM * 0.12)

  const bochten = arrowBochten(arrow)
  const vol = bochten.length >= MAX_BOCHTEN
  const midden = segmentMidpoints(punten)
  const eind = toSvg(arrowEnd(arrow), view)

  return (
    <g data-entity-id={arrow.id}>
      {!vol &&
        midden.map((punt, index) => (
          <g key={`hint-${index}`} data-part={`hint-${index}`}>
            <circle
              cx={punt.x}
              cy={punt.y}
              r={klein}
              fill="var(--token-wit)"
              stroke="var(--handle)"
              strokeWidth={lijn * 0.8}
              opacity={0.7}
              pointerEvents="none"
            />
            <circle cx={punt.x} cy={punt.y} r={hit * 0.6} fill="transparent" />
          </g>
        ))}

      {bochten.map((_, i) => {
        const puntIndex = i + 1
        const punt = punten[puntIndex]!
        const actief = actieveBocht === puntIndex
        return (
          <g key={`bend-${puntIndex}`}>
            <g data-part={`bend-${puntIndex}`}>
              <circle
                cx={punt.x}
                cy={punt.y}
                r={groot}
                fill="var(--handle)"
                stroke={actief ? 'var(--accent)' : 'var(--token-wit)'}
                strokeWidth={actief ? lijn * 1.6 : lijn}
                pointerEvents="none"
              />
              <circle cx={punt.x} cy={punt.y} r={hit * 0.6} fill="transparent" />
            </g>

            {/* Only the active bend shows its cross, otherwise a curve with four
                bends turns into a field of little crosses. */}
            {actief && (
              <BochtVerwijderen
                x={punt.x + groot * 2.4}
                y={punt.y - groot * 2.4}
                straal={groot * 0.85}
                hit={hit * 0.55}
                lijn={lijn}
                puntIndex={puntIndex}
              />
            )}
          </g>
        )
      })}

      <circle
        cx={eind.x}
        cy={eind.y}
        r={groot * 0.85}
        fill="var(--accent)"
        stroke="var(--token-wit)"
        strokeWidth={lijn}
        pointerEvents="none"
      />
    </g>
  )
}

function BochtVerwijderen({
  x,
  y,
  straal,
  hit,
  lijn,
  puntIndex,
}: {
  x: number
  y: number
  straal: number
  hit: number
  lijn: number
  puntIndex: number
}) {
  const arm = straal * 0.55
  return (
    <g data-part={`bendDelete-${puntIndex}`} style={{ cursor: 'pointer' }}>
      <circle
        cx={x}
        cy={y}
        r={straal}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={lijn * 0.8}
        pointerEvents="none"
      />
      <path
        d={`M ${x - arm} ${y - arm} L ${x + arm} ${y + arm} M ${x + arm} ${y - arm} L ${x - arm} ${y + arm}`}
        stroke="var(--waarschuwing)"
        strokeWidth={lijn}
        strokeLinecap="round"
        pointerEvents="none"
      />
      <circle cx={x} cy={y} r={hit} fill="transparent" />
    </g>
  )
}
