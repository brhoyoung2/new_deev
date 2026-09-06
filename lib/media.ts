import type { Character } from './pack'

/** 이 캐릭터의 미디어 주소 앞부분. 끝에 슬래시를 붙이지 않는다. */
export function mediaBase(c: Character, cdnBase: string): string {
  return `${cdnBase.replace(/\/+$/, '')}/${c.workCode}/${c.charCode}`
}

/**
 * 번호를 주소로 바꾼다.
 *
 * 규칙은 한 줄이다 — **영상이 있으면 영상, 없으면 정지.**
 * 유저가 고를 것도, 서버가 기억할 상태도 없다.
 * 가지고 있지 않은 번호면 null 을 준다. 부르는 쪽이 직전 컷을 유지한다.
 */
export function resolveMedia(
  c: Character,
  code: number,
  cdnBase: string,
): { url: string; motion: boolean } | null {
  if (!c.pack.have.includes(code)) return null
  const base = mediaBase(c, cdnBase)
  const motion = c.pack.haveMotion.includes(code)
  return {
    url: motion ? `${base}/m/${code}.webp` : `${base}/${code}.webp`,
    motion,
  }
}
