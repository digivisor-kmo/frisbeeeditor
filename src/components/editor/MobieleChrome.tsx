'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Knop } from '@/components/ui/Knop'
import { Aanvink } from '@/components/ui/Veld'
import { DEFAULT_FRAME_DURATION_MS } from '@/lib/editor/document'
import { kanFrameToevoegen, MAX_FRAMES } from '@/lib/diagram/frames'
import type { Side } from '@/lib/diagram/schema'
import { canRedo, canUndo, useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore, type Tool } from '@/lib/editor/uiStore'
import type { BewaarStatus } from '@/lib/editor/useAutosave'
import { watOntbreekt } from '@/lib/editor/validatie'
import { nl } from '@/lib/strings'
import { Afspeelinstellingen } from './Afspeelinstellingen'
import { BewaarStatusLabel } from './BewaarStatus'
import { DeelKnop } from './DeelKnop'
import { DiagramInstellingen } from './DiagramInstellingen'
import {
  CursorIcon,
  KopieIcon,
  OngedaanIcon,
  OpnieuwIcon,
  PauzeIcon,
  PionIcon,
  PlusIcon,
  SchuivenIcon,
  SpeelIcon,
  SpelerIcon,
  TerugIcon,
  TrashIcon,
  VerderIcon,
} from './icons'
import { OccupancyCounter } from './OccupancyCounter'

const TOOLS: { id: Tool; label: string; icoon: React.ReactNode }[] = [
  { id: 'select', label: nl.editor.selecteren, icoon: <CursorIcon /> },
  { id: 'player', label: nl.editor.speler, icoon: <SpelerIcon /> },
  { id: 'cone', label: nl.editor.pion, icoon: <PionIcon /> },
]

const DUUR_STAPPEN = [750, 1000, 1500, 2000, 3000]

interface Props {
  kant: Side
  setKant: (side: Side) => void
  status: BewaarStatus
  fout: string | null
  diagramId: string | null
}

/**
 * The editor on a phone: the field takes the whole screen and the controls
 * float on top of it in pills.
 *
 * Everything you touch while drawing is one tap away; everything you set once
 * lives in the sheet behind the slider button. The pills fade out of the way on
 * their own while you drag something, and a tab at the bottom edge folds them
 * away entirely when you want to look at the field and nothing else.
 */
