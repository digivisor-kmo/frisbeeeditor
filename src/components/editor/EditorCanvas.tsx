'use client'

import { useEffect, useMemo, useRef } from 'react'
import { FieldSurface } from '@/components/field/FieldSurface'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { createCone, createPlayer, hasPosition } from '@/lib/diagram/entities'
import { isPlayer, type Point, type Side } from '@/lib/diagram/schema'
import { createView, snapToGrid, toField, toScreenPx, UNITS_PER_METRE } from '@/lib/field/geometry'
import { clientToSvg } from '@/lib/field/pointer'
import { hitRadiusM, tokenRadiusM } from '@/lib/field/scale'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { SelectedEntityMenu } from './SelectedEntityMenu'
import { useMetresPerPixel } from './useMetresPerPixel'

interface DragState {
  entityId: string
  pointerId: number
  groupId: string
  /** Distance between the pointer and the entity origin, so the token does not jump. */
  offset: Point
  /** Where the pointer went down, in screen pixels. */
  start: { x: number; y: number }
  moved: boolean
}

/**
 * How far the pointer has to travel before a tap becomes a drag, in CSS pixels.
 *
 * Without this every tap is a drag: a mouse click emits a pointermove between
 * down and up, and a finger never lands perfectly still. The menu would flash
 * open and shut, and the entity would record a move of nothing.
 */
const SLEEP_DREMPEL_PX = 4

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
  const menuOpen = useUiStore((s) => s.menuOpen)
  const setMenuOpen = useUiStore((s) => s.setMenuOpen)

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
        start: { x: event.clientX, y: event.clientY },
        moved: false,
      }
      svgRef.current?.setPointerCapture(event.pointerId)
      setMenuOpen(!event.shiftKey)
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
      setMenuOpen(true)
      return
    }

    clearSelection()
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return

    if (!state.moved) {
      const afstand = Math.hypot(
        event.clientX - state.start.x,
        event.clientY - state.start.y,
      )
      if (afstand < SLEEP_DREMPEL_PX) return
      state.moved = true
      setMenuOpen(false)
    }

    const raw = pointOf(event.clientX, event.clientY)
    const pos = maybeSnap(
      { x: raw.x + state.offset.x, y: raw.y + state.offset.y },
      event.altKey,
    )
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

  const geselecteerd =
    selection.size === 1 ? entities.find((e) => selection.has(e.id)) : undefined
  const anchor =
    geselecteerd && (geselecteerd.type === 'player' || geselecteerd.type === 'cone')
      ? toScreenPx(geselecteerd.pos, view, metresPerPixel)
      : null

  return (
    <div style={{ position: 'relative' }}>
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

      {menuOpen && geselecteerd && anchor && (
        <SelectedEntityMenu
          key={geselecteerd.id}
          entity={geselecteerd}
          anchor={anchor}
          tokenRadiusPx={(radiusM * UNITS_PER_METRE) / (UNITS_PER_METRE * metresPerPixel)}
        />
      )}
    </div>
  )
}
