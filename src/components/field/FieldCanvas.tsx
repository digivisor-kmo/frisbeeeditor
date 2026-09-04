'use client'

import { useMemo } from 'react'
import { createView, type ViewKind } from '@/lib/field/geometry'
import { FieldSurface } from './FieldSurface'

interface Props {
  kind: ViewKind
  className?: string
}

/**
 * The SVG root. Everything a diagram contains is drawn into this one root, in
 * layers, on top of the field. For now only the field itself exists.
 */
export function FieldCanvas({ kind, className }: Props) {
  const view = useMemo(() => createView(kind), [kind])

  return (
    <svg
      viewBox={view.viewBox}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
      role="img"
    >
      <FieldSurface view={view} />
    </svg>
  )
}
