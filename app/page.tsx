import { db } from '@/lib/supabase'
import { required } from '@/lib/env'
import { Feed } from '@/components/Feed'
import { toPublicCharacter, type Character } from '@/lib/pack'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data } = await db()
    .from('new_deev_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  // 페르소나와 로어북은 서버에 남는다 — 클라이언트 컴포넌트로 넘기는 건 공개 몫뿐이다.
  const characters = (data ?? []).map((r) =>
    toPublicCharacter({
      workCode: r.work_code as string,
      charCode: r.char_code as string,
      pack: r.pack as Character['pack'],
    }),
  )

  return <Feed characters={characters} cdnBase={required('NEXT_PUBLIC_CDN_BASE')} />
}
