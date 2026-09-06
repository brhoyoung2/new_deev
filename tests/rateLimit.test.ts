import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rateLimit'

function req(ip: string): Request {
  return new Request('https://x.test/', { headers: { 'x-forwarded-for': ip } })
}

describe('checkRateLimit', () => {
  it('한도 안에서는 통과시킨다', () => {
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
  })

  it('한도를 넘으면 한국어 안내를 준다', () => {
    for (let i = 0; i < 3; i++) checkRateLimit(req('2.2.2.2'), 'k2', 3)
    const msg = checkRateLimit(req('2.2.2.2'), 'k2', 3)
    expect(msg).toContain('요청이 너무 많습니다')
  })

  it('IP 가 다르면 버킷이 갈린다', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(req('3.3.3.3'), 'k3', 3)
    expect(checkRateLimit(req('4.4.4.4'), 'k3', 3)).toBeNull()
  })
})
