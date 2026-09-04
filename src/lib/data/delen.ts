'use client'

import { createClient } from '@/lib/supabase/client'

export interface Deellink {
  token: string
  verlooptOp: string
}

/**
 * Makes a share link, or hands back the one that is still valid.
 *
 * Two links to the same diagram in one group chat is confusing, and a trainer
 * who presses share twice does not mean two links.
 */
export async function maakDeellink(diagramId: string): Promise<Deellink> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('maak_deellink', { p_diagram: diagramId })
  if (error) throw new Error(error.message)

  const rij = (data as { token: string; verloopt_op: string }[] | null)?.[0]
  if (!rij) throw new Error('Geen link gekregen.')
  return { token: rij.token, verlooptOp: rij.verloopt_op }
}
