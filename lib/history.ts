import type { Turn } from '@/lib/pack'

/** 브라우저에만 남는다. 기기를 바꾸면 사라진다 — 1차에는 계정이 없다. */
const MAX_KEEP = 40

export function historyKey(workCode: string, charCode: string): string {
  return `vt.history.${workCode}.${charCode}`
}

export function loadHistory(key: string): Turn[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string',
    )
  } catch {
    // 사생활 보호 모드거나 값이 망가졌다. 대화는 계속돼야 한다.
    return []
  }
}

export function saveHistory(key: string, turns: Turn[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(turns.slice(-MAX_KEEP)))
  } catch {
    /* 저장 못 해도 대화는 계속된다 */
  }
}
