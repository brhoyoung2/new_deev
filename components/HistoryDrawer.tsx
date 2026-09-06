'use client'

import type { Turn } from '@/lib/pack'

/**
 * 기록 서랍.
 *
 * 기본 화면에 로그를 깔면 몰입이 사라지고 자막이 설 자리도 없다.
 * 그래서 접어 두고 눌러서 연다.
 */
export function HistoryDrawer({
  open,
  turns,
  onClose,
}: {
  open: boolean
  turns: Turn[]
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#16121C]/97 backdrop-blur">
      <div className="flex items-center border-b border-white/10 px-4 py-3">
        <span className="flex-1 text-[14px] font-medium">대화 기록</span>
        <button onClick={onClose} aria-label="닫기" className="text-[18px] text-white/70">
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {turns.length === 0 && <p className="text-[13px] text-white/45">아직 나눈 말이 없어요.</p>}
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === 'user'
                ? 'ml-auto max-w-[84%] rounded-xl rounded-br bg-[#2E2739] px-3 py-2 text-[13px]'
                : 'mr-auto max-w-[84%] rounded-xl rounded-bl bg-[#221C2B] px-3 py-2 text-[13px]'
            }
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}
