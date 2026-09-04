import { Laden } from './Laden'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Laden id={id} />
}
