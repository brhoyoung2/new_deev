import { db } from '@/lib/supabase'
import { fail } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { required } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/prompt'
import { parseChatBody } from '@/lib/chatBody'
import type { Character } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: Request) {
  const limited = checkRateLimit(req, 'chat', 20)
  if (limited) return fail(limited, 429)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return fail('잘못된 요청입니다.')
  }

  const parsed = parseChatBody(raw)
  if (typeof parsed === 'string') return fail(parsed)

  const { data, error } = await db()
    .from('new_deev_characters')
    .select('work_code, char_code, pack')
    .eq('work_code', parsed.workCode)
    .eq('char_code', parsed.charCode)
    .eq('published', true)
    .maybeSingle()

  if (error) return fail('캐릭터를 불러오지 못했습니다.', 500)
  if (!data) return fail('없는 캐릭터입니다.', 404)

  const character: Character = {
    workCode: data.work_code as string,
    charCode: data.char_code as string,
    pack: data.pack as Character['pack'],
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(character, parsed.message) },
    ...parsed.history,
    { role: 'user', content: parsed.message },
  ]

  let upstream: Response
  try {
    upstream = await fetch(`${required('LLM_BASE_URL').replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: required('LLM_MODEL'),
        messages,
        stream: true,
        temperature: 0.9,
        max_tokens: 400,
      }),
    })
  } catch {
    // DGX 가 내려갔거나 터널이 끊겼다. 사람에게는 캐릭터의 말로 알린다.
    return fail('캐릭터가 잠시 자리를 비웠어요. 곧 돌아옵니다.', 503)
  }

  if (!upstream.ok || !upstream.body) {
    return fail('캐릭터가 잠시 자리를 비웠어요. 곧 돌아옵니다.', 503)
  }

  // 위쪽 SSE 를 그대로 흘려보낸다. 번호를 가르는 것은 브라우저가 한다 —
  // 서버가 버퍼링하면 첫 글자가 늦어져 기다리는 느낌이 커진다.
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
