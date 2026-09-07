import { db } from '@/lib/supabase'
import { fail, ok } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { toPublicCharacter, type Character } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limited = checkRateLimit(req, 'characters', 60)
  if (limited) return fail(limited, 429)

  const { data, error } = await db()
    .from('new_deev_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (error) return fail('캐릭터를 불러오지 못했습니다.', 500)

  // 인증 없이 열리는 목록이다. 페르소나·로어북은 내보내지 않는다.
  const characters = (data ?? []).map((r) =>
    toPublicCharacter({
      workCode: r.work_code as string,
      charCode: r.char_code as string,
      pack: r.pack as Character['pack'],
    }),
  )

  return ok({ characters })
}
