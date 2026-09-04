'use client'

import { useState } from 'react'
import { paintFor } from '@/components/field/tokens/colors'
import { Knop } from '@/components/ui/Knop'
import { Keuze, VeldRij } from '@/components/ui/Veld'
import { ARROW_LABELS } from '@/lib/diagram/arrows'
import { ROLE_LABELS, rolesFor, rotationFor } from '@/lib/diagram/roles'
import {
  arrowVerplaatsing,
  herberekenSchijfVanaf,
  verplaatsVanaf,
  verwijderVanaf,
  voegToeVanaf,
  zetIdentiteit,
  type Identiteit,
} from '@/lib/diagram/propagatie'
import {
  isPlayer,
  TOKEN_COLORS,
  type ArrowKind,
  type Entity,
  type FrameContent,
  type PlayerRole,
  type Side,
  type TokenColor,
} from '@/lib/diagram/schema'
import { dupliceer } from '@/lib/editor/duplicate'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { framesVan } from '@/lib/editor/document'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

type Filter = 'alles' | 'player' | 'cone' | 'arrow'

const FILTER_LABELS: Record<Filter, string> = {
  alles: nl.bulk.alles,
  player: nl.bulk.spelers,
  cone: nl.bulk.pionnen,
  arrow: nl.bulk.arrows,
}

const GEMENGD = '__gemengd__'

/** The one value they all share, or null when they differ. */
function gedeeld<T>(waarden: T[]): T | null {
  if (waarden.length === 0) return null
  const eerste = waarden[0]!
  return waarden.every((w) => w === eerste) ? eerste : null
}

