'use client'

import { useEffect, useState } from 'react'
import { InstalleerIcon } from '@/components/editor/icons'
import { nl } from '@/lib/strings'

interface InstallGebeurtenis extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * The button that puts the app on the home screen.
 *
 * The browser decides when this is possible and tells us by firing an event;
 * there is no way to ask. So the button does not exist until the browser says
 * it may, and disappears the moment the app is installed. A button that is
 * always there and does nothing on iPhone would be worse than none.
 */
export function InstallKnop() {
  const [gebeurtenis, setGebeurtenis] = useState<InstallGebeurtenis | null>(null)

  useEffect(() => {
    const vang = (e: Event) => {
      e.preventDefault()
      setGebeurtenis(e as InstallGebeurtenis)
    }
    const klaar = () => setGebeurtenis(null)
    window.addEventListener('beforeinstallprompt', vang)
    window.addEventListener('appinstalled', klaar)
    return () => {
      window.removeEventListener('beforeinstallprompt', vang)
      window.removeEventListener('appinstalled', klaar)
    }
  }, [])

  if (!gebeurtenis) return null

  const installeer = async () => {
    await gebeurtenis.prompt()
    await gebeurtenis.userChoice
    // The event is good for one call, whatever the answer.
    setGebeurtenis(null)
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--klein btn--icoon topbalk__account"
        aria-label={nl.installeren.knop}
        title={nl.installeren.knop}
        onClick={installeer}
      >
        <InstalleerIcon />
      </button>
      <button type="button" className="btn btn--klein topbalk__breed" onClick={installeer}>
        {nl.installeren.knop}
      </button>
    </>
  )
}
