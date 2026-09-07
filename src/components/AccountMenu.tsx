'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronOmlaagIcon,
  InstalleerIcon,
  PersoonIcon,
  UitIcon,
} from '@/components/editor/icons'
import { nl } from '@/lib/strings'

interface InstallGebeurtenis extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Props {
  naam: string
  email: string
  magBewerken: boolean
}

/**
 * Everything about you, behind one control.
 *
 * It used to be three buttons of equal weight in a row — account, install, sign
 * out — plus your name stacked on two lines beside them. Three equals is no
 * hierarchy at all, and the row changed width depending on whether the browser
 * felt like offering the install, so the bar never looked the same twice.
 *
 * One button now, always the same size, with the rest folded away underneath.
 * Signing out is the last item and the only one in a warning colour, because it
 * is the one you do not want to hit while reaching for the account page.
 */
export function AccountMenu({ naam, email, magBewerken }: Props) {
  const [open, setOpen] = useState(false)
  const [install, setInstall] = useState<InstallGebeurtenis | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vang = (e: Event) => {
      e.preventDefault()
      setInstall(e as InstallGebeurtenis)
    }
    const klaar = () => setInstall(null)
    window.addEventListener('beforeinstallprompt', vang)
    window.addEventListener('appinstalled', klaar)
    return () => {
      window.removeEventListener('beforeinstallprompt', vang)
      window.removeEventListener('appinstalled', klaar)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const buiten = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const toets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', buiten)
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('pointerdown', buiten)
      window.removeEventListener('keydown', toets)
    }
  }, [open])

  const initiaal = (naam.trim()[0] ?? '?').toUpperCase()

  const installeer = async () => {
    if (!install) return
    setOpen(false)
    await install.prompt()
    await install.userChoice
    // The event is good for one call, whatever the answer.
    setInstall(null)
  }

  return (
    <div className="account" ref={wrap}>
      <button
        type="button"
        className="accountknop"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={nl.account.titel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="accountknop__disc" aria-hidden="true">
          {initiaal}
        </span>
        <span className="accountknop__naam">{naam}</span>
        <ChevronOmlaagIcon />
      </button>

      {open && (
        <div className="accountmenu" role="menu">
          <div className="accountmenu__kop">
            <span className="accountmenu__wie">{naam}</span>
            <span className="accountmenu__mail">{email}</span>
            <span className="rolchip">
              {magBewerken ? nl.rechten.trainer : nl.rechten.speler}
            </span>
          </div>

          <Link
            href="/account"
            role="menuitem"
            className="accountmenu__item"
            onClick={() => setOpen(false)}
          >
            <PersoonIcon />
            {nl.account.titel}
          </Link>

          {install && (
            <button type="button" role="menuitem" className="accountmenu__item" onClick={installeer}>
              <InstalleerIcon />
              {nl.installeren.knop}
            </button>
          )}

          <div className="accountmenu__scheiding" />

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="accountmenu__item accountmenu__item--uit"
            >
              <UitIcon />
              {nl.login.afmelden}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
