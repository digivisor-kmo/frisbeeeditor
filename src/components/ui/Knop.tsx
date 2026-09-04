'use client'

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'standaard' | 'primair' | 'gevaar'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  klein?: boolean
  actief?: boolean
}

const VARIANT_CLASS: Record<Variant, string> = {
  standaard: '',
  primair: 'btn--primair',
  gevaar: 'btn--gevaar',
}

export function Knop({
  variant = 'standaard',
  klein = false,
  actief = false,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const classes = ['btn', VARIANT_CLASS[variant], klein ? 'btn--klein' : '', className]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={classes} aria-pressed={actief || undefined} {...rest} />
}
