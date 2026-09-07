'use client'

import { useEffect, useRef } from 'react'

/**
 * 자막 — 말풍선 스레드가 아니다.
 *
 * 지금 대사만 보여주고, 직전 대사는 흐리게 한 줄 남긴다. 대화 로그는
 * 오른쪽 서랍에 접혀 있다.
 *
 * 다만 이 캐릭터들의 응답은 3인칭 서술이 붙어 길어진다. 그래서 본문은
 * 화면 높이의 일부를 넘으면 **그 안에서 스크롤**한다 — 무대를 덮지 않으면서
 * 긴 글도 끝까지 읽을 수 있어야 한다.
 *
 * 스트리밍 중에는 새 글자가 아래로 쌓이므로 자동으로 따라 내려간다.
 * 단, 사용자가 위로 올려 읽는 중이면 끌어내리지 않는다.
 */
export function Caption({
  prev,
  now,
  thinking,
}: {
  prev: string | null
  now: string
  thinking?: boolean
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useEffect(() => {
    const el = boxRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [now])

  function onScroll() {
    const el = boxRef.current
    if (!el) return
    // 바닥에서 24px 안쪽이면 계속 따라간다.
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
  }

  return (
    <div className="px-5 pb-3">
      {prev && (
        <p className="m-0 mb-2 line-clamp-1 text-[13px] leading-relaxed text-[#EEE4F0]/40">
          {prev}
        </p>
      )}
      {thinking && now === '' && (
        // 추론이 도는 동안 자막이 비어 있다. 무언가 돌고 있다는 신호를 준다 —
        // 빈 화면은 멈춘 것과 구분되지 않는다.
        <p className="m-0 flex items-center gap-1.5 text-[15px] text-[#FFF8F4]/55">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#E4846B]" />
          생각하는 중…
        </p>
      )}
      <div
        ref={boxRef}
        onScroll={onScroll}
        className="max-h-[38dvh] overflow-y-auto overscroll-contain pr-1"
      >
        <p className="m-0 text-[17px] leading-[1.72] whitespace-pre-wrap text-[#FFF8F4] [text-shadow:0_1px_14px_rgba(8,4,12,0.9)]">
          {now}
        </p>
      </div>
    </div>
  )
}
