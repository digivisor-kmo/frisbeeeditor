import { toPathD, trimStart } from '@/lib/diagram/curve'
import { isArrow, isPlayer, type FrameContent, type Weergave } from '@/lib/diagram/schema'
import { createView, metresToUnits, toSvg } from '@/lib/field/geometry'

/**
 * A small, read-only picture of a diagram, for the library.
 *
 * No letters: at this size a position label is mush. You recognise a variant by
 * its shape, which is exactly how a trainer looks for one.
 */
export function DiagramThumbnail({
  content,
  weergave,
}: {
  content: FrameContent
  weergave: Weergave
}) {
  const view = createView(weergave)
  const straal = metresToUnits(1.7)
  const dikte = metresToUnits(0.34)

  return (
    <svg
      viewBox={view.viewBox}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden="true"
    >
      <rect
        x={0}
        y={0}
        width={metresToUnits(view.area.maxX - view.area.minX)}
        height={metresToUnits(view.area.maxY - view.area.minY)}
        fill="var(--field)"
        transform={view.rotated ? `rotate(90) translate(0 ${-metresToUnits(37)})` : undefined}
      />
      {view.showLines && (
        <g fill="none" stroke="var(--field-line)" strokeWidth={dikte * 0.5} opacity={0.85}>
          {[view.area.minX + 18, view.area.maxX - 18]
            .filter((at) => at > view.area.minX && at < view.area.maxX)
            .map((at) => {
              const a = toSvg({ x: at, y: view.area.minY }, view)
              const b = toSvg({ x: at, y: view.area.maxY }, view)
              return <line key={at} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            })}
        </g>
      )}

      {content.entities.filter(isArrow).map((arrow) => {
        const punten = trimStart(
          arrow.path.points.map((p) => toSvg(p, view)),
          straal,
        )
        return (
          <path
            key={arrow.id}
            d={toPathD(punten)}
            fill="none"
            stroke="var(--arrow)"
            strokeWidth={dikte}
            strokeLinecap="round"
            strokeDasharray={arrow.kind === 'throw' ? `${dikte * 2.2} ${dikte * 1.8}` : undefined}
          />
        )
      })}

      {content.entities.filter(isPlayer).map((player) => {
        const { x, y } = toSvg(player.pos, view)
        return (
          <circle
            key={player.id}
            cx={x}
            cy={y}
            r={straal}
            fill={player.side === 'offense' ? 'var(--team-a)' : 'var(--team-b)'}
            stroke="var(--field-line)"
            strokeWidth={dikte * 0.8}
          />
        )
      })}
    </svg>
  )
}
