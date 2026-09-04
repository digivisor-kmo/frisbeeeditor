'use client'

import { useState } from 'react'
import { paintFor } from '@/components/field/tokens/colors'
import { ARROW_LABELS } from '@/lib/diagram/arrows'
import { ROLE_LABELS, rolesFor, rotationFor } from '@/lib/diagram/roles'
import {
  isPlayer,
  TOKEN_COLORS,
  type ArrowKind,
  type Entity,
  type Player,
  type PlayerRole,
  type Side,
  type TokenColor,
} from '@/lib/diagram/schema'
import { dupliceer } from '@/lib/editor/duplicate'
import { useDiagramStore } from '@/lib/editor/diagramStore'
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

const knop = (actief: boolean, uitgeschakeld = false): React.CSSProperties => ({
  font: 'inherit',
  fontSize: '0.8125rem',
  fontWeight: actief ? 600 : 400,
  minHeight: 40,
  padding: '0 0.75rem',
  borderRadius: 'var(--radius)',
  border: `1px solid ${actief ? 'var(--accent)' : 'var(--border)'}`,
  background: actief ? 'var(--accent-zacht)' : 'var(--surface-raised)',
  color: 'var(--text)',
  cursor: uitgeschakeld ? 'not-allowed' : 'pointer',
  opacity: uitgeschakeld ? 0.5 : 1,
})

const veld: React.CSSProperties = {
  font: 'inherit',
  fontSize: '0.8125rem',
  minHeight: 40,
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  background: 'var(--surface-raised)',
  color: 'var(--text)',
  padding: '0 0.5rem',
}

const labelStijl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
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

  const gedeeldeKant = gedeeld(spelers.map((p) => p.side))
  const gedeeldeRol = gedeeld(spelers.map((p) => p.role))
  const gedeeldeKleur = gedeeld(
    metKleur.map((e) => (e.type === 'player' || e.type === 'cone' ? e.color : 'standaard')),
  )
  const gedeeldType = gedeeld(arrows.map((a) => (a.type === 'arrow' ? a.kind : 'cut')))

  return (
    <section
      aria-label={nl.bulk.titel}
      style={{
        marginTop: '0.75rem',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.75rem',
        display: 'grid',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
        {(['alles', 'player', 'cone', 'arrow'] as Filter[])
          .filter((f) => f === 'alles' || tellers[f] > 0)
          .map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} style={knop(actief === f)}>
              {FILTER_LABELS[f]} {tellers[f]}
            </button>
          ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.375rem' }}>
          <button type="button" onClick={clearSelection} style={knop(false)}>
            {nl.bulk.deselecteren}
          </button>
          <button
            type="button"
            onClick={() => {
              const nieuw: string[] = []
              change(nl.bulk.dupliceren, (draft) => {
                const content = draft.frames[activeFrame]?.content
                if (!content) return
                const { kopieen, nieuweIds } = dupliceer(content.entities, doelIds, newId)
                content.entities.push(...kopieen)
                nieuw.push(...nieuweIds)
              })
              if (nieuw.length > 0) select(nieuw)
            }}
            style={knop(false)}
          >
            {nl.bulk.dupliceren}
          </button>
          <button
            type="button"
            onClick={() => {
              change(nl.bulk.verwijderen, (draft) => {
                const content = draft.frames[activeFrame]?.content
                if (!content) return
                content.entities = content.entities.filter(
                  (e) => !doelIds.has(e.id) && !(e.type === 'arrow' && doelIds.has(e.ownerId)),
                )
              })
              clearSelection()
            }}
            style={{
              ...knop(false),
              color: 'var(--waarschuwing)',
              borderColor: 'var(--waarschuwing)',
            }}
          >
            {nl.bulk.verwijderen}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.625rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '0.75rem',
        }}
      >
        {spelers.length > 0 && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={labelStijl}>{nl.menu.kant}</span>
            <select
              style={veld}
              value={gedeeldeKant ?? GEMENGD}
              onChange={(e) => {
                const side = e.target.value as Side
                if (side !== 'offense' && side !== 'defense') return
                wijzigDoelen(nl.menu.kant, (entity) => {
                  if (entity.type !== 'player') return
                  entity.side = side
                  entity.role = rotationFor(side)[0]!
                })
              }}
            >
              {gedeeldeKant === null && <option value={GEMENGD}>{nl.bulk.gemengd}</option>}
              <option value="offense">{nl.editor.aanval}</option>
              <option value="defense">{nl.editor.verdediging}</option>
            </select>
          </label>
        )}

        {spelers.length > 0 && gedeeldeKant !== null && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={labelStijl}>{nl.menu.positie}</span>
            <select
              style={veld}
              value={gedeeldeRol ?? GEMENGD}
              onChange={(e) => {
                const role = e.target.value as PlayerRole
                if (role === (GEMENGD as unknown as PlayerRole)) return
                wijzigDoelen(nl.menu.positie, (entity) => {
                  if (entity.type === 'player') (entity as Player).role = role
                })
              }}
            >
              {gedeeldeRol === null && <option value={GEMENGD}>{nl.bulk.gemengd}</option>}
              {rolesFor(gedeeldeKant).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
        )}

        {arrows.length > 0 && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={labelStijl}>{nl.bulk.arrowtype}</span>
            <select
              style={veld}
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
            </select>
          </label>
        )}

        {metKleur.length > 0 && (
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={labelStijl}>
              {nl.menu.kleur}
              {gedeeldeKleur === null ? ` · ${nl.bulk.gemengd}` : ''}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {TOKEN_COLORS.map((color: TokenColor) => (
                <button
                  key={color}
                  type="button"
                  title={nl.kleuren[color]}
                  aria-label={nl.kleuren[color]}
                  onClick={() =>
                    wijzigDoelen(nl.menu.kleur, (entity) => {
                      if (entity.type === 'player' || entity.type === 'cone') entity.color = color
                    })
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: paintFor(color, 'offense').fill,
                    border:
                      gedeeldeKleur === color
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border)',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
