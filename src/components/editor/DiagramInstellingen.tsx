'use client'

import { categorieenVoor, type DiagramType, type Tokenstijl } from '@/lib/diagram/schema'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { nl } from '@/lib/strings'

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

export function DiagramInstellingen() {
  const meta = useDiagramStore((s) => s.doc.meta)
  const change = useDiagramStore((s) => s.change)

  return (
    <>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={labelStijl}>{nl.instellingen.type}</span>
        <select
          style={veld}
          value={meta.type ?? ''}
          onChange={(e) => {
            const type = (e.target.value || null) as DiagramType | null
            change(nl.instellingen.type, (draft) => {
              draft.meta.type = type
              // The two lists of categories share nothing, so a category from
              // the other kind cannot stay.
              draft.meta.categorie = null
            })
          }}
        >
          <option value="">{nl.instellingen.kies}</option>
          <option value="speelvariant">{nl.instellingen.speelvariant}</option>
          <option value="drill">{nl.instellingen.drill}</option>
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={labelStijl}>{nl.instellingen.categorie}</span>
        <select
          style={veld}
          disabled={!meta.type}
          value={meta.categorie ?? ''}
          onChange={(e) => {
            const categorie = e.target.value || null
            change(nl.instellingen.categorie, (draft) => {
              draft.meta.categorie = categorie
            })
          }}
        >
          <option value="">{nl.instellingen.kies}</option>
          {meta.type &&
            categorieenVoor(meta.type).map((categorie) => (
              <option key={categorie} value={categorie}>
                {categorie}
              </option>
            ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={labelStijl}>{nl.instellingen.tokenstijl}</span>
        <select
          style={veld}
          value={meta.tokenstijl}
          onChange={(e) => {
            const tokenstijl = e.target.value as Tokenstijl
            change(nl.instellingen.tokenstijl, (draft) => {
              draft.meta.tokenstijl = tokenstijl
            })
          }}
        >
          <option value="letters">{nl.instellingen.letters}</option>
          <option value="xo">{nl.instellingen.xo}</option>
          <option value="blanco">{nl.instellingen.blanco}</option>
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end', minHeight: 40 }}>
        <input
          type="checkbox"
          checked={meta.draft}
          onChange={(e) => {
            const draftVlag = e.target.checked
            change(nl.instellingen.concept, (draft) => {
              draft.meta.draft = draftVlag
            })
          }}
          style={{ width: 18, height: 18 }}
        />
        <span style={{ fontSize: '0.8125rem' }}>{nl.instellingen.conceptUitleg}</span>
      </label>
    </>
  )
}
