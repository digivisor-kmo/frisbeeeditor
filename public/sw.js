/*
 * The service worker.
 *
 * It exists for two reasons. The first is that a browser only offers to install
 * an app that has one — that is the rule, and it is why this file was written
 * now rather than later. The second is the real one: a sports field has bad
 * reception, and the shell of the app should not be a white screen while it
 * waits for a mast.
 *
 * What it does NOT do yet is keep your diagrams offline. Those come from the
 * database over the network, and a half-cached diagram that silently shows
 * yesterday's version is worse than one that says it cannot reach the server.
 * That work belongs with the rest of the offline story.
 */

const VERSIE = 'v1'
const SCHIL = `schil-${VERSIE}`
const STATISCH = `statisch-${VERSIE}`
const OFFLINE = '/offline'

// Hashed build output never changes under its own name, so it can be kept
// forever and served without asking.
const ONVERANDERLIJK = '/_next/static/'

self.addEventListener('install', (event) => {
  // One at a time: addAll gives up on all of them if one is missing, and the
  // offline page is the one that matters.
  event.waitUntil(
    caches.open(SCHIL).then((cache) =>
      Promise.allSettled(
        [OFFLINE, '/icoon-192.png', '/manifest.webmanifest'].map((pad) => cache.add(pad)),
      ),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(
          namen.filter((naam) => !naam.endsWith(VERSIE)).map((naam) => caches.delete(naam)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** The page asks to be replaced by a newer worker that is already waiting. */
self.addEventListener('message', (event) => {
  if (event.data === 'neem-over') self.skipWaiting()
})

function laatMetRust(verzoek, url) {
  // Sign-in and sign-out must never come out of a tin.
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) return true
  // React's own payloads for a client-side navigation. Cached, they would hand
  // you a page from an hour ago without saying so.
  if (url.searchParams.has('_rsc') || verzoek.headers.has('RSC')) return true
  return false
}

self.addEventListener('fetch', (event) => {
  const verzoek = event.request
  if (verzoek.method !== 'GET') return

  const url = new URL(verzoek.url)
  // Anything on another host — the database above all — goes straight out. A
  // cached answer there would be a lie about someone's data.
  if (url.origin !== self.location.origin) return
  if (laatMetRust(verzoek, url)) return

  if (url.pathname.startsWith(ONVERANDERLIJK)) {
    event.respondWith(uitVoorraad(verzoek, STATISCH))
    return
  }

  if (verzoek.mode === 'navigate') {
    event.respondWith(eerstHetNetwerk(verzoek))
    return
  }

  event.respondWith(uitVoorraad(verzoek, SCHIL))
})

/** Kept forever once seen: the name carries the hash. */
async function uitVoorraad(verzoek, naam) {
  const cache = await caches.open(naam)
  const bewaard = await cache.match(verzoek)
  if (bewaard) return bewaard
  try {
    const antwoord = await fetch(verzoek)
    if (antwoord.ok && antwoord.type === 'basic') cache.put(verzoek, antwoord.clone())
    return antwoord
  } catch {
    return bewaard ?? Response.error()
  }
}

/**
 * Pages come off the network, always, and are not kept.
 *
 * Not kept for two reasons. A deploy has to arrive, and a playbook that shows
 * last week's stack because it came out of a tin is the kind of bug you only
 * find while standing on the pitch. And every page here is signed in as
 * somebody: a stored copy would still be lying in the browser after they log
 * out, on a phone that gets passed around at the club.
 *
 * Without a network there is one honest answer, and this is where it is given.
 */
async function eerstHetNetwerk(verzoek) {
  try {
    return await fetch(verzoek)
  } catch {
    const cache = await caches.open(SCHIL)
    const uitwijk = await cache.match(OFFLINE)
    return uitwijk ?? Response.error()
  }
}
