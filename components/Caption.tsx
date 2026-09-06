'use client'

/**
 * 자막 — 말풍선 스레드가 아니다.
 *
 * 지금 대사 한 줄만 크게, 직전 대사는 흐리게 한 줄. 스크롤되지 않는다.
 * 나중에 음성을 켜면 이 자리가 그대로 음성 자막이 된다.
 */
export function Caption({ prev, now }: { prev: string | null; now: string }) {
  return (
    <div className="px-5 pb-3">
      {prev && (
        <p className="m-0 mb-2 text-[13px] leading-relaxed text-[#EEE4F0]/40 line-clamp-1">
          {prev}
        </p>
      )}
      <p className="m-0 text-[21px] leading-relaxed text-[#FFF8F4] [text-shadow:0_1px_14px_rgba(8,4,12,0.9)] text-balance">
        {now}
      </p>
    </div>
  )
}
