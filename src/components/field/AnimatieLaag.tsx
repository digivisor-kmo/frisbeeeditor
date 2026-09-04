import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { Schijf } from '@/components/field/tokens/Schijf'
import { ArrowShape } from '@/components/field/ArrowShape'
import {
  dekkingOpTijd,
  positieOpTijd,
  schijfDragerOpTijd,
  schijfOpTijd,
} from '@/lib/diagram/animation'
import { isArrow, isPlayer, type FrameContent, type Tokenstijl } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  vorig: FrameContent
  volgend: FrameContent
  t: number
  duurMs: number
  view: FieldView
  radiusM: number
  stijl: Tokenstijl
  focus: 'offense' | 'defense' | 'beide'
}

/** How far the side you are not watching steps back. */
const BUITEN_FOCUS = 0.25

export function AnimatieLaag({
  vorig,
  volgend,
  t,
  duurMs,
  view,
  radiusM,
  stijl,
  focus,
}: Props) {
  const schijf = schijfOpTijd(vorig, volgend, t)
  const drager = schijfDragerOpTijd(vorig, t)

  const ids = new Set([...vorig.entities, ...volgend.entities].map((e) => e.id))
  const sjabloon = (id: string) =>
    vorig.entities.find((e) => e.id === id) ?? volgend.entities.find((e) => e.id === id)

  const spelers = [...ids]
    .map((id) => ({ id, entity: sjabloon(id) }))
    .filter((x) => x.entity !== undefined && isPlayer(x.entity))

  const pionnen = [...ids]
    .map((id) => ({ id, entity: sjabloon(id) }))
    .filter((x) => x.entity?.type === 'cone')

  return (
    <>
      <g opacity={0.4}>
        {vorig.entities.filter(isArrow).map((arrow) => (
          <ArrowShape
            key={arrow.id}
            arrow={arrow}
            view={view}
            tokenRadiusM={radiusM}
            hitRadiusM={radiusM}
            selected={false}
            tipVerborgen={false}
          />
        ))}
      </g>

      {pionnen.map(({ id, entity }) => {
        if (entity?.type !== 'cone') return null
        const pos = positieOpTijd(vorig, volgend, id, t)
        if (!pos) return null
        return (
          <g key={id} opacity={dekkingOpTijd(vorig, volgend, id, t, duurMs)}>
            <ConeToken
              cone={{ ...entity, pos }}
              view={view}
              radiusM={radiusM}
              hitRadiusM={radiusM}
              selected={false}
            />
          </g>
        )
      })}

      {spelers.map(({ id, entity }) => {
        if (!entity || !isPlayer(entity)) return null
        const pos = positieOpTijd(vorig, volgend, id, t)
        if (!pos) return null

        const inFocus = focus === 'beide' || entity.side === focus
        const dekking = dekkingOpTijd(vorig, volgend, id, t, duurMs) * (inFocus ? 1 : BUITEN_FOCUS)

        // While the disc is in the air nobody is holding it.
        const heeftSchijf = schijf ? false : drager ? drager === id : entity.hasDisc

        return (
          <g key={id} opacity={dekking}>
            <PlayerToken
              player={{ ...entity, pos, hasDisc: heeftSchijf }}
              view={view}
              radiusM={radiusM}
              hitRadiusM={radiusM}
              stijl={stijl}
              selected={false}
            />
          </g>
        )
      })}

      {schijf && <SchijfInDeLucht punt={schijf.point} view={view} radiusM={radiusM} />}
    </>
  )
}

function SchijfInDeLucht({
  punt,
  view,
  radiusM,
}: {
  punt: { x: number; y: number }
  view: FieldView
  radiusM: number
}) {
  const { x, y } = toSvg(punt, view)
  // The same disc as the one in a hand, one size up because in the air it has
  // nothing beside it to give it scale.
  return <Schijf x={x} y={y} r={metresToUnits(radiusM) * 1.05} />
}
