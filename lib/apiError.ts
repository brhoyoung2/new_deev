/**
 * 응답 규약.
 *
 * 에러는 브라우저가 그대로 사람에게 보여줄 수 있는 한국어 한 문장이다.
 * 스택이나 내부 사정은 담지 않는다.
 */
export function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

export function ok(data: unknown): Response {
  return Response.json(data)
}
