'use client'

import type { TurnInfo } from '@/lib/parseInfo'

/**
 * 상태창 — 장소·시간·등급·친밀도, 그리고 내면 독백.
 *
 * 자막과 섞지 않는다. 대사는 읽고 흘려보내는 것이고 이것은 계속 붙어 있는
 * 계기판이다. 게이지가 매 턴 조금씩 차는 걸 눈으로 봐야 육성이 성립한다.
 *
 * 한 줄이 비어 오는 일은 흔하다(모델이 빠뜨린다). 비면 그 자리만 지운다.
 */
export function InfoPanel({ info }: { info: TurnInfo | null }) {
  if (!info) return null

  const hasGauge = info.affinity !== null && info.affinityMax !== null && info.affinityMax > 0
  const pct = hasGauge ? Math.min(100, Math.max(0, (info.affinity! / info.affinityMax!) * 100)) : 0

  return (
    <div className="px-5 pb-2.5">
      <div className="rounded-xl border border-white/12 bg-black/45 px-3.5 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-white/70">
          {info.place && <span>📍 {info.place}</span>}
          {info.time && <span>🕐 {info.time}</span>}
          {info.grade && (
            <span className="text-white/90">
              {info.gradeEmoji ?? '🤍'} {info.grade}
            </span>
          )}
        </div>

        {hasGauge && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#E4846B] transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-white/60">
              {info.affinity}/{info.affinityMax}
            </span>
          </div>
        )}

        {info.monologue && (
          <p className="mt-2 mb-0 text-[11.5px] leading-relaxed text-white/55 italic">
            {info.monologue}
          </p>
        )}
      </div>
    </div>
  )
}
