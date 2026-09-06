/**
 * 환경변수 읽기.
 *
 * 값이 없으면 그 자리에서 던진다. 빈 문자열로 조용히 굴러가면
 * 나중에 "왜 401이 나지"를 한참 뒤에 알게 된다.
 */
export function required(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(`환경변수 ${name} 가 비어 있습니다. .env.local 을 확인하세요.`)
  }
  return v.trim()
}

export function optional(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}
