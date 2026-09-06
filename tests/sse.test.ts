import { describe, it, expect } from 'vitest'
import { readSSE } from '@/lib/sse'

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const s of chunks) c.enqueue(enc.encode(s))
      c.close()
    },
  })
}

describe('readSSE', () => {
  it('델타를 순서대로 넘긴다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf([
        'data: {"choices":[{"delta":{"content":"31 "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"저는"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
      (t) => got.push(t),
    )
    expect(got).toEqual(['31 ', '저는'])
  })

  it('줄이 쪼개져 와도 이어 읽는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {"choices":[{"delta":{"con', 'tent":"안녕"}}]}\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual(['안녕'])
  })

  it('내용 없는 델타는 넘기지 않는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {"choices":[{"delta":{}}]}\n\n', 'data: [DONE]\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual([])
  })

  it('깨진 줄은 건너뛴다 — 한 줄 때문에 대화가 끊기지 않는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {깨짐\n\n', 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual(['ok'])
  })
})
