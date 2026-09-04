'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * How long a claim lasts, in seconds.
 *
 * Long enough that thinking, or a wobbly connection beside a field, does not
 * cost you your place. Short enough that somebody who walked away does not
 * block the rest of the club for long. The editor renews every half minute
 * while its tab is visible, so in practice a lock only expires once you are
 * really gone.
 */
export const SLOT_SECONDEN = 120
export const SLOT_HERHAAL_MS = 30_000

export interface Slot {
  gelukt: boolean
  gebruikerId: string | null
  naam: string | null
  tot: string | null
}

interface SlotRij {
  gelukt: boolean
  gebruiker_id: string | null
  naam: string | null
  tot: string | null
}

/** Takes the lock, or reports who is holding it. */
export async function claimSlot(diagramId: string): Promise<Slot> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('claim_diagram_lock', {
    p_diagram: diagramId,
    p_seconden: SLOT_SECONDEN,
  })

  if (error) throw new Error(error.message)

  // The function returns a set, so a single row comes back inside an array.
  const rij = (data as SlotRij[] | null)?.[0]
  if (!rij) return { gelukt: false, gebruikerId: null, naam: null, tot: null }

  return {
    gelukt: rij.gelukt,
    gebruikerId: rij.gebruiker_id,
    naam: rij.naam,
    tot: rij.tot,
  }
}

export async function geefSlotVrij(diagramId: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('release_diagram_lock', { p_diagram: diagramId })
}
