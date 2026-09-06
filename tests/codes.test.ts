import { describe, it, expect } from 'vitest'
import { BASIC_50, ADULT_70, ALL_120, codeOf, labelOf } from '@/lib/codes'

describe('codes', () => {
  it('착의 50개, 성인 70개, 합쳐 120개다', () => {
    expect(BASIC_50).toHaveLength(50)
    expect(ADULT_70).toHaveLength(70)
    expect(ALL_120).toHaveLength(120)
  })

  it('붙박은 번호가 흔들리지 않는다', () => {
    expect(labelOf(1)).toBe('기본')
    expect(labelOf(2)).toBe('미소')
    expect(labelOf(9)).toBe('경청')
    expect(labelOf(31)).toBe('두근')
    expect(labelOf(46)).toBe('기다림')
    expect(labelOf(50)).toBe('말없이기댐')
  })

  it('성인은 51번부터 시작한다', () => {
    expect(labelOf(51)).toBe(ADULT_70[0])
    expect(labelOf(120)).toBe(ADULT_70[69])
  })

  it('이름으로 번호를 찾는다', () => {
    expect(codeOf('두근')).toBe(31)
    expect(codeOf('기본')).toBe(1)
  })

  it('공백은 무시하고 찾는다', () => {
    expect(codeOf('  두근 ')).toBe(31)
  })

  it('표에 없는 이름은 null 이다 — 짐작하지 않는다', () => {
    expect(codeOf('창밖보기')).toBeNull()
    expect(codeOf('')).toBeNull()
  })

  it('범위 밖 번호는 null 이다', () => {
    expect(labelOf(0)).toBeNull()
    expect(labelOf(121)).toBeNull()
    expect(labelOf(-1)).toBeNull()
  })

  it('이름이 겹치지 않는다 — 겹치면 번호가 흔들린다', () => {
    expect(new Set(ALL_120).size).toBe(120)
  })
})
