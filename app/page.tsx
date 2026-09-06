import { db } from '@/lib/supabase'
import { required } from '@/lib/env'
import { Feed } from '@/components/Feed'
import type { Character } from '@/lib/pack'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data } = await db()
    .from('vt_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const characters: Character[] = (data ?? []).map((r) => ({
    workCode: r.work_code as string,
    charCode: r.char_code as string,
    pack: r.pack as Character['pack'],
  }))

  return <Feed characters={characters} cdnBase={required('NEXT_PUBLIC_CDN_BASE')} />
}
