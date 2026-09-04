import {
  buildLengthTable,
  pointAtDistance,
  toPathD,
  toPolylineD,
  trimStart,
  wavyPoints,
} from '@/lib/diagram/curve'
import type { Arrow } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView, type Point } from '@/lib/field/geometry'

interface Props {
  arrow: Arrow
  view: FieldView
  /** Token radius in metres, so the line starts at the edge of the token. */
  tokenRadiusM: number
  hitRadiusM: number
  selected: boolean
  /** While the tip is being dragged the head disappears, so it does not sit in the way. */
  tipVerborgen: boolean
}

const JUKE_AMPLITUDE_M = 0.5
const JUKE_CYCLI = 3

export function ArrowShape({
  arrow,
  view,
  tokenRadiusM,
  hitRadiusM,
  selected,
  tipVerborgen,
}: Props) {
  const punten = arrow.path.points.map((p) => toSvg(p, view))
  const lijn = trimStart(punten, metresToUnits(tokenRadiusM + 0.25))
  if (lijn.length < 2) return null

  const dikte = metresToUnits(tokenRadiusM * 0.19)
  const kop = metresToUnits(tokenRadiusM * 0.95)
  const hit = metresToUnits(hitRadiusM)

  const table = buildLengthTable(lijn)
  const eind = pointAtDistance(table, table.total)
  const richting = eind.tangent

  // Leave room for the head so the line does not stick out through its point.
  const lijnEinde = arrow.kind === 'juke' ? table.total : Math.max(0, table.total - kop * 0.75)
  const zichtbaar = pointAtDistance(table, lijnEinde).point

  const d =
    arrow.kind === 'juke'
      ? toPolylineD(wavyPoints(lijn, metresToUnits(JUKE_AMPLITUDE_M), JUKE_CYCLI))
      : toPathD(kortPad(lijn, table.total, lijnEinde, zichtbaar))

  const gestreept = arrow.kind === 'throw'
  const gevuldeKop = arrow.kind !== 'throw'
  // A throw that lands on nobody hands the disc to nobody and animates nothing.
  // It has to look unfinished, or you go hunting for a bug that is not there.
  const losseWorp = arrow.kind === 'throw' && !arrow.targetId

  const links: Point = {
    x: eind.point.x - richting.x * kop + -richting.y * kop * 0.42,
    y: eind.point.y - richting.y * kop + richting.x * kop * 0.42,
  }
  const rechts: Point = {
    x: eind.point.x - richting.x * kop - -richting.y * kop * 0.42,
    y: eind.point.y - richting.y * kop - richting.x * kop * 0.42,
  }

  return (
    <g data-entity-id={arrow.id}>
      <path
        d={d}
        fill="none"
        stroke="var(--arrow)"
        strokeWidth={dikte}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={gestreept ? `${dikte * 2.4} ${dikte * 1.9}` : undefined}
        pointerEvents="none"
      />

      {!tipVerborgen && losseWorp && (
        <circle
          cx={eind.point.x}
          cy={eind.point.y}
          r={kop * 0.6}
          fill="none"
          stroke="var(--arrow)"
          strokeWidth={dikte * 0.8}
          opacity={0.75}
          pointerEvents="none"
        />
      )}

      {!tipVerborgen &&
        !losseWorp &&
        (gevuldeKop ? (
          <polygon
            points={`${eind.point.x},${eind.point.y} ${links.x},${links.y} ${rechts.x},${rechts.y}`}
            fill="var(--arrow)"
            pointerEvents="none"
          />
        ) : (
          <path
            d={`M ${links.x} ${links.y} L ${eind.point.x} ${eind.point.y} L ${rechts.x} ${rechts.y}`}
            fill="none"
            stroke="var(--arrow)"
            strokeWidth={dikte}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}

      {selected && (
        <path
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={dikte * 0.45}
          strokeLinecap="round"
          opacity={0.9}
          pointerEvents="none"
        />
      )}

      {/* Hit area for the body: a fat invisible stroke along the same line. */}
      <path
        data-part="body"
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(dikte * 3, hit * 0.8)}
        strokeLinecap="round"
      />

      {/* Hit area for the tip, which is both the drag handle and the menu. */}
      <circle data-part="tip" cx={eind.point.x} cy={eind.point.y} r={hit} fill="transparent" />
    </g>
  )
}

/** Cuts the drawn line short of the arrowhead without moving any real point. */
function kortPad(
  punten: Point[],
  totaal: number,
  tot: number,
  eindpunt: Point,
): Point[] {
  if (tot >= totaal - 1e-9) return punten
  const behouden = punten.slice(0, punten.length - 1)
  return [...behouden, eindpunt]
}
