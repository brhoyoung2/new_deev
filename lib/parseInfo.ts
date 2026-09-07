/**
 * 응답 끝의 info 블록을 본문에서 떼어낸다.
 *
 * 캐릭터는 매 턴 이런 꼬리를 붙인다:
 *
 *   📍 거실
 *   🕐 3일차 02:00
 *   🤍 등급: 타인
 *   💗 친밀도: 4 / 100
 *   '방금 그 표정은 뭐지?'
 *
 * 이건 대사가 아니라 상태창이다. 자막에 섞어 흘리면 화면을 덮으므로
 * 여기서 갈라 놓고, 별도 패널이 받아 그린다.
 *
 * **관대하게 읽는다.** 모델은 굵게 표시를 넣기도 하고, 전각 콜론을 쓰기도 하고,
 * 줄 하나를 빠뜨리기도 한다. 한 줄이 어긋났다고 상태창 전체를 버리면
 * 게이지가 매 턴 깜빡인다 — 읽히는 것만 채우고 나머지는 비워 둔다.
 */

export interface TurnInfo {
  place: string | null
  time: string | null
  gradeEmoji: string | null
  grade: string | null
  affinity: number | null
  affinityMax: number | null
  monologue: string | null
}

/** info 블록의 시작을 알리는 첫 줄. 장소 표시가 그 자리다. */
const PLACE = /^\s*📍\s*(.*)$/
const TIME = /^\s*🕐\s*(.*)$/
/** 등급 이모지는 단계마다 바뀐다(🤍🩶💙💜🧡❤️👑). 뒤에 '등급'이 오는 줄로 찾는다. */
const GRADE = /^\s*(\S+)\s*\**\s*등급\s*\**\s*[:：]\s*(.*)$/
const AFFINITY = /^\s*💗\s*\**\s*친밀도\s*\**\s*[:：]\s*(.*)$/
/** 독백은 따옴표로 감싸 온다. 굽은 따옴표도 쓴다. */
const MONOLOGUE = /^\s*['‘"“](.+?)['’"”]\s*$/

/** 값에서 굵게 표시와 괄호 주석을 걷어낸다. */
function clean(v: string): string {
  return v
    .replace(/\*\*/g, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

export function splitInfo(text: string): { body: string; info: TurnInfo | null } {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => PLACE.test(l))
  if (start === -1) return { body: text, info: null }

  const body = lines.slice(0, start).join('\n').replace(/\s+$/, '')
  const tail = lines.slice(start)

  const info: TurnInfo = {
    place: null,
    time: null,
    gradeEmoji: null,
    grade: null,
    affinity: null,
    affinityMax: null,
    monologue: null,
  }

  for (const line of tail) {
    let m: RegExpExecArray | null

    if ((m = PLACE.exec(line))) {
      info.place = clean(m[1]) || null
      continue
    }
    if ((m = TIME.exec(line))) {
      info.time = clean(m[1]) || null
      continue
    }
    if ((m = AFFINITY.exec(line))) {
      const nums = clean(m[1]).match(/(\d+)\s*\/\s*(\d+)/)
      if (nums) {
        info.affinity = Number(nums[1])
        info.affinityMax = Number(nums[2])
      }
      continue
    }
    if ((m = GRADE.exec(line))) {
      info.gradeEmoji = m[1] === '**' ? null : m[1]
      info.grade = clean(m[2]) || null
      continue
    }
    if ((m = MONOLOGUE.exec(line))) {
      info.monologue = m[1].trim() || null
      continue
    }
  }

  return { body, info }
}
