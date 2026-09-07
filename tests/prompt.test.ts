import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, pickLore, codeTable } from '@/lib/prompt'
import type { Character, LoreBook } from '@/lib/pack'

const CDN = 'https://d1.cloudfront.net'

const books: LoreBook[] = [
  { title: '같은 지하철', keywords: ['지하철', '퇴근'], content: '집 방향이 반대다.' },
  { title: '고양이', keywords: ['고양이'], content: '고양이를 키운다.' },
]

const c: Character = {
  workCode: 'grid',
  charCode: 'hosi',
  pack: {
    name: '호시',
    intro: '회사 후배',
    characterInfo: '#캐릭터\n이름 : 호시',
    prologue: '*불이 꺼진다*',
    background: '야근이 잦은 팀.',
    firstMedia: null,
    loreBooks: books,
    genre: 'Romance',
    target: '남성',
    rating: 'free',
    tags: [],
    codes: { '1': '기본', '2': '미소', '9': '경청', '31': '두근' },
    have: [1, 2, 31],
    haveMotion: [31],
  },
}

describe('pickLore', () => {
  it('키워드가 나온 항목만 고른다', () => {
    const got = pickLore(books, '오늘 지하철 늦었어')
    expect(got).toHaveLength(1)
    expect(got[0].title).toBe('같은 지하철')
  })

  it('키워드가 없으면 아무것도 싣지 않는다', () => {
    expect(pickLore(books, '밥 먹었어?')).toHaveLength(0)
  })

  it('여러 항목이 걸리면 모두 고른다', () => {
    expect(pickLore(books, '지하철에서 고양이를 봤어')).toHaveLength(2)
  })
})

describe('codeTable', () => {
  it('가진 번호만 이름과 함께 늘어놓는다', () => {
    const codes = { '1': '기본', '2': '미소', '31': '두근' }
    expect(codeTable([1, 2, 31], codes)).toBe('1기본 2미소 31두근')
  })

  it('표에 없는 번호는 빼고 만든다', () => {
    expect(codeTable([1, 999], { '1': '기본' })).toBe('1기본')
  })
})

describe('buildSystemPrompt', () => {
  it('캐릭터 정보와 배경을 담는다', () => {
    const p = buildSystemPrompt(c, '안녕', CDN)
    expect(p).toContain('이름 : 호시')
    expect(p).toContain('야근이 잦은 팀.')
  })

  it('가진 번호만 코드표에 싣는다 — 없는 번호를 부르면 빈 화면이 된다', () => {
    const p = buildSystemPrompt(c, '안녕', CDN)
    expect(p).toContain('1기본 2미소 31두근')
    expect(p).not.toContain('9경청')
  })

  it('이미지 주소를 전체로 적으라는 규칙과 이 캐릭터의 주소 앞부분을 담는다', () => {
    const p = buildSystemPrompt(c, '안녕', CDN)
    expect(p).toContain('처음부터 끝까지 전부')
    expect(p).toContain('https://d1.cloudfront.net/grid/hosi/2.webp')
  })

  it('탈의 코드를 아무 때나 쓰지 말라는 규칙을 담는다', () => {
    expect(buildSystemPrompt(c, '안녕', CDN)).toContain('탈의_')
  })

  it('키워드가 나온 로어북만 싣는다', () => {
    expect(buildSystemPrompt(c, '지하철', CDN)).toContain('집 방향이 반대다.')
    expect(buildSystemPrompt(c, '안녕', CDN)).not.toContain('집 방향이 반대다.')
  })
})
