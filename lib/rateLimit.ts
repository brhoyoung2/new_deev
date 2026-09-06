/**
 * IP 기준 인메모리 rate limiter.
 *
 * 한계: Vercel 서버리스 인스턴스마다 카운터가 독립이므로 정확하지 않다.
 * 목적은 정밀한 제한이 아니라 스크립트성 남용의 1차 차단이다.
 * 실제 남용이 발생하면 Upstash Redis 등 외부 스토어로 승격한다.
 *
 * 메모리 보호: `x-forwarded-for`는 클라이언트가 임의로 위조할 수 있으므로
 * 서로 다른 위조 IP로 계속 요청하면 매번 새 버킷(키)이 생성될 수 있다.
 * 이를 대비해 (1) 만료된 버킷은 호출 경로와 무관하게 매 호출마다 정리하고,
 * (2) 정리 후에도 버킷 수가 상한을 넘으면 가장 오래된 버킷을 제거해
 * 처음 보는 키가 계속 들어와도 맵 크기가 상한 이상으로 자라지 않게 한다.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 5000;

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** 만료된 버킷을 제거한다. 호출되는 분기와 무관하게 매 요청마다 실행되어야 한다. */
function pruneExpired(now: number): void {
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k);
  }
}

/** 초과 시 사용자에게 보여줄 메시지, 통과 시 null. */
export function checkRateLimit(req: Request, key: string, limit: number): string | null {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();

  // 어느 분기로 가든(신규 키든 기존 키든) 만료분은 항상 먼저 정리한다.
  pruneExpired(now);

  const bucket = buckets.get(id);

  if (!bucket || now >= bucket.resetAt) {
    // 정리 후에도 상한을 넘으면(= 처음 보는 위조 키가 계속 몰리는 상황)
    // 가장 오래된 버킷부터 제거한다. Map은 삽입 순서를 보존한다.
    if (buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const waitSec = Math.ceil((bucket.resetAt - now) / 1000);
    return `요청이 너무 많습니다. ${waitSec}초 후 다시 시도해주세요.`;
  }

  return null;
}
