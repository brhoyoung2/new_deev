import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { required, optional } from '@/lib/env'

describe('env', () => {
  const saved = process.env.VT_TEST_KEY

  beforeEach(() => { delete process.env.VT_TEST_KEY })
  afterEach(() => {
    if (saved === undefined) delete process.env.VT_TEST_KEY
    else process.env.VT_TEST_KEY = saved
  })

  it('값이 있으면 그대로 돌려준다', () => {
    process.env.VT_TEST_KEY = 'abc'
    expect(required('VT_TEST_KEY')).toBe('abc')
  })

  it('값이 없으면 이름을 담아 던진다', () => {
    expect(() => required('VT_TEST_KEY')).toThrow('VT_TEST_KEY')
  })

  it('빈 문자열도 없는 것으로 본다', () => {
    process.env.VT_TEST_KEY = '   '
    expect(() => required('VT_TEST_KEY')).toThrow()
  })

  it('optional 은 없으면 undefined 를 준다', () => {
    expect(optional('VT_TEST_KEY')).toBeUndefined()
  })
})
