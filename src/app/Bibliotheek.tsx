'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DiagramThumbnail } from '@/components/field/DiagramThumbnail'
import { Knop } from '@/components/ui/Knop'
import { Invoer, Keuze } from '@/components/ui/Veld'
import { verwijderDiagram, zetFavoriet } from '@/lib/data/diagrams'
import {
  categorieenIn,
  filterDiagrammen,
  isLeeg,
  LEEG_FILTER,
  type Filter,
  type Soort,
} from '@/lib/data/bibliotheek'
import type { FrameContent, Weergave } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'
import { SterIcon, TrashIcon } from '@/components/editor/icons'

export interface BibliotheekItem {
  id: string
  naam: string
  type: string | null
  categorie: string | null
  tags: string[]
  weergave: string
  draft: boolean
  favoriet: boolean
  gewijzigd_op: string
  voorbeeld: FrameContent | null
}

const SOORTEN: { id: Soort; label: string }[] = [
  { id: 'alles', label: nl.bibliotheek.alles },
  { id: 'speelvariant', label: nl.bibliotheek.speelvarianten },
  { id: 'drill', label: nl.bibliotheek.drills },
  { id: 'favoriet', label: nl.bibliotheek.favorieten },
]

function datum(waarde: string): string {
  return new Date(waarde).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function Bibliotheek({
  items,
  magBewerken,
}: {
  items: BibliotheekItem[]
  magBewerken: boolean
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>(LEEG_FILTER)
  const [lokaal, setLokaal] = useState(items)
  const [bevestigt, setBevestigt] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  const zichtbaar = useMemo(() => filterDiagrammen(lokaal, filter), [lokaal, filter])
  const categorieen = useMemo(() => categorieenIn(lokaal, filter.soort), [lokaal, filter.soort])

  const kiesSoort = (soort: Soort) =>
    // A category from the other kind would leave you staring at nothing.
    setFilter((huidig) => ({ ...huidig, soort, categorie: null }))

  const wisselFavoriet = async (item: BibliotheekItem) => {
    const nieuw = !item.favoriet
    setLokaal((lijst) => lijst.map((d) => (d.id === item.id ? { ...d, favoriet: nieuw } : d)))
    setFout(null)
    try {
      await zetFavoriet(item.id, nieuw)
    } catch (error) {
      // Put the star back rather than leave a lie on the screen.
      setLokaal((lijst) => lijst.map((d) => (d.id === item.id ? { ...d, favoriet: !nieuw } : d)))
      setFout(error instanceof Error ? error.message : String(error))
    }
  }

  const verwijder = async (id: string) => {
    setBezig(id)
    setFout(null)
    try {
      await verwijderDiagram(id)
      setLokaal((lijst) => lijst.filter((d) => d.id !== id))
      setBevestigt(null)
      router.refresh()
    } catch (error) {
      setFout(`${nl.bibliotheek.verwijderenFout} ${error instanceof Error ? error.message : error}`)
    } finally {
      setBezig(null)
    }
  }

  return (
    <>
      <div className="bib-balk">
        <Invoer
          type="search"
          aria-label={nl.bibliotheek.zoeken}
          placeholder={nl.bibliotheek.zoekenPlaceholder}
          value={filter.zoek}
          onChange={(e) => setFilter((huidig) => ({ ...huidig, zoek: e.target.value }))}
        />

        <div className="btn-groep">
          {SOORTEN.map((soort) => (
            <Knop
              key={soort.id}
              klein
              actief={filter.soort === soort.id}
              onClick={() => kiesSoort(soort.id)}
            >
              {soort.label}
            </Knop>
          ))}
        </div>

        {categorieen.length > 1 && (
          <Keuze
            aria-label={nl.instellingen.categorie}
            value={filter.categorie ?? ''}
            onChange={(e) =>
              setFilter((huidig) => ({ ...huidig, categorie: e.target.value || null }))
            }
            style={{ maxWidth: '13rem' }}
          >
            <option value="">{nl.bibliotheek.alleCategorieen}</option>
            {categorieen.map((categorie) => (
              <option key={categorie} value={categorie}>
                {categorie}
              </option>
            ))}
          </Keuze>
        )}

        <span className="stil" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {nl.bibliotheek.aantal(zichtbaar.length)}
        </span>
      </div>

      {fout && (
        <p className="melding melding--fout" role="alert">
          {fout}
        </p>
      )}

      {zichtbaar.length === 0 ? (
        <div className="kaart leeg-kaart">
          <p className="kop">{nl.bibliotheek.geenTreffers}</p>
          <p className="stil">{nl.bibliotheek.geenTreffersUitleg}</p>
          {!isLeeg(filter) && (
            <div>
              <Knop klein onClick={() => setFilter(LEEG_FILTER)}>
                {nl.bibliotheek.filtersWissen}
              </Knop>
            </div>
          )}
        </div>
      ) : (
        <ul className="bib-raster">
          {zichtbaar.map((item) => (
            <li key={item.id} className="kaart bib-kaart">
              <Link href={`/editor/${item.id}`} className="bib-link">
                <div className="bib-voorbeeld">
                  <div
                    style={{
                      maxWidth: item.weergave === 'half' ? '7.5rem' : undefined,
                      margin: '0 auto',
                    }}
                  >
                    {item.voorbeeld ? (
                      <DiagramThumbnail
                        content={item.voorbeeld}
                        weergave={item.weergave as Weergave}
                      />
                    ) : (
                      <div style={{ aspectRatio: '2.5', display: 'grid', placeItems: 'center' }}>
                        <span className="stil">{nl.bibliotheek.geenVoorbeeld}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bib-tekst">
                  <span className="bib-naam">
                    {item.naam.trim() === '' ? nl.bibliotheek.geenNaam : item.naam}
                  </span>
                  <span className="stil" style={{ fontSize: 'var(--tekst-xs)' }}>
                    {[item.type, item.categorie].filter(Boolean).join(' · ') || '—'} ·{' '}
                    {datum(item.gewijzigd_op)}
                    {item.draft ? ` · ${nl.bibliotheek.concept}` : ''}
                  </span>
                </div>
              </Link>

              {magBewerken && (
                <div className="bib-acties">
                  <button
                    type="button"
                    className={`bib-ster${item.favoriet ? ' bib-ster--aan' : ''}`}
                    aria-pressed={item.favoriet}
                    title={item.favoriet ? nl.bibliotheek.favorietUit : nl.bibliotheek.favorietAan}
                    aria-label={
                      item.favoriet ? nl.bibliotheek.favorietUit : nl.bibliotheek.favorietAan
                    }
                    onClick={() => void wisselFavoriet(item)}
                  >
                    <SterIcon gevuld={item.favoriet} />
                  </button>
                  <button
                    type="button"
                    className="bib-ster bib-ster--gevaar"
                    title={nl.bibliotheek.verwijderen}
                    aria-label={nl.bibliotheek.verwijderen}
                    onClick={() => setBevestigt(item.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}

              {bevestigt === item.id && (
                <div className="bib-bevestig">
                  <p>{nl.bibliotheek.verwijderenVraag}</p>
                  <strong>{item.naam.trim() === '' ? nl.bibliotheek.geenNaam : item.naam}</strong>
                  <div style={{ display: 'flex', gap: 'var(--ruimte-2)' }}>
                    <Knop
                      klein
                      variant="gevaar"
                      disabled={bezig === item.id}
                      onClick={() => void verwijder(item.id)}
                    >
                      {bezig === item.id
                        ? nl.bibliotheek.verwijderenBezig
                        : nl.bibliotheek.verwijderenJa}
                    </Knop>
                    <Knop klein onClick={() => setBevestigt(null)}>
                      {nl.bibliotheek.annuleren}
                    </Knop>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
