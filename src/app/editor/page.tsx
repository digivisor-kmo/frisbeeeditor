import { EditorScherm } from './EditorScherm'
import type { Opstelling } from '@/lib/diagram/presets'
import type { Weergave } from '@/lib/diagram/schema'

const WEERGAVEN: Weergave[] = ['volledig', 'half', 'vrij']
const OPSTELLINGEN: Opstelling[] = ['vertical-stack', 'horizontal-stack', 'leeg']

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ weergave?: string; opstelling?: string }>
}) {
  const params = await searchParams
  const weergave = WEERGAVEN.find((w) => w === params.weergave) ?? 'volledig'
  const opstelling = OPSTELLINGEN.find((o) => o === params.opstelling) ?? 'vertical-stack'

  return <EditorScherm weergave={weergave} opstelling={opstelling} />
}
