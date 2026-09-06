import { db } from '@/lib/supabase'
import { fail, ok } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Character } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limited = checkRateLimit(req, 'characters', 60)
  if (limited) return fail(limited, 429)

  const { data, error } = await db()
    .from('vt_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (error) return fail('캐릭터를 불러오지 못했습니다.', 500)

  const characters: Character[] = (data ?? []).map((r) => ({
    workCode: r.work_code as string,
    charCode: r.char_code as string,
    pack: r.pack as Character['pack'],
  }))

  return ok({ characters })
}
