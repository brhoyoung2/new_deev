/**
 * 스트림 앞머리에서 번호를 뽑는다.
 *
 * 응답은 "31 저는… 기다렸어요." 처럼 번호로 시작한다. 그런데 스트리밍이라
 * "3" 과 "1 저는" 으로 쪼개져 도착한다. 그래서 번호를 다 읽을 때까지
 * 앞부분을 물고 있어야 한다.
 *
 * 번호가 없으면 **전부 대사로 흘린다.** 파싱 실패가 화면을 비우면 안 된다 —
 * 부르는 쪽이 직전 컷을 그대로 두면 된다.
 */
export function createCodeReader() {
  let head = ''
  let done = false

  return {
    push(chunk: string): { code: number | null; text: string } {
      if (done) return { code: null, text: chunk }

      head += chunk

      const m = /^\s*(\d{1,3})(\s)([\s\S]*)$/.exec(head)
      if (m) {
        done = true
        return { code: Number(m[1]), text: m[3] }
      }

      // 아직 숫자를 읽는 중이면 더 기다린다.
      if (/^\s*\d{1,3}$/.test(head)) return { code: null, text: '' }

      // 숫자로 시작하지 않는다 — 번호가 없는 응답이다.
      done = true
      const text = head
      head = ''
      return { code: null, text }
    },
  }
}
