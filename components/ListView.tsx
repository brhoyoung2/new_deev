'use client'

import type { PublicCharacter } from '@/lib/pack'
import { resolveMedia } from '@/lib/media'

export function ListView({
  characters,
  cdnBase,
  activeIndex,
  onPick,
  onClose,
}: {
  characters: PublicCharacter[]
  cdnBase: string
  activeIndex: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#16121C]">
      <div className="flex items-baseline gap-3 border-b border-white/10 px-4 py-3">
        <h1 className="m-0 flex-1 text-[17px] font-bold">오늘 누구와</h1>
        <span className="font-mono text-[10px] text-white/50">{characters.length}명</span>
        <button onClick={onClose} aria-label="닫기" className="text-[18px] text-white/70">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {characters.map((c, i) => {
          // 주소 규칙은 lib/media.ts 한 곳에만 둔다 — 여기서 다시 만들지 않는다.
          const thumbN = c.pack.have[0]
          const thumb = thumbN === undefined ? null : resolveMedia(c, thumbN, cdnBase)

          return (
            <button
              key={`${c.workCode}/${c.charCode}`}
              onClick={() => onPick(i)}
              className={`grid w-full grid-cols-[62px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-[#221C2B] p-2 text-left ${
                i === activeIndex ? 'outline outline-1 outline-[#E4846B]' : ''
              }`}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb.url} alt="" className="h-[82px] w-full rounded-md object-cover" />
              ) : (
                <div className="h-[82px] w-full rounded-md bg-[#2A2130]" />
              )}
              <div className="min-w-0">
                <h2 className="m-0 mb-1 text-[14px] font-medium">{c.pack.name}</h2>
                <p className="m-0 line-clamp-2 text-[11px] leading-snug text-white/55">
                  {c.pack.intro}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.pack.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-[#16121C] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
                      {t}
                    </span>
                  ))}
                  <span className="rounded bg-[#16121C] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
                    {c.pack.haveMotion.length > 0 ? `영상 ${c.pack.haveMotion.length}` : '정지만'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
