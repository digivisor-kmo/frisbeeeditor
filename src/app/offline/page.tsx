import type { Metadata } from 'next'
import { nl } from '@/lib/strings'

export const metadata: Metadata = { title: nl.offline.titel }

/**
 * What you get when the browser asks for a page and there is no network.
 *
 * It is deliberately plain and says the one true thing: nothing is lost, the
 * app simply cannot reach the server. It carries no navigation, because every
 * link on it would fail too.
 */
export default function OfflinePagina() {
  return (
    <main className="pagina pagina--smal">
      <div className="paginakop">
        <div>
          <h1 className="display">{nl.offline.titel}</h1>
          <p className="stil paginakop__onder">{nl.offline.uitleg}</p>
        </div>
      </div>
    </main>
  )
}
