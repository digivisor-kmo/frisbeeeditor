'use client'

import { useEffect, useMemo, useRef } from 'react'
import { FieldSurface } from '@/components/field/FieldSurface'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { createCone, createPlayer, hasPosition } from '@/lib/diagram/entities'
import { isPlayer, type Point, type Side } from '@/lib/diagram/schema'
import { createView, snapToGrid, toField } from '@/lib/field/geometry'
import { clientToSvg } from '@/lib/field/pointer'
import { hitRadiusM, tokenRadiusM } from '@/lib/field/scale'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { useMetresPerPixel } from './useMetresPerPixel'

interface DragState {
  entityId: string
  pointerId: number
  groupId: string
  /** Distance between the pointer and the entity origin, so the token does not jump. */
  offset: Point
  moved: boolean
}

export function EditorCanvas({ nieuweSpelerKant }: { nieuweSpelerKant: Side }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<DragState | null>(null)

  const doc = useDiagramStore((s) => s.doc)
  const change = useDiagramStore((s) => s.change)

  const activeFrame = useUiStore((s) => s.activeFrame)
  const tool = useUiStore((s) => s.tool)
  const snap = useUiStore((s) => s.snap)
  const selection = useUiStore((s) => s.selection)
  const select = useUiStore((s) => s.select)
  const toggle = useUiStore((s) => s.toggle)
  const clearSelection = useUiStore((s) => s.clearSelection)
  const setMode = useUiStore((s) => s.setMode)
  const pruneSelection = useUiStore((s) => s.pruneSelection)

  const view = useMemo(() => createView(doc.meta.weergave), [doc.meta.weergave])
  const metresPerPixel = useMetresPerPixel(svgRef, view)
  const radiusM = tokenRadiusM(metresPerPixel)
  const hitM = hitRadiusM(metresPerPixel)

  const frame = doc.frames[activeFrame]
  const entities = useMemo(
    () => doc.frames[activeFrame]?.content.entities ?? [],
    [doc, activeFrame],
  )

  useEffect(() => {
    pruneSelection(new Set(entities.map((e) => e.id)))
  }, [entities, pruneSelection])

  const pointOf = (clientX: number, clientY: number): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    return toField(clientToSvg(svg, clientX, clientY), view)
  }

  const maybeSnap = (point: Point, altKey: boolean): Point =>
    snap && !altKey ? snapToGrid(point) : point

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!frame) return
    const target = event.target as Element
    const group = target.closest('[data-entity-id]')
    const entityId = group?.getAttribute('data-entity-id') ?? null
    const point = pointOf(event.clientX, event.clientY)

    if (entityId) {
      const entity = entities.find((e) => e.id === entityId)
      if (!entity || !hasPosition(entity)) return

      if (event.shiftKey) toggle(entityId)
      else select([entityId])

      drag.current = {
        entityId,
        pointerId: event.pointerId,
        groupId: newId(),
        offset: { x: entity.pos.x - point.x, y: entity.pos.y - point.y },
        moved: false,
      }
      svgRef.current?.setPointerCapture(event.pointerId)
      setMode('dragging')
      return
    }

    if (tool === 'player' || tool === 'cone') {
      const pos = maybeSnap(point, event.altKey)
      const id = newId()
      change(tool === 'player' ? 'Speler plaatsen' : 'Pion plaatsen', (draft) => {
        const content = draft.frames[activeFrame]?.content
        if (!content) return
        content.entities.push(
          tool === 'player'
            ? createPlayer({ id, pos, side: nieuweSpelerKant, entities: content.entities })
            : createCone({ id, pos, entities: content.entities }),
        )
      })
      select([id])
      return
    }

    clearSelection()
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return

    const raw = pointOf(event.clientX, event.clientY)
    const pos = maybeSnap(
      { x: raw.x + state.offset.x, y: raw.y + state.offset.y },
      event.altKey,
    )

    state.moved = true
    change(
      'Verplaatsen',
      (draft) => {
        const entity = draft.frames[activeFrame]?.content.entities.find(
          (e) => e.id === state.entityId,
        )
        if (!entity || !hasPosition(entity)) return
        entity.pos = pos
      },
      state.groupId,
    )
  }

  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    svgRef.current?.releasePointerCapture(event.pointerId)
    drag.current = null
    setMode('idle')
  }

  const cones = entities.filter((e) => e.type === 'cone')
  const players = entities.filter(isPlayer)

  return (
    <svg
      ref={svgRef}
      viewBox={view.viewBox}
      role="application"
      aria-label="Veld"
      style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <FieldSurface view={view} />

      <g>
        {cones
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((cone) => (
            <ConeToken
              key={cone.id}
              cone={cone}
              view={view}
              radiusM={radiusM}
              hitRadiusM={hitM}
              selected={selection.has(cone.id)}
            />
          ))}
      </g>

      <g>
        {players
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((player) => (
            <PlayerToken
              key={player.id}
              player={player}
              view={view}
              radiusM={radiusM}
              hitRadiusM={hitM}
              stijl={doc.meta.tokenstijl}
              selected={selection.has(player.id)}
            />
          ))}
      </g>
    </svg>
  )
}
