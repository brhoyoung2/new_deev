/** 로어북 한 항목. 키워드가 그 턴 입력에 나오면 실린다. */
export interface LoreBook {
  title: string
  keywords: string[]
  content: string
}

/** 인트로로 먼저 보여줄 컷. 없으면 null. */
export interface FirstMedia {
  kind: 'motion' | 'still'
  n: number
}

export interface CharacterPack {
  name: string
  intro: string
  characterInfo: string
  prologue: string
  background: string
  firstMedia: FirstMedia | null
  loreBooks: LoreBook[]
  genre: string
  target: string
  /** safe | free(19+) */
  rating: 'safe' | 'free'
  tags: string[]
  /**
   * 이 캐릭터의 감정 코드표 — 번호 → 뜻.
   *
   * **캐릭터마다 다르다.** 처음에는 모든 인물이 같은 120칸 표를 쓴다고 가정했는데,
   * 실제 업로드는 인물마다 칸 수도 뜻도 다르고 수시로 바뀐다. 고정 표를 씌우면
   * 모델은 「2번 미소」를 부르는데 화면에는 전혀 다른 장면이 뜬다.
   * 그래서 뜻은 팩이 직접 들고 있는다.
   *
   * 서버 전용이다. 브라우저는 번호를 주소로 바꾸기만 하면 되고, 뜻을 알 필요가 없다.
   */
  codes: Record<string, string>
  /** 정지 이미지가 올라간 번호 */
  have: number[]
  /** 움직이는 webp 가 올라간 번호. have 의 부분집합이다 */
  haveMotion: number[]
}

export interface Character {
  workCode: string
  charCode: string
  pack: CharacterPack
}

/** 대화 한 턴. 브라우저와 서버가 같은 모양으로 주고받는다. */
export interface Turn {
  role: 'user' | 'assistant'
  content: string
}

/** 브라우저에 내려도 되는 팩 — 화면을 그리는 데 꼭 필요한 것만 남긴다. */
export interface PublicCharacterPack {
  name: string
  intro: string
  prologue: string
  firstMedia: FirstMedia | null
  tags: string[]
  have: number[]
  haveMotion: number[]
}

export interface PublicCharacter {
  workCode: string
  charCode: string
  pack: PublicCharacterPack
}

/**
 * 브라우저로 내보낼 몫만 남긴다.
 *
 * 페르소나(characterInfo·background)와 로어북, 금기 규칙은 이 서비스의 상품 그 자체다.
 * 한 번이라도 클라이언트로 나가면 소스 보기만으로 통째로 복사된다.
 * 이 앱이 모델을 브라우저에서 직접 부르지 않고 서버 라우트로 우회하는 이유가 이것이며,
 * 그 경계를 지키는 단 하나의 통로가 이 함수다.
 */
export function toPublicCharacter(c: Character): PublicCharacter {
  const p = c.pack
  return {
    workCode: c.workCode,
    charCode: c.charCode,
    pack: {
      name: p.name,
      intro: p.intro,
      prologue: p.prologue,
      firstMedia: p.firstMedia,
      tags: p.tags,
      have: p.have,
      haveMotion: p.haveMotion,
    },
  }
}
