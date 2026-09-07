/**
 * OpenAI 호환 SSE 를 읽어 델타 문자열만 넘긴다.
 *
 * 청크는 줄 가운데에서 잘려 도착한다. 그래서 개행이 나올 때까지 물고 있는다.
 * 깨진 줄 하나 때문에 대화가 끊기면 안 되므로 건너뛴다.
 */

function emitLine(line: string, on: Handlers): void {
  if (!line.startsWith('data:')) return
  const payload = line.slice(5).trim()
  if (!payload || payload === '[DONE]') return
  try {
    const j = JSON.parse(payload)
    const d = j?.choices?.[0]?.delta
    // 추론이 켜져 있으면 생각이 reasoning_content 로 먼저 흐르고,
    // 대사는 그 뒤에 content 로 온다. 자막에는 대사만 올려야 한다.
    const think = d?.reasoning_content
    if (typeof think === 'string' && think) on.reasoning?.(think)
    const text = d?.content
    if (typeof text === 'string' && text) on.delta(text)
  } catch {
    return
  }
}

/**
 * 델타를 받는 쪽.
 *
 * `reasoning` 은 추론 모델일 때만 온다. 생각은 자막에 올리지 않고,
 * "생각 중" 을 보여주는 데만 쓴다 — 사용자는 빈 화면을 몇 초씩 보게 되므로
 * 무언가 돌고 있다는 신호가 필요하다.
 */
export interface Handlers {
  delta: (text: string) => void
  reasoning?: (text: string) => void
}

export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onDelta: ((text: string) => void) | Handlers,
): Promise<void> {
  const on: Handlers = typeof onDelta === 'function' ? { delta: onDelta } : onDelta
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    let nl: number
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      emitLine(line, on)
    }
  }

  // 마지막 조각이 UTF-8 한 글자 가운데에서 끝났을 수 있다.
  // 인자 없는 decode() 로 디코더에 남은 바이트를 마저 뱉게 한다.
  buf += decoder.decode()

  // 스트림이 개행 없이 끝나면 남은 줄도 처리한다.
  if (buf.trim()) {
    emitLine(buf.trim(), on)
  }
}
