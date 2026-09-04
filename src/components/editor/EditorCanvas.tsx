'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowHandles } from '@/components/field/ArrowHandles'
import { ArrowShape } from '@/components/field/ArrowShape'
import { FieldSurface } from '@/components/field/FieldSurface'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { snapThrowEnd, verplaatsArrow } from '@/lib/diagram/arrows'
import { createCone, createPlayer, hasPosition } from '@/lib/diagram/entities'
import { isArrow, isPlayer, type Point, type Side } from '@/lib/diagram/schema'
import {
  createView,
  snapToGrid,
  toField,
  toScreenPx,
  UNITS_PER_METRE,
} from '@/lib/field/geometry'
import { clientToSvg } from '@/lib/field/pointer'
import { hitRadiusM, tokenRadiusM } from '@/lib/field/scale'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { SelectedEntityMenu } from './SelectedEntityMenu'
import { useMetresPerPixel } from './useMetresPerPixel'

type DragDoel =
  | { soort: 'entiteit'; id: string; offset: Point }
  | { soort: 'tip'; id: string }
  | { soort: 'bend'; id: string }
  | { soort: 'hint'; id: string }

interface DragState {
  doel: DragDoel
  pointerId: number
  groupId: string
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
  const [tipInSleep, setTipInSleep] = useState<string | null>(null)

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

  /** Applies a change to the entity with this id inside the active frame. */
  const wijzigFrame = (label: string, recipe: (entities: import('@/lib/diagram/schema').Entity[]) => void, groupId?: string) =>
    change(
      label,
      (draft) => {
        const content = draft.frames[activeFrame]?.content
        if (content) recipe(content.entities)
      },
      groupId,
    )

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const target = event.target as Element
    const groep = target.closest('[data-entity-id]')
    const entityId = groep?.getAttribute('data-entity-id') ?? null
    const part = target.closest('[data-part]')?.getAttribute('data-part') ?? null
    const point = pointOf(event.clientX, event.clientY)

    if (entityId) {
      const entity = entities.find((e) => e.id === entityId)
      if (!entity) return

      const beginSleep = (doel: DragDoel) => {
        drag.current = {
          doel,
          pointerId: event.pointerId,
          groupId: newId(),
          start: { x: event.clientX, y: event.clientY },
          moved: false,
        }
        svgRef.current?.setPointerCapture(event.pointerId)
        setMode('dragging')
      }

      if (isArrow(entity)) {
        if (event.shiftKey) toggle(entityId)
        else select([entityId])

        if (part === 'bendDelete') {
          wijzigFrame('Bocht weghalen', (list) => {
            const a = list.find((e) => e.id === entityId)
            if (a && a.type === 'arrow' && a.path.points.length === 3) a.path.points.splice(1, 1)
          })
          setMenuOpen(false)
          return
        }

        // The tip opens the menu; the body only shows the handles. Keeping those
        // apart is what makes an arrow workable without any explanation.
        setMenuOpen(part === 'tip')
        if (part === 'tip') beginSleep({ soort: 'tip', id: entityId })
        else if (part === 'bend') beginSleep({ soort: 'bend', id: entityId })
        else if (part === 'hint') beginSleep({ soort: 'hint', id: entityId })
        return
      }

      if (!hasPosition(entity)) return

      if (event.shiftKey) toggle(entityId)
      else select([entityId])
      setMenuOpen(!event.shiftKey)
      beginSleep({
        soort: 'entiteit',
        id: entityId,
        offset: { x: entity.pos.x - point.x, y: entity.pos.y - point.y },
      })
      return
    }

