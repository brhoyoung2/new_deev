'use client'

import { useState } from 'react'

export function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean
  onSend: (text: string) => void
}) {
  const [text, setText] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || disabled) return
    setText('')
    onSend(t)
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-4 pb-5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? '기다리는 중…' : '메시지'}
        disabled={disabled}
        className="flex-1 rounded-full border border-white/20 bg-black/55 px-4 py-2.5 text-[13px] text-white placeholder:text-white/45 outline-none backdrop-blur focus:border-[#E4846B] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="보내기"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E4846B] text-[15px] text-[#1B1017] disabled:opacity-50"
      >
        ↑
      </button>
    </form>
  )
}
