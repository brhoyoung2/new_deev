import type { Character, LoreBook } from './pack'
import { labelOf } from './codes'

/**
 * 이번 턴 입력에 키워드가 나온 로어북만 고른다.
 *
 * 전부 실으면 캐릭터가 늘수록 프롬프트가 부풀고, 정작 중요한 설정이 뒤로 밀린다.
 * 키워드가 나온 턴에만 실어 토큰을 아낀다.
 */
export function pickLore(books: LoreBook[], text: string): LoreBook[] {
  return books.filter((b) => b.keywords.some((k) => k.trim() && text.includes(k.trim())))
}

/**
 * 코드표 한 줄.
 *
 * **가진 번호만 싣는다.** 없는 번호를 모델이 부르면 화면이 빈다.
 */
export function codeTable(have: number[]): string {
  return have
    .map((n) => {
      const label = labelOf(n)
      return label ? `${n}${label.replace(/\s+/g, '')}` : null
    })
    .filter((x): x is string => x !== null)
    .join(' ')
}

export function buildSystemPrompt(c: Character, userText: string): string {
  const p = c.pack
  const lore = pickLore(p.loreBooks, userText)

  const parts: string[] = [
    '너는 아래 캐릭터를 연기한다. 캐릭터 밖으로 나가지 않는다.',
    '',
    '[캐릭터]',
    p.characterInfo,
  ]

  if (p.background.trim()) {
    parts.push('', '[배경 상황]', p.background)
  }

  parts.push(
    '',
    '[출력 규칙]',
    '- 응답은 반드시 아래 감정 코드의 번호 하나로 시작한다. 번호 뒤에 공백 하나를 두고 대사를 잇는다.',
    '  예: 31 저는… 그냥, 기다렸어요.',
    '- 목록에 없는 번호는 쓰지 않는다.',
    '- 한국어로 답한다. 한 번에 두세 문장을 넘기지 않는다.',
    '',
    '[감정 코드]',
    codeTable(p.have),
  )

  if (lore.length) {
    parts.push('', '[설정]')
    for (const b of lore) parts.push(`${b.title}: ${b.content}`)
  }

  return parts.join('\n')
}
