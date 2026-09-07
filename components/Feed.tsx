'use client'

import { useEffect, useRef, useState } from 'react'
import type { PublicCharacter, Turn } from '@/lib/pack'
import { resolveMedia } from '@/lib/media'
import { stripImages } from '@/lib/parseImage'
import { readSSE } from '@/lib/sse'
import { loadHistory, saveHistory, historyKey } from '@/lib/history'
import { splitInfo, type TurnInfo } from '@/lib/parseInfo'
import { Stage } from './Stage'
import { Caption } from './Caption'
import { InfoPanel } from './InfoPanel'
import { Composer } from './Composer'
import { HistoryDrawer } from './HistoryDrawer'
import { ListView } from './ListView'

export function Feed({ characters, cdnBase }: { characters: PublicCharacter[]; cdnBase: string }) {
  const [index, setIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [now, setNow] = useState('')
  const [prev, setPrev] = useState<string | null>(null)
  const [info, setInfo] = useState<TurnInfo | null>(null)

  /**
   * 응답 전문을 본문과 상태창으로 갈라 화면에 넣는다.
   *
   * 스트리밍 중에는 info 블록이 아직 안 왔을 수 있다. 그때 상태창을 비우면
   * 게이지가 매 턴 깜빡이므로, 새 것이 올 때까지 직전 값을 그대로 둔다.
   */
  function paint(full: string, forChar: PublicCharacter) {
    // 주소를 먼저 걷어낸다. 그래야 상태창 파서가 깨끗한 글만 본다.
    const img = stripImages(full, {
      cdnBase,
      workCode: forChar.workCode,
      charCode: forChar.charCode,
      have: forChar.pack.have,
    })
    const { body, info: got } = splitInfo(img.body)
    setNow(body)
    if (got) setInfo(got)
    // 못 알아본 주소면 직전 컷을 그대로 둔다.
    if (img.code !== null) setCode(img.code)
  }
  const [code, setCode] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState(false)
  const touchStartY = useRef<number | null>(null)
  // 세대 번호 — 지금 화면에 붙어 있는 대화가 몇 번째인지 센다.
  // 캐릭터를 바꾸면 이 번호가 올라가고, 그 전 캐릭터의 send() 가 나중에
  // 응답을 받아도 자기 세대가 낡은 걸 보고 화면을 건드리지 않는다.
  const genRef = useRef(0)

  const c = characters[index]

  // 캐릭터가 바뀌면 그 캐릭터의 기록과 프롤로그로 갈아 끼운다.
  useEffect(() => {
    if (!c) return
    genRef.current += 1
    const saved = loadHistory(historyKey(c.workCode, c.charCode))
    setTurns(saved)
    setPrev(null)
    const last = [...saved].reverse().find((t) => t.role === 'assistant')
    const opening = last ? last.content : c.pack.prologue
    const split = splitInfo(opening)
    setNow(split.body)
    setInfo(split.info)
    // firstMedia 가 없거나 그 번호의 파일이 실제로 없으면 첫 컷이 빈다 —
    // 이 화면이 막으려는 바로 그 실패다. 가진 첫 번호로 물러선다.
    const first = c.pack.firstMedia
    setCode(first && c.pack.have.includes(first.n) ? first.n : (c.pack.have[0] ?? null))
    setThinking(false)
    setBusy(false)
  }, [c])

  if (!c) {
    return <main className="grid h-dvh place-items-center text-[13px] text-white/50">캐릭터가 없습니다.</main>
  }

  const media = code !== null ? resolveMedia(c, code, cdnBase) : null

  async function send(text: string) {
    // 이 전송이 속한 세대를 못박는다. 그 사이 캐릭터가 바뀌면 genRef.current 가
    // 앞서가고, 아래의 모든 화면 갱신은 자기 세대가 낡았음을 보고 조용히 건너뛴다.
    genRef.current += 1
    const gen = genRef.current
    const forChar = c

    setBusy(true)
    setPrev(now)
    setNow('')

    const nextTurns: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(nextTurns)

    let answer = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workCode: forChar.workCode,
          charCode: forChar.charCode,
          message: text,
          // 이번 메시지는 message 로 따로 간다. history 는 그 앞의 기록이다.
          history: turns.slice(-12),
        }),
      })

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: '잠시 뒤 다시 시도해주세요.' }))
        if (genRef.current === gen) {
          setNow(j.error ?? '잠시 뒤 다시 시도해주세요.')
          setThinking(false)
          setBusy(false)
        }
        return
      }

      await readSSE(res.body, {
        // 생각은 자막에 올리지 않는다. 도는 중이라는 표시에만 쓴다.
        reasoning: () => {
          if (genRef.current === gen) setThinking(true)
        },
        delta: (d) => {
          answer += d
          // 매번 전문을 다시 가른다 — 주소가 청크 경계에서 잘려도 온전해진 뒤에 잡힌다.
          if (genRef.current === gen) {
          setThinking(false)
          setBusy(false)
            paint(answer, forChar)
          }
        },
      })
    } catch {
      if (genRef.current === gen) {
        setNow('연결이 끊겼어요. 잠시 뒤 다시 시도해주세요.')
        setThinking(false)
        setBusy(false)
      }
      return
    }

    const done: Turn[] = [...nextTurns, { role: 'assistant', content: answer }]
    // 화면에서 떠난 뒤에도 그 캐릭터의 기록은 저장한다 — 대화는 유효했다.
    saveHistory(historyKey(forChar.workCode, forChar.charCode), done)
    if (genRef.current === gen) {
      setTurns(done)
      setThinking(false)
      setBusy(false)
    }
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
          <InfoPanel info={info} />
          <Caption prev={prev} now={now} thinking={thinking} />
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
