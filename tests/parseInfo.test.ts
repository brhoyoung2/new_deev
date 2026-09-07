import { describe, it, expect } from 'vitest'
import { splitInfo } from '@/lib/parseInfo'

describe('splitInfo', () => {
  it('info 블록을 본문에서 떼어낸다', () => {
    const got = splitInfo(
      [
        '*새벽 두 시. 방문이 조금 열린다.*',
        '윤세린 | …야. 아직 안 잤어?',
        '',
        '📍 거실',
        '🕐 3일차 02:00',
        '🤍 등급: 타인',
        '💗 친밀도: 4 / 100',
        '',
        "'방금 그 표정은 뭐지?'",
      ].join('\n'),
    )
    expect(got.body).toBe('*새벽 두 시. 방문이 조금 열린다.*\n윤세린 | …야. 아직 안 잤어?')
    expect(got.info).toEqual({
      place: '거실',
      time: '3일차 02:00',
      gradeEmoji: '🤍',
      grade: '타인',
      affinity: 4,
      affinityMax: 100,
      monologue: '방금 그 표정은 뭐지?',
    })
  })

  it('굵게 표시와 전각 콜론도 읽는다', () => {
    const got = splitInfo(
      ['본문', '📍 부엌', '🕐 밤', '💜 **등급**：특별한 감정', '💗 **친밀도**：72 / 100'].join('\n'),
    )
    expect(got.info?.grade).toBe('특별한 감정')
    expect(got.info?.gradeEmoji).toBe('💜')
    expect(got.info?.affinity).toBe(72)
  })

  it('info 가 아직 안 왔으면 전부 본문이다 — 스트리밍 중', () => {
    const got = splitInfo('*불이 꺼진다.*\n윤세린 | 아직')
    expect(got.body).toBe('*불이 꺼진다.*\n윤세린 | 아직')
    expect(got.info).toBeNull()
  })

  it('닫는 태그 같은 찌꺼기를 버린다', () => {
    const got = splitInfo(['본문', '📍 방', '🕐 새벽', '💗 친밀도: 10 / 100', '</div>'].join('\n'))
    expect(got.info?.place).toBe('방')
    expect(got.body).toBe('본문')
  })

  it('독백은 홑따옴표든 굽은 따옴표든 읽는다', () => {
    const a = splitInfo(['본문', '📍 방', "'왜 웃었을까'"].join('\n'))
    const b = splitInfo(['본문', '📍 방', '‘왜 웃었을까’'].join('\n'))
    expect(a.info?.monologue).toBe('왜 웃었을까')
    expect(b.info?.monologue).toBe('왜 웃었을까')
  })

  it('일부 줄만 와도 있는 것만 채운다', () => {
    const got = splitInfo(['본문', '📍 옥상'].join('\n'))
    expect(got.info).not.toBeNull()
    expect(got.info?.place).toBe('옥상')
    expect(got.info?.grade).toBeNull()
    expect(got.info?.affinity).toBeNull()
  })

  it('본문이 비어도 죽지 않는다', () => {
    expect(splitInfo('')).toEqual({ body: '', info: null })
  })

  it('친밀도가 숫자가 아니면 비워 둔다 — 화면이 깨지지 않게', () => {
    const got = splitInfo(['본문', '📍 방', '💗 친밀도: 알 수 없음'].join('\n'))
    expect(got.info?.affinity).toBeNull()
    expect(got.info?.affinityMax).toBeNull()
  })
})
