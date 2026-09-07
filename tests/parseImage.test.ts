import { describe, it, expect } from 'vitest'
import { stripImages } from '@/lib/parseImage'

const OPT = {
  cdnBase: 'https://d1.cloudfront.net',
  workCode: 'bjbj',
  charCode: 'yunserin',
  have: [1, 2, 31],
}

describe('stripImages', () => {
  it('주소를 본문에서 걷어내고 번호를 돌려준다', () => {
    const got = stripImages(
      'https://d1.cloudfront.net/bjbj/yunserin/2.webp\n*문이 열린다.*\n윤세린 | 안 잤어?',
      OPT,
    )
    expect(got.code).toBe(2)
    expect(got.body).toBe('*문이 열린다.*\n윤세린 | 안 잤어?')
  })

  it('여러 번 나오면 마지막 것을 쓴다', () => {
    const got = stripImages(
      ['https://d1.cloudfront.net/bjbj/yunserin/1.webp', '앞', 'https://d1.cloudfront.net/bjbj/yunserin/31.webp', '뒤'].join('\n'),
      OPT,
    )
    expect(got.code).toBe(31)
    expect(got.body).toBe('앞\n뒤')
  })

  it('줄 가운데 있어도 걷어낸다', () => {
    const got = stripImages('앞 https://d1.cloudfront.net/bjbj/yunserin/2.webp 뒤', OPT)
    expect(got.code).toBe(2)
    expect(got.body).toBe('앞 뒤')
  })

  it('가지지 않은 번호는 무시한다 — 화면이 비지 않게', () => {
    const got = stripImages('https://d1.cloudfront.net/bjbj/yunserin/999.webp\n본문', OPT)
    expect(got.code).toBeNull()
    expect(got.body).toBe('본문')
  })

  it('다른 캐릭터 주소는 무시한다', () => {
    const got = stripImages('https://d1.cloudfront.net/bjbj/somebody/2.webp\n본문', OPT)
    expect(got.code).toBeNull()
    expect(got.body).toBe('본문')
  })

  it('다른 호스트는 무시한다', () => {
    const got = stripImages('https://evil.example.com/bjbj/yunserin/2.webp\n본문', OPT)
    expect(got.code).toBeNull()
    expect(got.body).toBe('본문')
  })

  it('주소가 없으면 본문을 그대로 둔다', () => {
    const got = stripImages('*불이 꺼진다.*', OPT)
    expect(got.code).toBeNull()
    expect(got.body).toBe('*불이 꺼진다.*')
  })

  it('주소가 반쯤 왔을 때는 본문에 내보내지 않는다 — 스트리밍 중', () => {
    const got = stripImages('https://d1.cloudfront.net/bjbj/yunser', OPT)
    expect(got.code).toBeNull()
    expect(got.body).toBe('')
  })

  it('마크다운 이미지 문법으로 감싸도 읽는다', () => {
    const got = stripImages('![](https://d1.cloudfront.net/bjbj/yunserin/2.webp)\n본문', OPT)
    expect(got.code).toBe(2)
    expect(got.body).toBe('본문')
  })

  it('CDN 주소 끝 슬래시를 흘리지 않는다', () => {
    const got = stripImages('https://d1.cloudfront.net/bjbj/yunserin/2.webp', {
      ...OPT,
      cdnBase: 'https://d1.cloudfront.net/',
    })
    expect(got.code).toBe(2)
  })

  it('빈 문자열도 죽지 않는다', () => {
    expect(stripImages('', OPT)).toEqual({ body: '', code: null })
  })
})
