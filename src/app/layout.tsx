import type { Metadata, Viewport } from 'next'
import { nl } from '@/lib/strings'
import './globals.css'

export const metadata: Metadata = {
  title: nl.app.naam,
  description: nl.app.ondertitel,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
