/**
 * 응답에 섞여 온 이미지 주소를 걷어내고, 어떤 컷인지 알아낸다.
 *
 * 캐릭터는 장면 첫머리에 전체 주소를 적는다:
 *
 *   https://…cloudfront.net/bjbj/yunserin/2.webp
 *   *문이 조금 열린다.*
 *   윤세린 | …야. 아직 안 잤어?
 *
 * 주소는 자막에 보여줄 것이 아니므로 본문에서 뺀다. 번호는 무대를 갈아 끼우는 데 쓴다.
 *
 * ── 남의 주소는 받지 않는다 ──────────────────────────────
 * 모델이 뱉은 문자열을 그대로 화면에 띄우면, 호스트를 잘못 적거나 지어내도
 * 그대로 따라간다. 그래서 **우리 CDN·이 캐릭터·가진 번호**인 것만 통과시킨다.
 * 어긋나면 무시하고 직전 컷을 유지한다 — 화면이 비는 것보다 낫다.
 *
 * ── 반쯤 온 주소 ─────────────────────────────────────────
 * 스트리밍이라 `https://…/bjbj/yunser` 까지만 도착하는 순간이 있다.
 * 그 조각이 자막에 잠깐 스치면 눈에 띈다. 그래서 끝나지 않은 주소도 본문에서 뺀다.
 *
 * ── 빈 줄 ────────────────────────────────────────────────
 * 주소만 있던 줄은 통째로 사라져야 한다. 자리에 빈 줄을 남기면 문단이
 * 어긋난다. 반대로 **원래 있던 빈 줄은 그대로 둔다** — 서술의 호흡이다.
 */

export interface StripOptions {
  cdnBase: string
  workCode: string
  charCode: string
  /** 이 캐릭터가 실제로 가진 번호 */
  have: number[]
}

/** 완성된 이미지 주소. 마크다운 이미지 문법으로 감싸 와도 잡는다. */
const FULL = /!?\[[^\]]*\]\(\s*(https?:\/\/\S+?\.webp)\s*\)|(https?:\/\/\S+?\.webp)/g
/** 아직 끝나지 않은 주소 — 응답 꼬리에 걸린 조각만 해당한다. */
const PARTIAL = /(?:!?\[[^\]]*\]\(\s*)?https?:\/\/\S*$/

export function stripImages(
  text: string,
  opt: StripOptions,
): { body: string; code: number | null } {
  if (!text) return { body: '', code: null }

  const prefix = `${opt.cdnBase.replace(/\/+$/, '')}/${opt.workCode}/${opt.charCode}/`
  let code: number | null = null

  const take = (url: string): void => {
    if (!url.startsWith(prefix)) return
    const n = Number(url.slice(prefix.length).replace(/\.webp$/, ''))
    // 가진 번호일 때만 받는다. 아니면 주소만 지우고 컷은 그대로 둔다.
    if (Number.isInteger(n) && opt.have.includes(n)) code = n
  }

  const lines = text.split('\n')
  const kept: string[] = []

  lines.forEach((line, i) => {
    const hadText = line.trim() !== ''

    let out = line.replace(FULL, (_whole, inMarkdown?: string, bare?: string) => {
      take(inMarkdown ?? bare ?? '')
      return ''
    })

    // 잘린 주소는 마지막 줄에만 있을 수 있다.
    if (i === lines.length - 1) out = out.replace(PARTIAL, '')

    out = out.replace(/[ \t]{2,}/g, ' ').trim()

    // 주소만 있던 줄은 흔적을 남기지 않는다. 원래 빈 줄은 살린다.
    if (hadText && out === '') return
    kept.push(out)
  })

  return { body: kept.join('\n').replace(/^\n+/, '').replace(/\s+$/, ''), code }
}
