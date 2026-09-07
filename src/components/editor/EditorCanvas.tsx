'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatieLaag } from '@/components/field/AnimatieLaag'
import { ArrowHandles } from '@/components/field/ArrowHandles'
import { ArrowShape } from '@/components/field/ArrowShape'
import { FieldSurface } from '@/components/field/FieldSurface'
import { TextShape } from '@/components/field/TextShape'
import { ZoneHandles } from '@/components/field/ZoneHandles'
import { ZoneShape } from '@/components/field/ZoneShape'
import { ConeToken } from '@/components/field/tokens/ConeToken'
import { PlayerToken } from '@/components/field/tokens/PlayerToken'
import { frameOpTijd } from '@/lib/diagram/animation'
import {
  arrowEnd,
  snapThrowEnd,
  THROW_SNAP_M,
  verwijderBocht,
  voegBochtToe,
} from '@/lib/diagram/arrows'
import {
  herberekenSchijfVanaf,
  synchroniseerArrowMetVorigFrame,
  verplaatsVanaf,
  pasStatischAanVanaf,
  voegToeVanaf,
  volgWorpenNaar,
  worpAnkers,
} from '@/lib/diagram/propagatie'
import { ankerVan, createCone, createPlayer } from '@/lib/diagram/entities'
import { createText, createZone, MIN_ZONE_M, STANDAARD_ZONE_M, zoneKader } from '@/lib/diagram/zones'
import {
  isArrow,
  isPlayer,
  isText,
  isVergrendeld,
  isZone,
  type Point,
  type Side,
} from '@/lib/diagram/schema'
import { framesVan } from '@/lib/editor/document'
import {
  createView,
  klem,
  maakCamera,
  MAX_ZOOM,
  metresToUnits,
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
import { nl } from '@/lib/strings'
import { SelectedEntityMenu } from './SelectedEntityMenu'
import { TekstInvoer } from './TekstInvoer'
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
  /** Drawing a new zone: one corner is fixed, the other follows the finger. */
  | { soort: 'zoneTekenen'; id: string; anker: Point }
  /** Resizing an existing zone: the corner across from the one you grabbed. */
  | { soort: 'zoneHoek'; id: string; anker: Point }

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
  // Where a throw would land if you let go now. Without it a snap that missed by
  // half a metre is indistinguishable from one that caught.
  const [snapDoel, setSnapDoel] = useState<Point | null>(null)
  const [kader, setKader] = useState<Kader | null>(null)
  /**
   * Where a note is being typed, and which one.
   *
   * A text block with nothing in it is not a thing: it would be an invisible
   * entity on the field and an empty line in the export. So the block is only
   * created once there are words, and until then it lives here.
   */
  const [tekstInvoer, setTekstInvoer] = useState<
    { soort: 'tekst' | 'zoneLabel'; id: string | null; pos: Point; waarde: string } | null
  >(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  /**
   * Whether the next tap on empty grass should put something down.
   *
   * True right after you pick a tool, and after each thing you place: you are
   * placing players, so the next tap places the next one. False the moment you
   * tap something to select it — then a tap on the grass means "never mind" and
   * only clears the selection, which is what everybody expects and what it did
   * not do before.
   */
  const tikPlaatst = useRef(true)
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
  const setTool = useUiStore((s) => s.setTool)
  const setSleept = useUiStore((s) => s.setSleept)
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

  // Choosing a tool arms it: the first tap does what the tool says instead of
  // being spent dismissing whatever was still selected.
  useEffect(() => {
    tikPlaatst.current = true
  }, [tool])

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
    setSnapDoel(null)
    setKader(null)
    setMode('idle')
    setSleept(false)
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
      tikPlaatst.current = false

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

      const anker = ankerVan(entity)
      if (!anker) return

      // Pinned down. Selecting still works, so you can unlock it; a drag goes
      // through to the pitch and becomes a selection box.
      if (isVergrendeld(entity)) {
        if (event.shiftKey) toggle(entityId)
        else select([entityId])
        setMenuOpen(!event.shiftKey)
        drag.current = {
          doel: { soort: 'kader', startPunt: point },
          pointerId: event.pointerId,
          groupId: newId(),
          start: { x: event.clientX, y: event.clientY },
          moved: false,
        }
        svgRef.current?.setPointerCapture(event.pointerId)
        return
      }

      // Grabbing something that is already part of a multiple selection drags
      // the whole selection, and does not throw that selection away.
      const hoortBijSelectie = selection.has(entityId) && selection.size > 1

      if (event.shiftKey) toggle(entityId)
      else if (!hoortBijSelectie) select([entityId])

      // A corner of a selected zone resizes it, and the corner across from the
      // one you grabbed stays where it is.
      if (isZone(entity) && part?.startsWith('hoek-')) {
        const k = zoneKader(entity)
        const index = Number(part.split('-')[1])
        const tegenover = [
          { x: k.maxX, y: k.maxY },
          { x: k.minX, y: k.maxY },
          { x: k.minX, y: k.minY },
          { x: k.maxX, y: k.minY },
        ][index]
        if (tegenover) {
          setMenuOpen(false)
          beginSleep({ soort: 'zoneHoek', id: entityId, anker: tegenover })
          return
        }
      }

      setMenuOpen(!event.shiftKey && !hoortBijSelectie)
      beginSleep({
        soort: 'entiteit',
        id: entityId,
        offset: { x: anker.x - point.x, y: anker.y - point.y },
        groepIds: hoortBijSelectie ? [...selection] : [entityId],
      })
      return
    }

    if (tool === 'player' || tool === 'cone') {
      // Something you picked by hand is still selected: this tap lets it go and
      // puts nothing down.
      if (selection.size > 0 && !tikPlaatst.current) {
        clearSelection()
        // Cleared. The tap after this one puts something down again.
        tikPlaatst.current = true
        return
      }
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
      tikPlaatst.current = true
      select([id])
      setMenuOpen(true)
      return
    }

    if (tool === 'zone') {
      const start = maybeSnap(point, event.altKey)
      const id = newId()
      wijzigFrames('Zone tekenen', (frames) => {
        const huidig = frames[activeFrame]
        if (!huidig) return
        // Born with no size at all: the drag gives it one, and letting go
        // without dragging turns it into a default rectangle further down.
        const zone = createZone({
          id,
          shape: 'rect',
          van: start,
          tot: start,
          entities: huidig.entities,
        })
        voegToeVanaf(frames, activeFrame, zone)
      })
      select([id])
      setMenuOpen(false)
      drag.current = {
        doel: { soort: 'zoneTekenen', id, anker: start },
        pointerId: event.pointerId,
        groupId: newId(),
        start: { x: event.clientX, y: event.clientY },
        moved: false,
      }
      svgRef.current?.setPointerCapture(event.pointerId)
      return
    }

    if (tool === 'text') {
      // Stops the field from claiming the focus, so the little field that is
      // about to appear can keep it.
      event.preventDefault()
      clearSelection()
      setTekstInvoer({
        soort: 'tekst',
        id: null,
        pos: maybeSnap(point, event.altKey),
        waarde: '',
      })
      return
    }

    // Empty space with the select tool: drag a frame over the field.
    tikPlaatst.current = false
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
      // The floating controls on a phone step aside while you move something.
      setSleept(true)
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

    if (doel.soort === 'zoneTekenen' || doel.soort === 'zoneHoek') {
      const hoek = maybeSnap(ruw, event.altKey)
      wijzigFrames(
        doel.soort === 'zoneTekenen' ? 'Zone tekenen' : 'Zone bijstellen',
        (frames) => {
          // While you are dragging a corner, only this frame changes; when you
          // let go the finished shape is pushed forward to the frames after it.
          const zone = frames[activeFrame]?.entities.find((e) => e.id === doel.id)
          if (!zone || zone.type !== 'annotation') return
          zone.points = [{ ...doel.anker }, { ...hoek }]
        },
        state.groupId,
      )
      return
    }

    if (doel.soort === 'entiteit') {
      const pos = maybeSnap({ x: ruw.x + doel.offset.x, y: ruw.y + doel.offset.y }, event.altKey)
      const groep = doel.groepIds
      wijzigFrames(
        'Verplaatsen',
        (frames) => {
          const huidig = frames[activeFrame]
          if (!huidig) return
          const primair = huidig.entities.find((e) => e.id === doel.id)
          const anker = primair ? ankerVan(primair) : null
          if (!primair || !anker) return

          // Only the entity under the finger snaps to the grid; everything else
          // follows by exactly the same delta, so the shape of the selection
          // never distorts while you drag it.
          const delta = { x: pos.x - anker.x, y: pos.y - anker.y }
          if (delta.x === 0 && delta.y === 0) return

          for (const id of groep) {
            // A throw aimed at him was aimed at a person, not at a patch of
            // grass, so it comes along.
            volgWorpenNaar(huidig, id, worpAnkers(huidig, id), delta)
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

    let gevangen: Point | null = null

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
            // Keep the magnet about a fingertip wide however far you zoomed out.
            const bereik = Math.max(THROW_SNAP_M, metresPerPixel * 26)
            const { pos, targetId } = snapThrowEnd(gesnapt, list, arrow.ownerId, bereik)
            arrow.path.points[arrow.path.points.length - 1] = { ...pos }
            arrow.targetId = targetId
            gevangen = targetId ? { ...pos } : null
            // A different receiver means the disc lands somewhere else.
            herberekenSchijfVanaf(frames, activeFrame)
          } else {
            // A cut ends in open space, so it never locks onto a player.
            arrow.path.points[arrow.path.points.length - 1] = gesnapt
            arrow.targetId = undefined
            const nieuwEinde = arrowEnd(arrow)
            const verzet = {
              x: nieuwEinde.x - oudEinde.x,
              y: nieuwEinde.y - oudEinde.y,
            }
            // A throw aimed at the end of this cut keeps aiming at it.
            const huidig = frames[activeFrame]
            if (huidig) volgWorpenNaar(huidig, arrow.ownerId, [oudEinde], verzet)
            verplaatsVanaf(frames, activeFrame + 1, arrow.ownerId, verzet)
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

    if (doel.soort === 'tip') setSnapDoel(gevangen)

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

    const doel = state.doel
    if (doel.soort === 'zoneTekenen' || doel.soort === 'zoneHoek') {
      rondZoneAf(doel.id, doel.soort === 'zoneTekenen' && !state.moved, state.groupId)
      if (doel.soort === 'zoneTekenen') {
        // One zone per press of the button. You draw one and then work on it;
        // leaving the tool armed meant every tap meant to deselect drew another.
        setMenuOpen(true)
        setTool('select')
      }
    }

    stopSleep()
  }

  /**
   * Gives a zone its final shape and hands that shape to the frames after this
   * one.
   *
   * Two things happen here rather than during the drag. A tap that never moved
   * gets a region you can actually see and grab, instead of a shape of nothing
   * that leaves you hunting for a handle. And the corners are only pushed
   * forward once, on release, so a drag of fifty moves does not rewrite four
   * frames fifty times.
   */
  function rondZoneAf(id: string, wasTik: boolean, groupId: string) {
    wijzigFrames(
      'Zone',
      (frames) => {
        const zone = frames[activeFrame]?.entities.find((e) => e.id === id)
        if (!zone || zone.type !== 'annotation') return

        const k = zoneKader(zone)
        if (wasTik || k.maxX - k.minX < MIN_ZONE_M || k.maxY - k.minY < MIN_ZONE_M) {
          const midden = { x: (k.minX + k.maxX) / 2, y: (k.minY + k.maxY) / 2 }
          zone.points = [
            { x: midden.x - STANDAARD_ZONE_M.breedte / 2, y: midden.y - STANDAARD_ZONE_M.hoogte / 2 },
            { x: midden.x + STANDAARD_ZONE_M.breedte / 2, y: midden.y + STANDAARD_ZONE_M.hoogte / 2 },
          ]
        }

        const punten = zone.points.map((p) => ({ ...p }))
        pasStatischAanVanaf(frames, activeFrame + 1, id, (entity) => {
          if (entity.type === 'annotation') entity.points = punten.map((p) => ({ ...p }))
        })
      },
      groupId,
    )
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
  // Scenery. It is drawn from whichever frame is on screen, playing or not, and
  // never interpolated: a zone that slides across the pitch during playback
  // would look like it means something.
  const toonFrame = animeert ? frameOpTijd(duren, tijdMs).index : activeFrame
  const statisch = doc.frames[toonFrame]?.content.entities ?? entities
  const zones = statisch.filter(isZone)
  const teksten = statisch.filter(isText)

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
      : (() => {
          // A zone has no position of its own; its menu hangs over its middle.
          const anker = ankerVan(geselecteerd)
          return anker ? toScreenPx(anker, view, metresPerPixel, camera.origin) : null
        })()
    : null

  /**
   * Turns what was typed into a note, or updates the one being edited.
   *
   * Nothing is created for an empty field. A text block with no words in it is
   * an invisible entity on the field and a blank line in the export, and the
   * only way to find it again would be to drag a box over the whole pitch.
   */
  function bewaarTekst() {
    const invoer = tekstInvoer
    if (!invoer) return
    const inhoud = invoer.waarde.trim()
    setTekstInvoer(null)

    if (invoer.soort === 'zoneLabel') {
      if (!invoer.id) return
      const naam = inhoud.slice(0, 40)
      wijzigFrames(nl.zone.label, (frames) => {
        pasStatischAanVanaf(frames, activeFrame, invoer.id!, (entity) => {
          if (entity.type === 'annotation') entity.label = naam || undefined
        })
      })
      return
    }

    if (inhoud.length === 0) return

    if (invoer.id) {
      wijzigFrames('Tekst bewerken', (frames) => {
        pasStatischAanVanaf(frames, activeFrame, invoer.id!, (entity) => {
          if (entity.type === 'text') entity.content = inhoud
        })
      })
      return
    }

    const id = newId()
    wijzigFrames('Tekst plaatsen', (frames) => {
      const huidig = frames[activeFrame]
      if (!huidig) return
      voegToeVanaf(
        frames,
        activeFrame,
        createText({ id, pos: invoer.pos, content: inhoud, entities: huidig.entities }),
      )
    })
    select([id])
    setMenuOpen(true)
    // One note per press of the button, for the same reason a zone is: with the
    // tool still armed, every tap meant to deselect wrote a new note.
    setTool('select')
  }

  const opZ = <T extends { z: number }>(list: T[]) => list.slice().sort((a, b) => a.z - b.z)

  const canvasBreedte = camera.width / UNITS_PER_METRE / metresPerPixel
  const canvasHoogte = camera.height / UNITS_PER_METRE / metresPerPixel
  const toonScrim = menuOpen && geselecteerd !== undefined && !animeert

  return (
    <div className="canvas-wrap">
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

        <g>
          {opZ(zones).map((zone) => (
            <ZoneShape
              key={zone.id}
              zone={zone}
              view={view}
              hitRadiusM={hitM}
              selected={!animeert && selection.has(zone.id)}
            />
          ))}
        </g>

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

        {snapDoel && (
          <circle
            cx={toSvg(snapDoel, view).x}
            cy={toSvg(snapDoel, view).y}
            r={metresToUnits(radiusM * 1.55)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={metresToUnits(radiusM * 0.16)}
            opacity={0.95}
            pointerEvents="none"
          />
        )}

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

        <g>
          {opZ(teksten).map((blok) => (
            <TextShape
              key={blok.id}
              blok={blok}
              view={view}
              hitRadiusM={hitM}
              selected={!animeert && selection.has(blok.id)}
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
        {toonScrim && geselecteerd?.type === 'annotation' && (
          <ZoneShape zone={geselecteerd} view={view} hitRadiusM={hitM} selected />
        )}
        {toonScrim && geselecteerd?.type === 'text' && (
          <TextShape blok={geselecteerd} view={view} hitRadiusM={hitM} selected />
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
          {!animeert &&
            zones
              .filter((z) => selection.has(z.id) && !z.vergrendeld)
              .map((zone) => (
                <ZoneHandles
                  key={zone.id}
                  zone={zone}
                  view={view}
                  hitRadiusM={hitM}
                  tokenRadiusM={radiusM}
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
                actieveBocht={actieveBocht}
              />
            ))}
        </g>
      </svg>

      {tekstInvoer && !animeert && (
        <TekstInvoer
          anker={toScreenPx(tekstInvoer.pos, view, metresPerPixel, camera.origin)}
          vraag={tekstInvoer.soort === 'zoneLabel' ? nl.zone.labelVraag : nl.tekst.vraag}
          plaatshouder={
            tekstInvoer.soort === 'zoneLabel' ? nl.zone.labelPlaceholder : nl.tekst.placeholder
          }
          leegMag={tekstInvoer.soort === 'zoneLabel'}
          waarde={tekstInvoer.waarde}
          onWijzig={(waarde) => setTekstInvoer((vorig) => (vorig ? { ...vorig, waarde } : vorig))}
          onAnnuleer={() => setTekstInvoer(null)}
          onBewaar={() => bewaarTekst()}
        />
      )}

      {menuOpen && !animeert && geselecteerd && anchor && (
        <SelectedEntityMenu
          key={geselecteerd.id}
          entity={geselecteerd}
          anchor={anchor}
          tokenRadiusPx={radiusM / metresPerPixel}
          canvas={{ breedte: canvasBreedte, hoogte: canvasHoogte }}
          onTekstBewerken={() => {
            if (geselecteerd.type === 'text') {
              setTekstInvoer({
                soort: 'tekst',
                id: geselecteerd.id,
                pos: geselecteerd.pos,
                waarde: geselecteerd.content,
              })
              return
            }
            if (geselecteerd.type === 'annotation') {
              const k = zoneKader(geselecteerd)
              setTekstInvoer({
                soort: 'zoneLabel',
                id: geselecteerd.id,
                pos: { x: (k.minX + k.maxX) / 2, y: k.minY },
                waarde: geselecteerd.label ?? '',
              })
            }
          }}
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
