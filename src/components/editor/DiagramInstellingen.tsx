'use client'

import { Aanvink, Keuze, VeldRij } from '@/components/ui/Veld'
import { categorieenVoor, type DiagramType, type Tokenstijl } from '@/lib/diagram/schema'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { nl } from '@/lib/strings'

export function DiagramInstellingen() {
  const meta = useDiagramStore((s) => s.doc.meta)
  const change = useDiagramStore((s) => s.change)

  return (
    <>
      <VeldRij label={nl.instellingen.type}>
        <Keuze
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
        </Keuze>
      </VeldRij>

      <VeldRij label={nl.instellingen.categorie}>
        <Keuze
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
        </Keuze>
      </VeldRij>

      <VeldRij label={nl.instellingen.tokenstijl}>
        <Keuze
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
        </Keuze>
      </VeldRij>

      <Aanvink
        label={nl.instellingen.conceptUitleg}
        checked={meta.draft}
        onChange={(waarde) =>
          change(nl.instellingen.concept, (draft) => {
            draft.meta.draft = waarde
          })
        }
      />
    </>
  )
}
