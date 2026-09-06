'use client'

import { useEffect, useRef, useState } from 'react'
import type { Character, Turn } from '@/lib/pack'
import { resolveMedia } from '@/lib/media'
import { labelOf } from '@/lib/codes'
import { createCodeReader } from '@/lib/parseCode'
import { readSSE } from '@/lib/sse'
import { loadHistory, saveHistory, historyKey } from '@/lib/history'
import { Stage } from './Stage'
import { Caption } from './Caption'
import { Composer } from './Composer'
import { HistoryDrawer } from './HistoryDrawer'
import { ListView } from './ListView'

export function Feed({ characters, cdnBase }: { characters: Character[]; cdnBase: string }) {
  const [index, setIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [now, setNow] = useState('')
  const [prev, setPrev] = useState<string | null>(null)
  const [code, setCode] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const c = characters[index]

  // 캐릭터가 바뀌면 그 캐릭터의 기록과 프롤로그로 갈아 끼운다.
  useEffect(() => {
    if (!c) return
    const saved = loadHistory(historyKey(c.workCode, c.charCode))
    setTurns(saved)
    setPrev(null)
    const last = [...saved].reverse().find((t) => t.role === 'assistant')
    setNow(last ? last.content : c.pack.prologue)
    setCode(c.pack.firstMedia ? c.pack.firstMedia.n : (c.pack.have[0] ?? null))
  }, [c])

  if (!c) {
    return <main className="grid h-dvh place-items-center text-[13px] text-white/50">캐릭터가 없습니다.</main>
  }

  const media = code !== null ? resolveMedia(c, code, cdnBase) : null

  async function send(text: string) {
    setBusy(true)
    setPrev(now)
    setNow('')

    const nextTurns: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(nextTurns)

    const reader = createCodeReader()
    let answer = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workCode: c.workCode,
          charCode: c.charCode,
          message: text,
          history: nextTurns.slice(-12),
        }),
      })

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: '잠시 뒤 다시 시도해주세요.' }))
        setNow(j.error ?? '잠시 뒤 다시 시도해주세요.')
        setBusy(false)
        return
      }

      await readSSE(res.body, (delta) => {
        const got = reader.push(delta)
        // 번호를 못 읽으면 직전 컷을 그대로 둔다 — 화면을 비우지 않는다.
        if (got.code !== null) setCode(got.code)
        if (got.text) {
          answer += got.text
          setNow(answer)
        }
      })

      // 스트림이 끝났을 때 아직 번호를 물고 있던 앞부분이 있으면 대사로 흘려보낸다.
      const tail = reader.flush()
      if (tail) {
        answer += tail
        setNow(answer)
      }
    } catch {
      setNow('연결이 끊겼어요. 잠시 뒤 다시 시도해주세요.')
      setBusy(false)
      return
    }

    const done: Turn[] = [...nextTurns, { role: 'assistant', content: answer }]
    setTurns(done)
    saveHistory(historyKey(c.workCode, c.charCode), done)
    setBusy(false)
  }

  return (
    <main
      className="relative h-dvh w-full overflow-hidden"
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY
      }}
      onTouchEnd={(e) => {
        const start = touchStartY.current
        touchStartY.current = null
        if (start === null || busy) return
        const dy = start - e.changedTouches[0].clientY
        // 위로 밀면 다음 캐릭터. 리스트로 돌아가지 않는다.
        if (dy > 70) setIndex((i) => (i + 1) % characters.length)
        else if (dy < -70) setIndex((i) => (i - 1 + characters.length) % characters.length)
      }}
    >
      <Stage url={media?.url ?? null} />

      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 pt-8">
          <button
            onClick={() => setListOpen(true)}
            aria-label="캐릭터 목록"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/50 text-[12px] backdrop-blur"
          >
            ☰
          </button>
          <span className="text-[14px] font-medium">{c.pack.name}</span>
        </div>

        <div className="mt-auto">
          <Caption prev={prev} now={now} label={code !== null ? `${code} · ${labelOf(code) ?? ''}` : null} />
          <Composer disabled={busy} onSend={send} />
        </div>
      </div>

      <div className="absolute bottom-44 right-3 flex flex-col items-center gap-1">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="대화 기록"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/50 text-[14px] backdrop-blur"
        >
          ☰
        </button>
        <span className="font-mono text-[8px] text-white/55">기록</span>
      </div>

      {characters.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 text-center font-mono text-[8px] tracking-widest text-white/30">
          ▲ 위로 밀면 다음 캐릭터
        </div>
      )}

      <HistoryDrawer open={drawerOpen} turns={turns} onClose={() => setDrawerOpen(false)} />

      {listOpen && (
        <ListView
          characters={characters}
          cdnBase={cdnBase}
          activeIndex={index}
          onPick={(i) => {
            setIndex(i)
            setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  )
}
