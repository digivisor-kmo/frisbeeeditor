'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatieLaag } from '@/components/field/AnimatieLaag'
import { ArrowHandles } from '@/components/field/ArrowHandles'
import { ArrowShape } from '@/components/field/ArrowShape'
import { FieldSurface } from '@/components/field/FieldSurface'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { frameOpTijd } from '@/lib/diagram/animation'
import { arrowEnd, snapThrowEnd, verwijderBocht, voegBochtToe } from '@/lib/diagram/arrows'
import {
  herberekenSchijfVanaf,
  synchroniseerArrowMetVorigFrame,
  verplaatsVanaf,
  voegToeVanaf,
} from '@/lib/diagram/propagatie'
import { createCone, createPlayer, hasPosition } from '@/lib/diagram/entities'
import { isArrow, isPlayer, type Point, type Side } from '@/lib/diagram/schema'
import { framesVan } from '@/lib/editor/document'
import {
  createView,
  klem,
  maakCamera,
  MAX_ZOOM,
  MIN_ZOOM,
  snapToGrid,
  toField,
  toScreenPx,
  toSvg,
  UNITS_PER_METRE,
  zoomOmPunt,
} from '@/lib/field/geometry'
import { clientToSvg } from '@/lib/field/pointer'
import { entiteitenInKader, maakKader, type Kader } from '@/lib/editor/marquee'
import { hitRadiusM, tokenRadiusM } from '@/lib/field/scale'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { SelectedEntityMenu } from './SelectedEntityMenu'
import { useMetresPerPixel, useStaandScherm } from './useMetresPerPixel'

interface KnijpState {
  /** Distance between the two fingers when the gesture started. */
  afstand: number
  zoom: number
  /** The point on the field that stays under the fingers, in SVG units. */
  vast: Point
}