export function MobieleChrome({ kant, setKant, status, fout, diagramId }: Props) {
  const [blad, setBlad] = useState(false)
  const [ingeklapt, setIngeklapt] = useState(false)

  const doc = useDiagramStore((s) => s.doc)
  const frames = useDiagramStore((s) => s.doc.frames)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const kanTerug = useDiagramStore(canUndo)
  const kanVooruit = useDiagramStore(canRedo)
  const voegFrameToe = useDiagramStore((s) => s.voegFrameToe)
  const dupliceerFrame = useDiagramStore((s) => s.dupliceerFrame)
  const verwijderFrame = useDiagramStore((s) => s.verwijderFrame)
  const zetFrameDuur = useDiagramStore((s) => s.zetFrameDuur)

  const tool = useUiStore((s) => s.tool)
  const setTool = useUiStore((s) => s.setTool)
  const snap = useUiStore((s) => s.snap)
  const setSnap = useUiStore((s) => s.setSnap)
  const activeFrame = useUiStore((s) => s.activeFrame)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)
  const speelt = useUiStore((s) => s.speelt)
  const setSpeelt = useUiStore((s) => s.setSpeelt)
  const setTijd = useUiStore((s) => s.setTijd)
  const sleept = useUiStore((s) => s.sleept)

  const huidig = frames[activeFrame]
  const magFrame = huidig ? kanFrameToevoegen(huidig.content, frames.length) : false
  const meerdereFrames = frames.length > 1
  const ontbreekt = watOntbreekt(doc)

  // Out of the way while you are actually moving something, back the moment you
  // let go. A control you have to work around is worse than no control.
  const stil = sleept || ingeklapt

  return (
    <>
      <div className={`zweef zweef--boven${stil ? ' zweef--stil' : ''}`}>
        <Link href="/" className="btn btn--klein btn--icoon zweefknop" aria-label={nl.editor.terug}>
          <TerugIcon />
        </Link>

        <div className="zweef__groep">
          {ontbreekt.length > 0 && (
            <span className="zweef__nog" title={ontbreekt.map((o) => o.tekst).join('\n')}>
              ▲ {ontbreekt.length}
            </span>
          )}
          <BewaarStatusLabel status={status} fout={fout} />
          <Knop
            klein
            className="btn--icoon zweefknop"
            actief={blad}
            aria-label={nl.instellingen.meer}
            onClick={() => setBlad(true)}
          >
            <SchuivenIcon />
          </Knop>
        </div>
      </div>

      <div className={`zweef zweef--onder${stil ? ' zweef--stil' : ''}`}>
        <div className="zweefpil">
          {TOOLS.map((t) => (
            <Knop
              key={t.id}
              klein
              className="btn--icoon"
              actief={tool === t.id}
              aria-label={t.label}
              onClick={() => setTool(t.id)}
            >
              {t.icoon}
            </Knop>
          ))}
          <span className="zweefpil__scheiding" aria-hidden />
          <Knop klein className="btn--icoon" disabled={!kanTerug} aria-label={nl.editor.ongedaan} onClick={undo}>
            <OngedaanIcon />
          </Knop>
          <Knop klein className="btn--icoon" disabled={!kanVooruit} aria-label={nl.editor.opnieuw} onClick={redo}>
            <OpnieuwIcon />
          </Knop>
        </div>

        <div className="zweefpil">
          <Knop
            klein
            className="btn--icoon"
            disabled={activeFrame === 0}
            aria-label={nl.frames.vorige}
            onClick={() => setActiveFrame(activeFrame - 1)}
          >
            <TerugIcon size={16} />
          </Knop>
          <span className="framenav__teller cijfers">
            <span className="framenav__nu">{activeFrame + 1}</span>
            <span className="framenav__streep">/</span>
            <span className="framenav__totaal">{frames.length}</span>
          </span>
          <Knop
            klein
            className="btn--icoon"
            disabled={activeFrame >= frames.length - 1}
            aria-label={nl.frames.volgende}
            onClick={() => setActiveFrame(activeFrame + 1)}
          >
            <VerderIcon size={16} />
          </Knop>
          <span className="zweefpil__scheiding" aria-hidden />
          <Knop
            klein
            className="btn--icoon"
            disabled={!magFrame}
            aria-label={nl.frames.toevoegenKort}
            title={frames.length >= MAX_FRAMES ? nl.frames.maximum : nl.frames.toevoegen}
            onClick={() => setActiveFrame(voegFrameToe(activeFrame))}
          >
            <PlusIcon />
          </Knop>
          {meerdereFrames && (
            <Knop
              klein
              variant="primair"
              className="btn--icoon"
              aria-label={speelt ? nl.afspelen.pauze : nl.afspelen.speel}
              onClick={() => {
                if (!speelt) setTijd(0)
                setSpeelt(!speelt)
              }}
            >
              {speelt ? <PauzeIcon size={16} /> : <SpeelIcon size={16} />}
            </Knop>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`zweeftab${ingeklapt ? ' zweeftab--in' : ''}`}
        aria-label={ingeklapt ? nl.zweef.tonen : nl.zweef.verbergen}
        aria-pressed={ingeklapt}
        onClick={() => setIngeklapt((aan) => !aan)}
      >
        <span aria-hidden>{ingeklapt ? '⌃' : '⌄'}</span>
      </button>

      {blad && (
        <div className="blad-scrim" onClick={() => setBlad(false)}>
          <div
            className="blad"
            role="dialog"
            aria-label={nl.instellingen.meer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="blad__greep" aria-hidden />

            <div className="blad__rij">
              <OccupancyCounter entities={huidig?.content.entities ?? []} />
              <DeelKnop diagramId={diagramId} />
              <Knop klein onClick={() => setBlad(false)} style={{ marginLeft: 'auto' }}>
                {nl.zweef.sluiten}
              </Knop>
            </div>

            {ontbreekt.length > 0 && (
              <div className="melding melding--waarschuwing">
                <strong>{nl.validatie.titel}</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '1.1rem' }}>
                  {ontbreekt.map((o) => (
                    <li key={o.veld}>{o.tekst}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="blad__velden">
              <DiagramInstellingen />

              <div>
                <span className="veld-label">{nl.instellingen.nieuweSpeler}</span>
                <div className="btn-groep" style={{ width: '100%' }}>
                  <Knop klein actief={kant === 'offense'} onClick={() => setKant('offense')} style={{ flex: 1 }}>
                    {nl.editor.aanval}
                  </Knop>
                  <Knop klein actief={kant === 'defense'} onClick={() => setKant('defense')} style={{ flex: 1 }}>
                    {nl.editor.verdediging}
                  </Knop>
                </div>
              </div>

              <Afspeelinstellingen />

              {meerdereFrames && (
                <div>
                  <span className="veld-label">
                    {nl.frames.kort} {activeFrame + 1}
                  </span>
                  <div className="blad__rij">
                    <select
                      className="keuze"
                      style={{ width: 'auto' }}
                      aria-label={nl.frames.duur}
                      value={huidig?.duurMs ?? DEFAULT_FRAME_DURATION_MS}
                      onChange={(e) => zetFrameDuur(activeFrame, Number(e.target.value))}
                    >
                      {DUUR_STAPPEN.map((ms) => (
                        <option key={ms} value={ms}>
                          {(ms / 1000).toLocaleString('nl-BE')} s
                        </option>
                      ))}
                    </select>
                    <Knop
                      klein
                      aria-label={nl.frames.dupliceren}
                      onClick={() => setActiveFrame(dupliceerFrame(activeFrame))}
                    >
                      <KopieIcon />
                    </Knop>
                    <Knop
                      klein
                      variant="gevaar"
                      aria-label={nl.frames.verwijderen}
                      disabled={frames.length <= 1}
                      onClick={() => {
                        verwijderFrame(activeFrame)
                        setActiveFrame(Math.max(0, activeFrame - 1))
                      }}
                    >
                      <TrashIcon size={17} />
                    </Knop>
                  </div>
                </div>
              )}

              <Aanvink label={nl.editor.rasterUitleg} checked={snap} onChange={setSnap} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
