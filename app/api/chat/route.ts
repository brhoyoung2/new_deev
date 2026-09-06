import { db } from '@/lib/supabase'
import { fail } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { required } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/prompt'
import type { Character, Turn } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const CODE_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/
const MAX_MESSAGE = 2000
const MAX_TURNS = 12

export interface ChatBody {
  workCode: string
  charCode: string
  message: string
  history: Turn[]
}

/** 통과하면 본문을, 막히면 사람에게 보여줄 한국어 한 문장을 돌려준다. */
export function parseChatBody(raw: unknown): ChatBody | string {
  const b = (raw ?? {}) as Record<string, unknown>

  const workCode = String(b.workCode ?? '')
  const charCode = String(b.charCode ?? '')
  if (!CODE_RE.test(workCode) || !CODE_RE.test(charCode)) return '잘못된 요청입니다.'

  const message = String(b.message ?? '').trim()
  if (!message) return '메시지를 입력해주세요.'
  if (message.length > MAX_MESSAGE) return `메시지가 너무 깁니다. ${MAX_MESSAGE}자까지 보낼 수 있습니다.`

  const raws = Array.isArray(b.history) ? b.history : []
  const history: Turn[] = raws
    .map((t) => t as Record<string, unknown>)
    .filter((t) => t?.role === 'user' || t?.role === 'assistant')
    .map((t) => ({ role: t.role as Turn['role'], content: String(t.content ?? '') }))
    .slice(-MAX_TURNS)

  return { workCode, charCode, message, history }
}

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
    .from('vt_characters')
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