type DragDoel =
  | { soort: 'entiteit'; id: string; offset: Point; groepIds: string[] }
  | { soort: 'tip'; id: string }
  | { soort: 'bend'; id: string; puntIndex: number }
  | { soort: 'hint'; id: string; segmentIndex: number; puntIndex: number | null }
  | { soort: 'kader'; startPunt: Point }

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
  const [kader, setKader] = useState<Kader | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const knijp = useRef<KnijpState | null>(null)

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
  const actieveBocht = useUiStore((s) => s.actieveBocht)
  const setActieveBocht = useUiStore((s) => s.setActieveBocht)

  const zoom = useUiStore((s) => s.zoom)
  const pan = useUiStore((s) => s.pan)
  const setCamera = useUiStore((s) => s.setCamera)

  const speelt = useUiStore((s) => s.speelt)
  const scrubt = useUiStore((s) => s.scrubt)
  const tijdMs = useUiStore((s) => s.tijdMs)
  const focus = useUiStore((s) => s.focus)
  const animeert = speelt || scrubt

  const staand = useStaandScherm()
  const view = useMemo(() => createView(doc.meta.weergave, staand), [doc.meta.weergave, staand])
  const camera = useMemo(() => maakCamera(view, zoom, pan), [view, zoom, pan])
  const metresPerPixel = useMetresPerPixel(svgRef, camera)
  const radiusM = tokenRadiusM(metresPerPixel)
  const hitM = hitRadiusM(metresPerPixel)

  const entities = useMemo(
    () => doc.frames[activeFrame]?.content.entities ?? [],
    [doc, activeFrame],
  )
  const duren = useMemo(() => doc.frames.map((f) => f.duurMs), [doc])

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

  /** Applies a change to the entities of the active frame only. */
  const wijzigFrame = (
    label: string,
    recipe: (entities: import('@/lib/diagram/schema').Entity[]) => void,
    groupId?: string,
  ) =>
    change(
      label,
      (draft) => {
        const content = draft.frames[activeFrame]?.content
        if (content) recipe(content.entities)
      },
      groupId,
    )

  /** Applies a change that reaches every frame, not only the one on screen. */
  const wijzigFrames = (
    label: string,
    recipe: (frames: import('@/lib/diagram/schema').FrameContent[]) => void,
    groupId?: string,
  ) => change(label, (draft) => recipe(framesVan(draft)), groupId)

  /** Where a client point sits inside the element, as a fraction from 0 to 1. */
  function fractieIn(clientX: number, clientY: number): Point {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0.5, y: 0.5 }
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }
  }

  function stopSleep() {
    drag.current = null
    setTipInSleep(null)
    setKader(null)
    setMode('idle')
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    // While it plays, the field is something you watch, not something you edit.
    if (animeert) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    // Two fingers is always pan and zoom, never editing. Whatever drag the
    // first finger had started is abandoned rather than half-applied.
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      if (a && b) {
        const midden = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const svg = svgRef.current
        knijp.current = {
          afstand: Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1),
          zoom,
          vast: svg ? clientToSvg(svg, midden.x, midden.y) : { x: 0, y: 0 },
        }
        stopSleep()
      }
      return
    }
    if (pointers.current.size > 2) return

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

        const index = part ? Number(part.split('-')[1]) : NaN

        if (part?.startsWith('bendDelete-')) {
          wijzigFrame('Bocht weghalen', (list) => {
            const a = list.find((e) => e.id === entityId)
            if (a && a.type === 'arrow') verwijderBocht(a, index)
          })
          setActieveBocht(null)
          setMenuOpen(false)
          return
        }

        // The tip opens the menu; the body only shows the handles. Keeping those
        // apart is what makes an arrow workable without any explanation.
        setMenuOpen(part === 'tip')

        if (part === 'tip') {
          setActieveBocht(null)
          beginSleep({ soort: 'tip', id: entityId })
        } else if (part?.startsWith('bend-')) {
          setActieveBocht(index)
          beginSleep({ soort: 'bend', id: entityId, puntIndex: index })
        } else if (part?.startsWith('hint-')) {
          setActieveBocht(null)
          beginSleep({ soort: 'hint', id: entityId, segmentIndex: index, puntIndex: null })
        } else {
          setActieveBocht(null)
        }
        return
      }

      if (!hasPosition(entity)) return

      // Grabbing something that is already part of a multiple selection drags
      // the whole selection, and does not throw that selection away.
      const hoortBijSelectie = selection.has(entityId) && selection.size > 1

      if (event.shiftKey) toggle(entityId)
      else if (!hoortBijSelectie) select([entityId])

      setMenuOpen(!event.shiftKey && !hoortBijSelectie)
      beginSleep({
        soort: 'entiteit',
        id: entityId,
        offset: { x: entity.pos.x - point.x, y: entity.pos.y - point.y },
        groepIds: hoortBijSelectie ? [...selection] : [entityId],
      })
      return
    }

    if (tool === 'player' || tool === 'cone') {
      const pos = maybeSnap(point, event.altKey)
      const id = newId()
      wijzigFrames(tool === 'player' ? 'Speler plaatsen' : 'Pion plaatsen', (frames) => {
        const huidig = frames[activeFrame]
        if (!huidig) return
        const nieuw =
          tool === 'player'
            ? createPlayer({ id, pos, side: nieuweSpelerKant, entities: huidig.entities })
            : createCone({ id, pos, entities: huidig.entities })
        // Somebody you put on the field does not vanish in the next frame.
        voegToeVanaf(frames, activeFrame, nieuw)
      })
      select([id])
      setMenuOpen(true)
      return
    }

    // Empty space with the select tool: drag a frame over the field.
    clearSelection()
    drag.current = {
      doel: { soort: 'kader', startPunt: point },
      pointerId: event.pointerId,
      groupId: newId(),
      start: { x: event.clientX, y: event.clientY },
      moved: false,
    }
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (pointers.current.has(event.pointerId)) {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    const gebaar = knijp.current
    if (gebaar && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      if (!a || !b) return
      const afstand = Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1)
      const midden = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const nieuweZoom = klem((gebaar.zoom * afstand) / gebaar.afstand, MIN_ZOOM, MAX_ZOOM)
      setCamera(
        nieuweZoom,
        zoomOmPunt(view, nieuweZoom, gebaar.vast, fractieIn(midden.x, midden.y)),
      )
      return
    }

    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return

    if (!state.moved) {
      const afstand = Math.hypot(event.clientX - state.start.x, event.clientY - state.start.y)
      if (afstand < SLEEP_DREMPEL_PX) return
      state.moved = true
      setMenuOpen(false)
      if (state.doel.soort === 'tip') setTipInSleep(state.doel.id)
      if (state.doel.soort === 'kader') setMode('marquee')
    }

    const ruw = pointOf(event.clientX, event.clientY)
    const doel = state.doel

    if (doel.soort === 'kader') {
      const nieuw = maakKader(doel.startPunt, ruw)
      setKader(nieuw)
      select(entiteitenInKader(entities, nieuw, radiusM))
      return
    }

    if (doel.soort === 'entiteit') {
      const pos = maybeSnap({ x: ruw.x + doel.offset.x, y: ruw.y + doel.offset.y }, event.altKey)
      const groep = doel.groepIds
      wijzigFrames(
        'Verplaatsen',
        (frames) => {
          const huidig = frames[activeFrame]
          const primair = huidig?.entities.find((e) => e.id === doel.id)
          if (!primair || !hasPosition(primair)) return

          // Only the entity under the finger snaps to the grid; everything else
          // follows by exactly the same delta, so the shape of the selection
          // never distorts while you drag it.
          const delta = { x: pos.x - primair.pos.x, y: pos.y - primair.pos.y }
          if (delta.x === 0 && delta.y === 0) return

          for (const id of groep) {
            // His position in this frame is the end of the arrow that brought
            // him here, so that arrow has to follow.
            synchroniseerArrowMetVorigFrame(frames, activeFrame, id, delta)
            verplaatsVanaf(frames, activeFrame, id, delta)
          }
        },
        state.groupId,
      )
      return
    }

    wijzigFrames(
      doel.soort === 'tip' ? 'Arrow bijstellen' : 'Bocht bijstellen',
      (frames) => {
        const list = frames[activeFrame]?.entities
        if (!list) return
        const arrow = list.find((e) => e.id === doel.id)
        if (!arrow || arrow.type !== 'arrow') return

        if (doel.soort === 'tip') {
          const gesnapt = maybeSnap(ruw, event.altKey)
          const oudEinde = { ...arrowEnd(arrow) }

          if (arrow.kind === 'throw') {
            const { pos, targetId } = snapThrowEnd(gesnapt, list, arrow.ownerId)
            arrow.path.points[arrow.path.points.length - 1] = { ...pos }
            arrow.targetId = targetId
            // A different receiver means the disc lands somewhere else.
            herberekenSchijfVanaf(frames, activeFrame)
          } else {
            // A cut ends in open space, so it never locks onto a player.
            arrow.path.points[arrow.path.points.length - 1] = gesnapt
            arrow.targetId = undefined
            const nieuwEinde = arrowEnd(arrow)
            verplaatsVanaf(frames, activeFrame + 1, arrow.ownerId, {
              x: nieuwEinde.x - oudEinde.x,
              y: nieuwEinde.y - oudEinde.y,
            })
          }
          return
        }

        const bocht = maybeSnap(ruw, event.altKey)

        if (doel.soort === 'hint') {
          // The first move turns the invitation into a real bend; every move
          // after that just drags the bend it created.
          if (doel.puntIndex === null) {
            const nieuw = voegBochtToe(arrow, doel.segmentIndex, bocht)
            if (nieuw === null) return
            doel.puntIndex = nieuw
            return
          }
          arrow.path.points[doel.puntIndex] = bocht
          return
        }

        arrow.path.points[doel.puntIndex] = bocht
      },
      state.groupId,
    )

    // A bend that was just created out of an invitation handle becomes the
    // active one, so its delete cross is right there if you misplaced it.
    if (doel.soort === 'hint' && doel.puntIndex !== null && actieveBocht !== doel.puntIndex) {
      setActieveBocht(doel.puntIndex)
    }
  }

  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) knijp.current = null

    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    svgRef.current?.releasePointerCapture(event.pointerId)
    stopSleep()
  }

  function onWheel(event: React.WheelEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    event.preventDefault()

    // A pinch on a trackpad arrives as a wheel event with ctrl held.
    if (event.ctrlKey || event.metaKey) {
      const nieuweZoom = klem(zoom * Math.exp(-event.deltaY * 0.0035), MIN_ZOOM, MAX_ZOOM)
      const vast = clientToSvg(svg, event.clientX, event.clientY)
      setCamera(nieuweZoom, zoomOmPunt(view, nieuweZoom, vast, fractieIn(event.clientX, event.clientY)))
      return
    }

    if (zoom === MIN_ZOOM) return
    const rect = svg.getBoundingClientRect()
    const perPixel = camera.width / Math.max(rect.width, 1)
    setCamera(zoom, { x: pan.x + event.deltaX * perPixel, y: pan.y + event.deltaY * perPixel })
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
          camera.origin,
        )
      : hasPosition(geselecteerd)
        ? toScreenPx(geselecteerd.pos, view, metresPerPixel, camera.origin)
        : null
    : null

  const opZ = <T extends { z: number }>(list: T[]) => list.slice().sort((a, b) => a.z - b.z)

  const canvasBreedte = camera.width / UNITS_PER_METRE / metresPerPixel
  const canvasHoogte = camera.height / UNITS_PER_METRE / metresPerPixel
  const toonScrim = menuOpen && geselecteerd !== undefined && !animeert

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={camera.viewBox}
        role="application"
        aria-label="Veld"
        className="veld-svg"

        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        <FieldSurface view={view} />

        {animeert && (
          <AnimatieLaag
            vorig={doc.frames[frameOpTijd(duren, tijdMs).index]?.content ?? { entities: [] }}
            volgend={
              doc.frames[frameOpTijd(duren, tijdMs).index + 1]?.content ??
              doc.frames[frameOpTijd(duren, tijdMs).index]?.content ?? { entities: [] }
            }
            t={frameOpTijd(duren, tijdMs).t}
            duurMs={doc.frames[frameOpTijd(duren, tijdMs).index]?.duurMs ?? 1500}
            view={view}
            radiusM={radiusM}
            stijl={doc.meta.tokenstijl}
            focus={focus}
          />
        )}

        <g style={{ display: animeert ? 'none' : undefined }}>
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

        <g style={{ display: animeert ? 'none' : undefined }}>
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

        <g style={{ display: animeert ? 'none' : undefined }}>
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

        {/* While the menu is open the field steps back, so the arc reads as a
            layer above the diagram instead of as part of it. The token you
            tapped stays bright: it is what you are working on. */}
        {toonScrim && <Scrim view={view} />}

        {toonScrim && geselecteerd?.type === 'player' && (
          <PlayerToken
            player={geselecteerd}
            view={view}
            radiusM={radiusM}
            hitRadiusM={hitM}
            stijl={doc.meta.tokenstijl}
            selected
          />
        )}
        {toonScrim && geselecteerd?.type === 'cone' && (
          <ConeToken
            cone={geselecteerd}
            view={view}
            radiusM={radiusM}
            hitRadiusM={hitM}
            selected
          />
        )}

        {kader && <KaderVlak kader={kader} view={view} metresPerPixel={metresPerPixel} />}

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
                actieveBocht={actieveBocht}
              />
            ))}
        </g>
      </svg>

      {menuOpen && !animeert && geselecteerd && anchor && (
        <SelectedEntityMenu
          key={geselecteerd.id}
          entity={geselecteerd}
          anchor={anchor}
          tokenRadiusPx={radiusM / metresPerPixel}
          canvas={{ breedte: canvasBreedte, hoogte: canvasHoogte }}
        />
      )}
    </div>
  )
}

