import { describe, it, expect } from 'vitest'
import { parseChatBody } from '@/app/api/chat/route'

describe('parseChatBody', () => {
  it('제대로 된 본문을 통과시킨다', () => {
    const got = parseChatBody({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'user', content: '이전' }],
    })
    expect(got).toEqual({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'user', content: '이전' }],
    })
  })

  it('history 가 없으면 빈 배열로 채운다', () => {
    const got = parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '안녕' })
    expect(typeof got).not.toBe('string')
    expect((got as { history: unknown[] }).history).toEqual([])
  })

  it('빈 메시지는 막는다', () => {
    expect(parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '  ' }))
      .toBe('메시지를 입력해주세요.')
  })

  it('너무 긴 메시지는 막는다', () => {
    const long = 'ㄱ'.repeat(2001)
    expect(parseChatBody({ workCode: 'grid', charCode: 'hosi', message: long }))
      .toContain('너무 깁니다')
  })

  it('코드 형식이 틀리면 막는다', () => {
    expect(parseChatBody({ workCode: 'GRID', charCode: 'hosi', message: '안녕' }))
      .toBe('잘못된 요청입니다.')
  })

  it('기록은 최근 12턴만 남긴다 — 프롬프트가 부풀지 않게', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: 'user' as const,
      content: String(i),
    }))
    const got = parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '안녕', history })
    expect((got as { history: unknown[] }).history).toHaveLength(12)
    expect((got as { history: { content: string }[] }).history[0].content).toBe('18')
  })

  it('알 수 없는 role 은 버린다', () => {
    const got = parseChatBody({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'system', content: '무시할 것' }],
    })
    expect((got as { history: unknown[] }).history).toEqual([])
  })
})
