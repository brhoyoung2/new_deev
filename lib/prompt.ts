import type { Character, LoreBook } from './pack'

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
export function codeTable(have: number[], codes: Record<string, string>): string {
  return have
    .map((n) => {
      const label = codes[String(n)]
      return label ? `${n}${label.replace(/\s+/g, '')}` : null
    })
    .filter((x): x is string => x !== null)
    .join(' ')
}

export function buildSystemPrompt(c: Character, userText: string, cdnBase: string): string {
  const p = c.pack
  const lore = pickLore(p.loreBooks, userText)
  // 모델이 주소를 직접 적으므로 앞부분을 알려 준다. 뒤에 `번호.webp` 만 붙이면 된다.
  const base = `${cdnBase.replace(/\/+$/, '')}/${c.workCode}/${c.charCode}`

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
    '[이미지 출력 규칙]',
    '- 장면 첫머리에 이미지 주소를 한 줄로 넣는다. **처음부터 끝까지 전부** 적는다.',
    `  맞는 예: ${base}/2.webp`,
    '  틀린 예: 2   ·   /2.webp   ·   yunserin/2.webp',
    '- 아래 목록에 있는 번호만 쓴다. 없는 번호를 적으면 그림이 뜨지 않는다.',
    '- `탈의_` 로 시작하는 번호는 실제로 그 상황일 때만 쓴다. 평범한 대화에서는 `착의_` 번호만 쓴다.',
    '',
    '[출력 규칙]',
    '- 한국어로 답한다.',
    '',
    '[감정 코드 — 번호와 뜻]',
    codeTable(p.have, p.codes),
  )

  if (lore.length) {
    parts.push('', '[설정]')
    for (const b of lore) parts.push(`${b.title}: ${b.content}`)
  }

  return parts.join('\n')
}
