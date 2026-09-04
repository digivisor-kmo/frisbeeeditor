'use client'

import { useMemo, useRef } from 'react'
import { AnimatieLaag } from '@/components/field/AnimatieLaag'
import { ArrowShape } from '@/components/field/ArrowShape'
import { FieldSurface } from '@/components/field/FieldSurface'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { useMetresPerPixel, useStaandScherm } from '@/components/editor/useMetresPerPixel'
import { frameOpTijd } from '@/lib/diagram/animation'
import { isArrow, isPlayer, type Entity, type Tokenstijl, type Weergave } from '@/lib/diagram/schema'
import type { EditorFrame } from '@/lib/editor/document'
import { createView, maakCamera } from '@/lib/field/geometry'
import { hitRadiusM, tokenRadiusM } from '@/lib/field/scale'

interface Props {
  frames: EditorFrame[]
  weergave: Weergave
  stijl: Tokenstijl
  activeFrame: number
  speelt: boolean
  scrubt: boolean
  tijdMs: number
  focus: 'offense' | 'defense' | 'beide'
}

const opZ = <T extends Entity>(lijst: T[]): T[] => [...lijst].sort((a, b) => a.z - b.z)

/**
 * The field as a player sees it: the same drawing as in the editor, without a
 * single thing that can be grabbed.
 *
 * A separate component rather than the editor canvas with its handlers turned
 * off. Half-disabled controls are the thing this project explicitly does not
 * want, and a token that follows your finger for two pixels before refusing is
 * exactly that.
 */
export function LeesCanvas({
  frames,
  weergave,
  stijl,
  activeFrame,
  speelt,
  scrubt,
  tijdMs,
  focus,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const staand = useStaandScherm()
  const view = useMemo(() => createView(weergave, staand), [weergave, staand])
  const camera = useMemo(() => maakCamera(view, 1, { x: 0, y: 0 }), [view])
  const metresPerPixel = useMetresPerPixel(svgRef, camera)
  const radiusM = tokenRadiusM(metresPerPixel)
  const hitM = hitRadiusM(metresPerPixel)

  const duren = useMemo(() => frames.map((f) => f.duurMs), [frames])
  const animeert = speelt || scrubt
  const moment = frameOpTijd(duren, tijdMs)

  const entities = frames[activeFrame]?.content.entities ?? []
  const spelers = entities.filter(isPlayer)
  const arrows = entities.filter(isArrow)
  const pionnen = entities.filter((e) => e.type === 'cone')

  return (
    <svg
      ref={svgRef}
      viewBox={camera.viewBox}
      role="img"
      aria-label="Diagram"
      className="veld-svg"
    >
      <FieldSurface view={view} />

      {animeert && (
        <AnimatieLaag
          vorig={frames[moment.index]?.content ?? { entities: [] }}
          volgend={
            frames[moment.index + 1]?.content ?? frames[moment.index]?.content ?? { entities: [] }
          }
          t={moment.t}
          duurMs={frames[moment.index]?.duurMs ?? 1500}
          view={view}
          radiusM={radiusM}
          stijl={stijl}
          focus={focus}
        />
      )}

      <g style={{ display: animeert ? 'none' : undefined }}>
        {opZ(pionnen).map((cone) =>
          cone.type === 'cone' ? (
            <ConeToken
              key={cone.id}
              cone={cone}
              view={view}
              radiusM={radiusM}
              hitRadiusM={hitM}
              selected={false}
            />
          ) : null,
        )}

        {opZ(arrows).map((arrow) => (
          <ArrowShape
            key={arrow.id}
            arrow={arrow}
            view={view}
            tokenRadiusM={radiusM}
            hitRadiusM={hitM}
            selected={false}
            tipVerborgen={false}
          />
        ))}

        {opZ(spelers).map((player) => (
          <PlayerToken
            key={player.id}
            player={player}
            view={view}
            radiusM={radiusM}
            hitRadiusM={hitM}
            stijl={stijl}
            selected={false}
          />
        ))}
      </g>
    </svg>
  )
}
