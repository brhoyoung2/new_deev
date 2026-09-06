import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadHistory, saveHistory, historyKey } from '@/lib/history'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

describe('history', () => {
  it('키에 작품과 캐릭터가 들어간다', () => {
    expect(historyKey('grid', 'hosi')).toBe('vt.history.grid.hosi')
  })

  it('넣은 것을 그대로 읽는다', () => {
    saveHistory('k', [{ role: 'user', content: '안녕' }])
    expect(loadHistory('k')).toEqual([{ role: 'user', content: '안녕' }])
  })

  it('없으면 빈 배열이다', () => {
    expect(loadHistory('없는키')).toEqual([])
  })

  it('망가진 값이 있어도 죽지 않는다', () => {
    localStorage.setItem('k', '{{{')
    expect(loadHistory('k')).toEqual([])
  })

  it('최근 40턴만 남긴다 — 무한히 자라지 않게', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      role: 'user' as const,
      content: String(i),
    }))
    saveHistory('k', many)
    const got = loadHistory('k')
    expect(got).toHaveLength(40)
    expect(got[0].content).toBe('60')
  })
})
