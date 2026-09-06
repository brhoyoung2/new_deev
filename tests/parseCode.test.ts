import { describe, it, expect } from 'vitest'
import { createCodeReader } from '@/lib/parseCode'

describe('createCodeReader', () => {
  it('한 덩어리로 오면 번호와 대사를 가른다', () => {
    const r = createCodeReader()
    expect(r.push('31 저는… 기다렸어요.')).toEqual({
      code: 31,
      text: '저는… 기다렸어요.',
    })
  })

  it('번호가 쪼개져 와도 이어 붙여 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('3')).toEqual({ code: null, text: '' })
    expect(r.push('1 저는')).toEqual({ code: 31, text: '저는' })
    expect(r.push('… 기다렸어요.')).toEqual({ code: null, text: '… 기다렸어요.' })
  })

  it('앞의 공백과 줄바꿈을 흘린다', () => {
    const r = createCodeReader()
    expect(r.push('\n  2 미소를 짓는다')).toEqual({ code: 2, text: '미소를 짓는다' })
  })

  it('번호 없이 시작하면 전부 대사로 흘린다 — 화면을 비우지 않는다', () => {
    const r = createCodeReader()
    expect(r.push('안녕하세요, 선배.')).toEqual({ code: null, text: '안녕하세요, 선배.' })
  })

  it('번호를 한 번 읽은 뒤에는 숫자를 대사로 흘린다', () => {
    const r = createCodeReader()
    r.push('9 ')
    expect(r.push('7시에 만나요')).toEqual({ code: null, text: '7시에 만나요' })
  })

  it('세 자리 번호도 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('120 …')).toEqual({ code: 120, text: '…' })
  })

  it('빈 첫 청크가 와도 번호를 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('')).toEqual({ code: null, text: '' })
    expect(r.push('31 저는')).toEqual({ code: 31, text: '저는' })
  })

  it('공백만 있는 첫 청크가 와도 번호를 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('\n')).toEqual({ code: null, text: '' })
    expect(r.push('2 미소')).toEqual({ code: 2, text: '미소' })
  })

  it('번호만 오고 스트림이 끝나면 flush 가 그것을 텍스트로 돌려준다', () => {
    const r = createCodeReader()
    expect(r.push('31')).toEqual({ code: null, text: '' })
    expect(r.flush()).toEqual('31')
  })

  it('번호를 이미 읽었으면 flush 는 빈 문자열이다', () => {
    const r = createCodeReader()
    r.push('31 안녕')
    expect(r.flush()).toEqual('')
  })

  it('flush 를 두 번 불러도 안전하다', () => {
    const r = createCodeReader()
    r.push('2')
    expect(r.flush()).toEqual('2')
    expect(r.flush()).toEqual('')
  })
})