function KaderVlak({
  kader,
  view,
  metresPerPixel,
}: {
  kader: Kader
  view: import('@/lib/field/geometry').FieldView
  metresPerPixel: number
}) {
  const a = toSvg({ x: kader.minX, y: kader.minY }, view)
  const b = toSvg({ x: kader.maxX, y: kader.maxY }, view)
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const breedte = Math.abs(b.x - a.x)
  const hoogte = Math.abs(b.y - a.y)
  // Roughly one and a bit CSS pixels, whatever the zoom does to the field.
  const dikte = UNITS_PER_METRE * metresPerPixel * 1.2

  return (
    <rect
      x={x}
      y={y}
      width={breedte}
      height={hoogte}
      fill="var(--accent)"
      fillOpacity={0.12}
      stroke="var(--accent)"
      strokeWidth={dikte}
      pointerEvents="none"
    />
  )
}

/** Dims the pitch itself, not the white margin around it. */
function Scrim({ view }: { view: import('@/lib/field/geometry').FieldView }) {
  const a = toSvg({ x: view.area.minX, y: view.area.minY }, view)
  const b = toSvg({ x: view.area.maxX, y: view.area.maxY }, view)
  return (
    <rect
      x={Math.min(a.x, b.x)}
      y={Math.min(a.y, b.y)}
      width={Math.abs(b.x - a.x)}
      height={Math.abs(b.y - a.y)}
      fill="var(--scrim)"
      pointerEvents="none"
    />
  )
}
