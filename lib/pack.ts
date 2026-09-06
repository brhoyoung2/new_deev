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
