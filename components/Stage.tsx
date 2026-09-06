'use client'

/**
 * 무대 — 미디어가 배경이 아니라 화면 그 자체다.
 *
 * 위아래 스크림은 장식이 아니라 글자 가독성을 위한 필수 장치다.
 * 밝은 컷에서도 흰 자막이 읽혀야 한다.
 */
export function Stage({ url }: { url: string | null }) {
  return (
    <div className="absolute inset-0 bg-[#2A2130]">
      {url && (
        // 움직이는 webp 와 정지 webp 를 같은 태그로 그린다 — 부르는 쪽은 차이를 모른다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
    </div>
  )
}
