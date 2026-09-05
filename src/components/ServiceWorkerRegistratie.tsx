'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker, and nothing else.
 *
 * It runs after the page is interactive, because registration competes with the
 * first paint for bandwidth on exactly the connection where the first paint
 * matters most. In development it stays out of the way: a worker that caches a
 * hot-reloaded bundle is a morning lost.
 */
export function ServiceWorkerRegistratie() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const registreer = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A browser that refuses is a browser without offline. Nothing else breaks.
      })
    }

    if (document.readyState === 'complete') registreer()
    else {
      window.addEventListener('load', registreer)
      return () => window.removeEventListener('load', registreer)
    }
    return undefined
  }, [])

  return null
}
