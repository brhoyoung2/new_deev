/**
 * OpenAI 호환 SSE 를 읽어 델타 문자열만 넘긴다.
 *
 * 청크는 줄 가운데에서 잘려 도착한다. 그래서 개행이 나올 때까지 물고 있는다.
 * 깨진 줄 하나 때문에 대화가 끊기면 안 되므로 건너뛴다.
 */

function emitLine(line: string, onDelta: (text: string) => void): void {
  if (!line.startsWith('data:')) return
  const payload = line.slice(5).trim()
  if (!payload || payload === '[DONE]') return
  try {
    const j = JSON.parse(payload)
    const text = j?.choices?.[0]?.delta?.content
    if (typeof text === 'string' && text) onDelta(text)
  } catch {
    return
  }
}

export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<void> {
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
      emitLine(line, onDelta)
    }
  }

  // 마지막 조각이 UTF-8 한 글자 가운데에서 끝났을 수 있다.
  // 인자 없는 decode() 로 디코더에 남은 바이트를 마저 뱉게 한다.
  buf += decoder.decode()

  // 스트림이 개행 없이 끝나면 남은 줄도 처리한다.
  if (buf.trim()) {
    emitLine(buf.trim(), onDelta)
  }
}
