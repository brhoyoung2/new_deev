import type { Turn } from '@/lib/pack'

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