    if (tool === 'player' || tool === 'cone') {
      const pos = maybeSnap(point, event.altKey)
      const id = newId()
      wijzigFrame(tool === 'player' ? 'Speler plaatsen' : 'Pion plaatsen', (list) => {
        list.push(
          tool === 'player'
            ? createPlayer({ id, pos, side: nieuweSpelerKant, entities: list })
            : createCone({ id, pos, entities: list }),
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
      const afstand = Math.hypot(event.clientX - state.start.x, event.clientY - state.start.y)
      if (afstand < SLEEP_DREMPEL_PX) return
      state.moved = true
      setMenuOpen(false)
      if (state.doel.soort === 'tip') setTipInSleep(state.doel.id)
    }

    const ruw = pointOf(event.clientX, event.clientY)
    const doel = state.doel

    if (doel.soort === 'entiteit') {
      const pos = maybeSnap({ x: ruw.x + doel.offset.x, y: ruw.y + doel.offset.y }, event.altKey)
      wijzigFrame(
        'Verplaatsen',
        (list) => {
          const entity = list.find((e) => e.id === doel.id)
          if (!entity || !hasPosition(entity)) return
          const delta = { x: pos.x - entity.pos.x, y: pos.y - entity.pos.y }
          entity.pos = pos
          // Arrows belong to their player: nudging him takes the shape he drew
          // along instead of leaving it behind on the grass.
          if (entity.type === 'player') {
            for (const other of list) {
              if (isArrow(other) && other.ownerId === doel.id) verplaatsArrow(other, delta)
            }
          }
        },
        state.groupId,
      )
      return
    }

    wijzigFrame(
      doel.soort === 'tip' ? 'Arrow bijstellen' : 'Bocht bijstellen',
      (list) => {
        const arrow = list.find((e) => e.id === doel.id)
        if (!arrow || arrow.type !== 'arrow') return

        if (doel.soort === 'tip') {
          const gesnapt = maybeSnap(ruw, event.altKey)
          if (arrow.kind === 'throw') {
            const { pos, targetId } = snapThrowEnd(gesnapt, list, arrow.ownerId)
            arrow.path.points[arrow.path.points.length - 1] = { ...pos }
            arrow.targetId = targetId
          } else {
            // A cut ends in open space, so it never locks onto a player.
            arrow.path.points[arrow.path.points.length - 1] = gesnapt
            arrow.targetId = undefined
          }
          return
        }

        const bocht = maybeSnap(ruw, event.altKey)
        if (arrow.path.points.length === 2) arrow.path.points.splice(1, 0, bocht)
        else arrow.path.points[1] = bocht
      },
      state.groupId,
    )
  }

  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    svgRef.current?.releasePointerCapture(event.pointerId)
    drag.current = null
    setTipInSleep(null)
    setMode('idle')
  }

  const cones = entities.filter((e) => e.type === 'cone')
  const arrows = entities.filter(isArrow)
  const players = entities.filter(isPlayer)

  const geselecteerd =
    selection.size === 1 ? entities.find((e) => selection.has(e.id)) : undefined

  const anchor = geselecteerd
    ? geselecteerd.type === 'arrow'
      ? toScreenPx(
          geselecteerd.path.points[geselecteerd.path.points.length - 1]!,
          view,
          metresPerPixel,
        )
      : hasPosition(geselecteerd)
        ? toScreenPx(geselecteerd.pos, view, metresPerPixel)
        : null
    : null

  const opZ = <T extends { z: number }>(list: T[]) => list.slice().sort((a, b) => a.z - b.z)

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
          {opZ(cones).map((cone) => (
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
          {opZ(arrows).map((arrow) => (
            <ArrowShape
              key={arrow.id}
              arrow={arrow}
              view={view}
              tokenRadiusM={radiusM}
              hitRadiusM={hitM}
              selected={selection.has(arrow.id)}
              tipVerborgen={tipInSleep === arrow.id}
            />
          ))}
        </g>

        <g>
          {opZ(players).map((player) => (
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

        <g>
          {arrows
            .filter((a) => selection.has(a.id))
            .map((arrow) => (
              <ArrowHandles
                key={arrow.id}
                arrow={arrow}
                view={view}
                tokenRadiusM={radiusM}
                hitRadiusM={hitM}
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