export function BulkPaneel({ entities }: { entities: readonly Entity[] }) {
  const selection = useUiStore((s) => s.selection)
  const select = useUiStore((s) => s.select)
  const clearSelection = useUiStore((s) => s.clearSelection)
  const activeFrame = useUiStore((s) => s.activeFrame)
  const change = useDiagramStore((s) => s.change)

  const [filter, setFilter] = useState<Filter>('alles')

  const geselecteerd = entities.filter((e) => selection.has(e.id))
  if (geselecteerd.length < 2) return null

  const tellers: Record<Filter, number> = {
    alles: geselecteerd.length,
    player: geselecteerd.filter((e) => e.type === 'player').length,
    cone: geselecteerd.filter((e) => e.type === 'cone').length,
    arrow: geselecteerd.filter((e) => e.type === 'arrow').length,
  }

  const actief = tellers[filter] > 0 ? filter : 'alles'
  const doelen = actief === 'alles' ? geselecteerd : geselecteerd.filter((e) => e.type === actief)
  const doelIds = new Set(doelen.map((e) => e.id))

  const spelers = doelen.filter(isPlayer)
  const metKleur = doelen.filter((e) => e.type === 'player' || e.type === 'cone')
  const arrows = doelen.filter((e) => e.type === 'arrow')

  const wijzigDoelen = (label: string, recipe: (entity: Entity) => void) =>
    change(label, (draft) => {
      const content = draft.frames[activeFrame]?.content
      if (!content) return
      for (const entity of content.entities) if (doelIds.has(entity.id)) recipe(entity)
    })

  const wijzigFrames = (label: string, recipe: (frames: FrameContent[]) => void) =>
    change(label, (draft) => recipe(framesVan(draft)))

  /** Who they are, not where they stand: lands in every frame at once. */
  const zetIdentiteitVanDoelen = (label: string, patch: Identiteit) =>
    wijzigFrames(label, (frames) => {
      for (const id of doelIds) zetIdentiteit(frames, id, patch)
    })

  const gedeeldeKant = gedeeld(spelers.map((p) => p.side))
  const gedeeldeRol = gedeeld(spelers.map((p) => p.role))
  const gedeeldeKleur = gedeeld(
    metKleur.map((e) => (e.type === 'player' || e.type === 'cone' ? e.color : 'standaard')),
  )
  const gedeeldType = gedeeld(arrows.map((a) => (a.type === 'arrow' ? a.kind : 'cut')))

  return (
    <section
      aria-label={nl.bulk.titel}
      className="kaart"
      style={{
        marginTop: 'var(--ruimte-3)',
        padding: 'var(--ruimte-3)',
        display: 'grid',
        gap: 'var(--ruimte-3)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ruimte-2)', alignItems: 'center' }}>
        <div className="btn-groep">
          {(['alles', 'player', 'cone', 'arrow'] as Filter[])
            .filter((f) => f === 'alles' || tellers[f] > 0)
            .map((f) => (
              <Knop key={f} klein actief={actief === f} onClick={() => setFilter(f)}>
                {FILTER_LABELS[f]} {tellers[f]}
              </Knop>
            ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--ruimte-2)' }}>
          <Knop klein onClick={clearSelection}>
            {nl.bulk.deselecteren}
          </Knop>
          <Knop
            klein
            onClick={() => {
              const nieuw: string[] = []
              wijzigFrames(nl.bulk.dupliceren, (frames) => {
                const content = frames[activeFrame]
                if (!content) return
                const { kopieen, nieuweIds } = dupliceer(content.entities, doelIds, newId)
                for (const kopie of kopieen) voegToeVanaf(frames, activeFrame, kopie)
                nieuw.push(...nieuweIds)
              })
              if (nieuw.length > 0) select(nieuw)
            }}
          >
            {nl.bulk.dupliceren}
          </Knop>
          <Knop
            klein
            variant="gevaar"
            onClick={() => {
              wijzigFrames(nl.bulk.verwijderen, (frames) => {
                const content = frames[activeFrame]
                if (!content) return
                // An arrow that goes carries nobody: its owner stays put from here on.
                for (const entity of content.entities) {
                  if (entity.type !== 'arrow' || !doelIds.has(entity.id)) continue
                  if (doelIds.has(entity.ownerId)) continue
                  const delta = arrowVerplaatsing(content, entity)
                  if (delta) {
                    verplaatsVanaf(frames, activeFrame + 1, entity.ownerId, {
                      x: -delta.x,
                      y: -delta.y,
                    })
                  }
                }
                verwijderVanaf(frames, activeFrame, doelIds)
                herberekenSchijfVanaf(frames, activeFrame)
              })
              clearSelection()
            }}
          >
            {nl.bulk.verwijderen}
          </Knop>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 'var(--ruimte-3)',
          borderTop: '1px solid var(--border)',
          paddingTop: 'var(--ruimte-3)',
        }}
      >
        {spelers.length > 0 && (
          <VeldRij label={nl.menu.kant}>
            <Keuze
              value={gedeeldeKant ?? GEMENGD}
              onChange={(e) => {
                const side = e.target.value as Side
                if (side !== 'offense' && side !== 'defense') return
                zetIdentiteitVanDoelen(nl.menu.kant, {
                  side,
                  // Offence and defence have entirely separate position lists.
                  role: rotationFor(side)[0]!,
                })
              }}
            >
              {gedeeldeKant === null && <option value={GEMENGD}>{nl.bulk.gemengd}</option>}
              <option value="offense">{nl.editor.aanval}</option>
              <option value="defense">{nl.editor.verdediging}</option>
            </Keuze>
          </VeldRij>
        )}

        {spelers.length > 0 && gedeeldeKant !== null && (
          <VeldRij label={nl.menu.positie}>
            <Keuze
              value={gedeeldeRol ?? GEMENGD}
              onChange={(e) => {
                const role = e.target.value as PlayerRole
                if (e.target.value === GEMENGD) return
                zetIdentiteitVanDoelen(nl.menu.positie, { role })
              }}
            >
              {gedeeldeRol === null && <option value={GEMENGD}>{nl.bulk.gemengd}</option>}
              {rolesFor(gedeeldeKant).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Keuze>
          </VeldRij>
        )}

        {arrows.length > 0 && (
          <VeldRij label={nl.bulk.arrowtype}>
            <Keuze
              value={gedeeldType ?? GEMENGD}
              onChange={(e) => {
                const kind = e.target.value as ArrowKind
                if (kind !== 'cut' && kind !== 'juke') return
                wijzigDoelen(nl.menu.typeWisselen, (entity) => {
                  if (entity.type !== 'arrow' || entity.kind === 'throw') return
                  entity.kind = kind
                })
              }}
            >
              {gedeeldType === null && <option value={GEMENGD}>{nl.bulk.gemengd}</option>}
              <option value="cut">{ARROW_LABELS.cut}</option>
              <option value="juke">{ARROW_LABELS.juke}</option>
            </Keuze>
          </VeldRij>
        )}

        {metKleur.length > 0 && (
          <div>
            <span className="veld-label">
              {nl.menu.kleur}
              {gedeeldeKleur === null ? ` · ${nl.bulk.gemengd}` : ''}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {TOKEN_COLORS.map((color: TokenColor) => (
                <button
                  key={color}
                  type="button"
                  className="kleurstaal"
                  title={nl.kleuren[color]}
                  aria-label={nl.kleuren[color]}
                  aria-pressed={gedeeldeKleur === color}
                  onClick={() =>
                    zetIdentiteitVanDoelen(nl.menu.kleur, { color })
                  }
                  style={{ background: paintFor(color, 'offense').fill }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
