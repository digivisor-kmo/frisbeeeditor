'use client'

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function VeldRij({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="veld-label">{label}</span>
      {children}
    </label>
  )
}

export function Keuze(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={['keuze', props.className].filter(Boolean).join(' ')} />
}

export function Invoer(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['invoer', props.className].filter(Boolean).join(' ')} />
}

export function Aanvink({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (waarde: boolean) => void
}) {
  return (
    <label className="aanvink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
