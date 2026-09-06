import { describe, it, expect } from 'vitest'
import { resolveMedia, mediaBase } from '@/lib/media'
import type { Character } from '@/lib/pack'

const CDN = 'https://d1.cloudfront.net'

const hosi: Character = {
  workCode: 'grid',
  charCode: 'hosi',
  pack: {
    name: '호시',
    intro: '회사 후배',
    characterInfo: '#캐릭터',
    prologue: '*불이 꺼진다*',
    background: '',
    firstMedia: null,
    loreBooks: [],
    genre: 'Romance',
    target: '남성',
    rating: 'free',
    tags: [],
    have: [1, 2, 9, 31],
    haveMotion: [1, 31],
  },
}

describe('resolveMedia', () => {
  it('영상이 있으면 영상을 준다', () => {
    expect(resolveMedia(hosi, 31, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/hosi/m/31.webp',
      motion: true,
    })
  })

  it('영상이 없으면 정지 이미지를 준다', () => {
    expect(resolveMedia(hosi, 9, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/hosi/9.webp',
      motion: false,
    })
  })

  it('가진 컷이 아니면 null 이다', () => {
    expect(resolveMedia(hosi, 46, CDN)).toBeNull()
  })

  it('영상이 하나도 없는 캐릭터도 성립한다', () => {
    const seorin: Character = {
      ...hosi,
      charCode: 'seorin',
      pack: { ...hosi.pack, have: [1], haveMotion: [] },
    }
    expect(resolveMedia(seorin, 1, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/seorin/1.webp',
      motion: false,
    })
  })

  it('CDN 주소 끝의 슬래시를 흘리지 않는다', () => {
    expect(mediaBase(hosi, 'https://d1.cloudfront.net/')).toBe(
      'https://d1.cloudfront.net/grid/hosi',
    )
  })
})
